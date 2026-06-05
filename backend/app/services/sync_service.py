import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.integrations.sosovalue.client import SoSoValueClient
from app.models.market_regime import MarketRegime
from app.models.sodex_account import SodexAccount
from app.models.sosovalue_event import SoSoValueEvent
from app.models.wallet import Wallet
from app.services.sodex_ingestion import SodexIngestionService

settings = get_settings()


class SyncService:
    def __init__(self) -> None:
        self.sosovalue = SoSoValueClient()
        self.sodex_ingestion = SodexIngestionService()

    async def sync_user_data(self, db: AsyncSession, user_id: UUID) -> dict:
        wallet_result = await db.execute(select(Wallet).where(Wallet.user_id == user_id).limit(1))
        wallet = wallet_result.scalar_one_or_none()
        if not wallet:
            return {"status": "no_wallet", "warnings": ["No wallet linked to user account."]}

        sodex_result = await db.execute(
            select(SodexAccount).where(SodexAccount.wallet_id == wallet.id).limit(1)
        )
        sodex_account = sodex_result.scalar_one_or_none()

        ingestion = await self.sodex_ingestion.ingest_account_data(
            db, user_id, wallet.address, sodex_account, wallet_id=wallet.id
        )

        if ingestion.get("account_id") and not sodex_account:
            sodex_result = await db.execute(
                select(SodexAccount).where(SodexAccount.wallet_id == wallet.id).limit(1)
            )
            sodex_account = sodex_result.scalar_one_or_none()

        soso_stats = await self._sync_sosovalue_events(db)
        regime_stats = await self._derive_market_regimes(db)

        warnings: list[str] = list(ingestion.get("warnings", []))
        if soso_stats.get("error"):
            warnings.append(str(soso_stats["error"]))
        if ingestion.get("trades_imported", 0) == 0 and ingestion.get("account_state_found"):
            warnings.append("SoDEX account found but no trades returned by API. Place testnet trades and re-sync.")
        if ingestion.get("snapshots_imported", 0) == 0:
            warnings.append("No orderbook snapshots imported. Heatmaps and replay may be unavailable.")

        await db.flush()
        return {
            "status": "completed",
            "account_id": ingestion.get("account_id"),
            "account_state_found": ingestion.get("account_state_found", False),
            "trades_imported": ingestion.get("trades_imported", 0),
            "snapshots_imported": ingestion.get("snapshots_imported", 0),
            "sosovalue_events_synced": soso_stats.get("synced", 0),
            "regimes_updated": regime_stats.get("updated", 0),
            "spot_balance": ingestion.get("spot_balance"),
            "perps_positions": ingestion.get("perps_positions"),
            "warnings": warnings,
        }

    async def _sync_sosovalue_events(self, db: AsyncSession) -> dict:
        if not settings.sosovalue_api_key:
            return {"synced": 0, "error": "missing_sosovalue_api_key"}

        synced = 0
        news, macro, pair = await asyncio.gather(
            self.sosovalue.get_hot_news(),
            self.sosovalue.get_macro_events(),
            self.sosovalue.get_pair_market("BTC"),
        )

        candidates: list[tuple[str, dict]] = []
        for event_type, items in [("news", news), ("macro", macro)]:
            for item in items[:10]:
                candidates.append((event_type, item))

        if pair:
            source_id = f"pair-market-btc-{pair.get('symbol', 'BTC')}"
            candidates.append(("pair_market", {"id": source_id, **pair}))

        source_ids = [
            str(item.get("id") or item.get("eventId") or item.get("title") or item.get("name", "unknown"))
            for _, item in candidates
        ]
        existing_result = await db.execute(
            select(SoSoValueEvent.source_id).where(SoSoValueEvent.source_id.in_(source_ids))
        )
        existing_ids = set(existing_result.scalars().all())

        for event_type, item in candidates:
            if await self._upsert_event(db, event_type, item, existing_ids):
                synced += 1

        return {"synced": synced}

    async def _upsert_event(
        self,
        db: AsyncSession,
        event_type: str,
        item: dict,
        existing_ids: set[str] | None = None,
    ) -> bool:
        source_id = str(item.get("id") or item.get("eventId") or item.get("title") or item.get("name", "unknown"))
        if existing_ids is not None:
            if source_id in existing_ids:
                return False
        else:
            existing = await db.execute(select(SoSoValueEvent).where(SoSoValueEvent.source_id == source_id))
            if existing.scalar_one_or_none():
                return False

        published_at = self._parse_published_at(item)
        symbols = item.get("symbols") or item.get("tickers") or ["BTC"]
        if isinstance(symbols, str):
            symbols = [symbols]

        db.add(
            SoSoValueEvent(
                event_type=event_type,
                source_id=source_id,
                published_at=published_at,
                symbols=symbols,
                title=item.get("title") or item.get("name"),
                summary=item.get("summary") or item.get("content"),
                sentiment_score=item.get("sentiment"),
                importance_score=item.get("importance") or item.get("score"),
                payload=item,
            )
        )
        return True

    async def _derive_market_regimes(self, db: AsyncSession) -> dict:
        from app.models.liquidity_snapshot import LiquiditySnapshot

        result = await db.execute(
            select(LiquiditySnapshot)
            .where(LiquiditySnapshot.symbol.in_(["BTC-USD", "BTC-PERP"]))
            .order_by(LiquiditySnapshot.timestamp.desc())
            .limit(1)
        )
        snapshot = result.scalar_one_or_none()
        if not snapshot:
            return {"updated": 0}

        spread = float(snapshot.spread_bps)
        regime_type = "spread_expansion" if spread > 10 else "stable_liquidity" if spread < 6 else "thin_liquidity"
        confidence = min(0.99, 0.5 + spread / 40)

        existing = await db.execute(
            select(MarketRegime)
            .where(MarketRegime.symbol.in_(["BTC-USD", "BTC-PERP"]), MarketRegime.end_at.is_(None))
            .limit(1)
        )
        regime = existing.scalar_one_or_none()
        if regime:
            regime.regime_type = regime_type
            regime.confidence = spread / 20
            regime.features = {
                "spread_bps": spread,
                "imbalance": float(snapshot.imbalance_score),
                "bid_depth_1pct": float(snapshot.bid_depth_1pct),
                "ask_depth_1pct": float(snapshot.ask_depth_1pct),
            }
        else:
            db.add(
                MarketRegime(
                    symbol=snapshot.symbol,
                    start_at=snapshot.timestamp,
                    end_at=None,
                    regime_type=regime_type,
                    confidence=confidence,
                    features={
                        "spread_bps": spread,
                        "imbalance": float(snapshot.imbalance_score),
                    },
                )
            )
        return {"updated": 1}

    def _parse_published_at(self, item: dict) -> datetime:
        for key in ("release_time", "publishedAt", "published_at", "time", "createdAt", "date"):
            value = item.get(key)
            if value is None:
                continue
            if isinstance(value, (int, float)):
                if value > 1_000_000_000_000:
                    value = value / 1000
                return datetime.fromtimestamp(value, tz=timezone.utc)
            try:
                return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            except ValueError:
                continue
        return datetime.now(timezone.utc)
