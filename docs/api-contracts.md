# API Contracts

Base URL: `http://localhost:8000/api/v1`

## Auth

- `POST /auth/nonce` — `{ address, chain_id }` → `{ nonce, message, expires_at }`
- `POST /auth/verify` — `{ address, signature, nonce, chain_id }` → `{ access_token, refresh_token, user }`
- `GET /auth/me` — Bearer token → user profile

## Dashboard

- `GET /dashboard/summary` — top metrics and regime

## Trader DNA

- `GET /dna/profile` — archetype, metrics, strengths, weaknesses

## Trades

- `GET /trades` — paginated trade list
- `GET /trades/{id}/forensics` — forensic analysis

## AI Insights

- `GET /insights` — forensic insight inbox

## Replay

- `POST /replay/trades/{trade_id}` — create/get replay session with frames

## Risk

- `POST /risk/pretrade` — `{ symbol, side, size_usd }` → intervention analysis

## Heatmaps

- `GET /heatmaps/liquidity?symbol=BTC-PERP` — depth heatmap data

## WebSocket

- `ws://localhost:8000/ws/user/{user_id}`
- Events: `ai.reasoning_started`, `ai.phase_changed`, `ai.evidence_found`, `ai.insight_completed`
