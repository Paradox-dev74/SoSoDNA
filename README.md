# Soso DNA

**Behavioral Market Forensics for SoDEX Traders**

An AI-native trading intelligence platform that connects your ValueChain/SoDEX testnet wallet, ingests live trades and orderbook data, enriches analysis with SoSoValue macro/news context, and outputs behavioral risk insights, forensic replay, and intervention prompts.

## Buildathon Compliance

| Requirement | Status |
|-------------|--------|
| SoSoValue API integration | Backend sync + `/api/v1/sosovalue/*` + UI regime panel |
| Clear user value | Wallet → sync → forensics → risk → replay |
| End-to-end flow | ValueChain auth → SoDEX ingest → SoSoValue → AI/risk |
| SoDEX integration (bonus) | Testnet account, trades, orderbook snapshots |
| AI + risk (bonus) | WebSocket stream, evidence-bound insights, intervention modal |

## Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, Framer Motion, wagmi, TanStack Query, Zustand
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL/SQLite, Redis, WebSockets, LangChain-ready AI

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_ENV` | yes | `production` for live demo; `local` only for demo auth bypass |
| `DEMO_MODE` | yes | `false` for Buildathon (default) |
| `SECRET_KEY` | yes | Long random string — never use dev default in production |
| `SOSOVALUE_API_KEY` | yes (live) | SoSoValue OpenAPI key |
| `DATABASE_URL` | yes | PostgreSQL or SQLite async URL |
| `CHAIN_ID` | yes | `138565` (ValueChain testnet) |
| `SODEX_PERPS_REST` | yes | SoDEX testnet gateway |
| `OPENAI_API_KEY` | optional | Enables LLM-enhanced insight claims |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | yes | Backend URL |
| `VITE_WS_URL` | yes | WebSocket URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | yes | WalletConnect Cloud project ID |
| `VITE_CHAIN_ID` | yes | `138565` |
| `VITE_VALUECHAIN_RPC_URL` | yes | ValueChain testnet RPC |
| `VITE_DEMO_MODE` | yes | `false` for live demo |

## Quick Start (Local Live Path)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Set SOSOVALUE_API_KEY, SECRET_KEY; keep DEMO_MODE=false
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_WALLETCONNECT_PROJECT_ID
npm install
npm run dev
```

### 3. Connect & Sync

1. Open http://localhost:5173/connect
2. Connect MetaMask or WalletConnect on ValueChain testnet (138565)
3. Sign authentication message — backend syncs SoDEX + SoSoValue automatically
4. Explore Dashboard, Regimes, Heatmaps, Risk Engine, Replay

### Local Demo Mode (development only)

Set `APP_ENV=local` and `DEMO_MODE=true` in backend, plus `VITE_DEMO_MODE=true` in frontend. Demo auth bypass and seed data are **disabled outside local mode**.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health |
| `GET /api/v1/health/integrations` | Integration status (SoSoValue, SoDEX, DB) |
| `POST /api/v1/auth/nonce` | Wallet auth nonce |
| `POST /api/v1/auth/verify` | Signature verification |
| `POST /api/v1/auth/refresh` | Token refresh |
| `POST /api/v1/sodex/sync` | Ingest SoDEX + SoSoValue data |
| `GET /api/v1/sosovalue/events` | Synced SoSoValue events |
| `GET /api/v1/sosovalue/context` | Market context bundle |
| `GET /api/v1/market/regimes` | Derived liquidity regimes |
| `GET /api/v1/heatmaps/liquidity` | Orderbook-derived heatmap |
| `POST /api/v1/risk/pretrade` | Pre-trade risk evaluation |
| `WS /ws/user/{id}?token=` | JWT-authenticated AI stream |

## Tests

```bash
cd backend
pytest
```

## Deployment

See `infra/render.yaml` for Render template. Set `DEMO_MODE=false`, configure `SOSOVALUE_API_KEY`, `SECRET_KEY`, and frontend WalletConnect project ID.

## Submission Package

- [docs/demo-script.md](docs/demo-script.md) — 90-second demo script
- [docs/pitch-deck.md](docs/pitch-deck.md) — Pitch outline
- [docs/submission.md](docs/submission.md) — Final submission checklist

## What You Need To Provide

- `SOSOVALUE_API_KEY`
- `VITE_WALLETCONNECT_PROJECT_ID`
- ValueChain testnet wallet with SoDEX trade history
- Public GitHub repo, deployment URL, and demo video for submission
