# Soso DNA Architecture

## Overview

Monorepo with `frontend/`, `backend/`, `infra/`, `docs/`.

## Data Flow

1. Wallet connects via wagmi/viem
2. User signs auth nonce → JWT session
3. SoDEX sync discovers account + ingests trades
4. SoSoValue sync adds macro/news context
5. Risk engine computes behavioral metrics
6. AI insight engine generates forensic explanations
7. WebSocket streams AI reasoning phases to UI

## Services

- **AuthService** — nonce-based wallet authentication
- **SyncService** — SoDEX + SoSoValue ingestion
- **RiskEngine** — proprietary behavioral scoring
- **AIInsightEngine** — evidence-bound insight generation
- **ReplayEngine** — forensic timeline builder
- **DemoSeedService** — deterministic judge demo data

## Integrations

- `SodexClient` — REST adapter for account state, trades, orderbook
- `SoSoValueClient` — REST adapter for news, macro, pair market data

## Database

PostgreSQL (production) / SQLite (local demo). Core tables: users, wallets, trades, liquidity_snapshots, behavioral_metrics, ai_insights, replay_sessions, replay_frames, market_regimes, sosovalue_events.
