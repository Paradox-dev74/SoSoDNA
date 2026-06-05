# Live Setup Guide (Your Environment)

## 1. Fix MetaMask Network (from your screenshot)

Your MetaMask error happens because the RPC URL is wrong/incomplete.

Use these **exact** values:

| Field | Value |
|-------|-------|
| Network name | `ValueChain Testnet` |
| RPC URL | `https://testnet-rpc.valuechain.xyz` |
| Chain ID | `138565` |
| Currency symbol | `VBC` |
| Block explorer | `https://explorer-testnet.sosovalue.com` |

**Do NOT use** `testnet-rpc.sodex.dev` — that host does not resolve.  
**Do NOT omit** `https://` from the RPC URL.  
**Do NOT use** chain ID `138629` — the live RPC returns `138565` (`0x21d45`).

## 2. Backend `.env` (already partially fixed)

```env
APP_ENV=production
DEMO_MODE=false
SOSOVALUE_API_KEY=SOSO-your-key-without-trailing-characters
CHAIN_ID=138565
VALUECHAIN_RPC_URL=https://testnet-rpc.valuechain.xyz
SECRET_KEY=<generate-a-long-random-string>
```

**Fixed:** your API key had a trailing `>` character that made every SoSoValue request fail.

## 3. Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_CHAIN_ID=138565
VITE_VALUECHAIN_RPC_URL=https://testnet-rpc.valuechain.xyz
VITE_DEMO_MODE=false
VITE_WALLETCONNECT_PROJECT_ID=<your-walletconnect-cloud-project-id>
```

## 4. About your wallet identifier

The value you shared:

`dbab4c52c0b592b8c305ae5e8f164d5181afe9b7ba2f581e72900e75d14316b0`

This is **not** the address Soso DNA uses for auth/sync. The app needs your **MetaMask `0x...` address** (42 characters including `0x`).

To find it:
1. Add the network using the table above
2. Open MetaMask → select ValueChain Testnet
3. Copy the address shown (starts with `0x`)

That `0x` address is what SoDEX API queries at:
`GET /api/v1/perps/accounts/{0xAddress}/trades`

## 5. Start the stack

```bash
# Terminal 1
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend
npm run dev
```

## 6. Connect flow

1. Open http://localhost:5173/connect
2. Connect MetaMask on chain `138565`
3. Sign the auth message
4. Backend auto-syncs SoDEX trades + orderbook + SoSoValue news/macro
5. Check Settings page for integration status

## 7. What you still need to provide

| Item | Required? | How to get it |
|------|-----------|---------------|
| `0x` wallet address | **Yes** | MetaMask on ValueChain Testnet |
| `VITE_WALLETCONNECT_PROJECT_ID` | For mobile/QR wallets | https://cloud.walletconnect.com |
| Test trades on SoDEX | **Yes** for dashboard data | Trade on testnet.sodex.com with same wallet |
| `OPENAI_API_KEY` | Optional | Only for LLM-enhanced insight wording |
| Public deployment | For submission | Render/Vercel or similar |

## 8. Verify integrations

```bash
curl http://localhost:8000/api/v1/health/integrations
```

Expect:
- `sosovalue_api_key_configured: true`
- `sodex_reachable: true`
- `demo_mode: false`
