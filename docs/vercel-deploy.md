# Deploy SOSO DNA on Vercel

This repo uses **Vercel Services** (multi-service monorepo): a Vite frontend and a FastAPI backend in one project.

## 1. Import the repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Paradox-dev74/SoSoDNA`
3. Set **Framework Preset** to **Services** (Vercel auto-detects `vercel.json`)
4. Project name: `soso-dna`

Vercel should detect:

| Service  | Path       | Framework |
|----------|------------|-----------|
| frontend | `/`        | Vite      |
| backend  | `/`        | FastAPI   |

Root `vercel.json` defines both services via `experimentalServices`.

## 2. External services (required)

Vercel does not include PostgreSQL or Redis. Add these before first deploy:

| Service    | Recommended provider        | Env var        |
|------------|-----------------------------|----------------|
| PostgreSQL | [Neon](https://neon.tech) or Vercel Postgres | `DATABASE_URL` |
| Redis      | [Upstash](https://upstash.com) (Vercel integration) | `REDIS_URL` |

`DATABASE_URL` must use the async driver, e.g.:

```
postgresql+asyncpg://user:pass@host/db?sslmode=require
```

Also set `DATABASE_URL_SYNC` for Alembic (sync driver, same DB).

## 3. Environment variables

### Backend (all environments)

| Variable | Example / notes |
|----------|-----------------|
| `APP_ENV` | `production` |
| `SECRET_KEY` | long random string |
| `DATABASE_URL` | Neon async URL |
| `DATABASE_URL_SYNC` | Neon sync URL |
| `REDIS_URL` | Upstash Redis URL |
| `SOSOVALUE_API_KEY` | your SoSoValue key |
| `CORS_ORIGINS` | `https://soso-dna.vercel.app` (your live URL) |
| `DEMO_MODE` | `false` |
| `CHAIN_ID` | `138565` |

Optional: `OPENAI_API_KEY`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`

### Frontend (build-time — prefix with scope if Vercel asks)

| Variable | Production value |
|----------|------------------|
| `VITE_API_URL` | **leave empty** (same-origin `/api/v1`) |
| `VITE_WS_URL` | **leave empty** (auto `wss://` on same host) |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID |
| `VITE_CHAIN_ID` | `138565` |
| `VITE_VALUECHAIN_RPC_URL` | `https://testnet-rpc.valuechain.xyz` |

## 4. Deploy

Click **Deploy**. After the first deploy:

1. Copy your live URL (e.g. `https://soso-dna.vercel.app`)
2. Update backend `CORS_ORIGINS` to include that URL
3. Redeploy

## 5. Verify

- `https://your-app.vercel.app` — landing page
- `https://your-app.vercel.app/health` — API health
- `https://your-app.vercel.app/connect` — wallet connect
- Connect wallet → sync → dashboard

## 6. Local preview with Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel dev
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `vercel.json required` | Ensure root `vercel.json` exists and Framework = **Services** |
| CORS errors | Add Vercel URL to `CORS_ORIGINS` |
| DB connection failed | Use `postgresql+asyncpg://` and `?sslmode=require` on Neon |
| Empty dashboard | Connect wallet with SoDEX testnet trade history |
| WebSocket AI panel silent | Confirm `REDIS_URL` is set; check Vercel function logs |

## Buildathon submission

Use your Vercel URL as **Live demo** in the hackathon form:

```
https://soso-dna.vercel.app
```
