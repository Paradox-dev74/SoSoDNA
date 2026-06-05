# Deploy: Vercel frontend + Render backend (recommended)

Use this split when Vercel serverless Python is unreliable. The frontend stays on Vercel; the API runs on Render.

## 1. Deploy backend on Render

1. Create a **Web Service** from `infra/render.yaml` or manually:
   - **Dockerfile:** `backend/Dockerfile`
   - **Docker context:** `backend`
   - **Port:** 8000

2. Set environment variables on Render:

| Variable | Value |
|----------|-------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Neon URL, e.g. `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_SYNC` | **Same Neon DB**, sync URL: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` (do not use SQLite on Render) |
| `REDIS_URL` | **Upstash Redis** connection URL (required for wallet sign-in). Copy the `rediss://...` string from Upstash Console → Connect — **not** the `https://...` REST URL |
| `SECRET_KEY` | Long random string |
| `SOSOVALUE_API_KEY` | Your key |
| `CORS_ORIGINS` | `https://soso-dna.vercel.app,http://localhost:5173` |
| `FRONTEND_URL` | `https://soso-dna.vercel.app` (optional extra allowlist) |
| `DEMO_MODE` | `false` |
| `CHAIN_ID` | `138565` |

3. Copy your Render API URL, e.g. `https://soso-dna-api.onrender.com`

4. Verify backend directly (not via Vercel):

```bash
curl https://YOUR-RENDER-URL.onrender.com/health
curl -X POST https://YOUR-RENDER-URL.onrender.com/api/v1/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x5c5600000000000000000000000000000000000000","chain_id":138565}'
```

- `/api/v1/health/integrations` should show `"database": true` and `"redis": true`
- `/api/v1/auth/nonce` should return `{ "nonce", "message", "expires_at" }` or **503** if Redis is missing

## 2. Point Vercel frontend at Render

In **Vercel → Project → Settings → Environment Variables** (Production):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com` |
| `VITE_WS_URL` | `wss://YOUR-RENDER-URL.onrender.com` |
| `VITE_WALLETCONNECT_PROJECT_ID` | Your WalletConnect project ID |
| `VITE_CHAIN_ID` | `138565` |
| `VITE_VALUECHAIN_RPC_URL` | `https://testnet-rpc.valuechain.xyz` |

**Important:** `VITE_*` vars are baked in at **build time**. After changing them, **redeploy** the Vercel project.

Leave `VITE_API_URL` empty only if the API is served from the same Vercel domain (not this setup).

## 3. Redeploy both

1. Redeploy Render (after env vars)
2. Redeploy Vercel (after `VITE_API_URL` / `VITE_WS_URL`)

## 4. Verify sign-in

1. Open `https://soso-dna.vercel.app/connect`
2. Open DevTools → Network
3. Click **Sign to Authenticate**
4. Confirm the nonce request goes to **`https://YOUR-RENDER-URL.onrender.com/api/v1/auth/nonce`**, not `soso-dna.vercel.app/api/...`

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Still calling `soso-dna.vercel.app/api/...` | Set `VITE_API_URL` on Vercel and **redeploy** frontend |
| CORS error | Set Render `CORS_ORIGINS=https://soso-dna.vercel.app` and redeploy API. Code also allows `*.vercel.app` via regex. |
| 503 on nonce / Redis unavailable | Set `REDIS_URL` to Upstash `rediss://default:TOKEN@host.upstash.io:6379` (not `https://host.upstash.io`) |
| 500 on Render `/health` | Check Render logs; fix `DATABASE_URL` |
| 404 on Render | Wrong service URL or API not running |
| Slow first request | Render free tier cold start (~30s) |
