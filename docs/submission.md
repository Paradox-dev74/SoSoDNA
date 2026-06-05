# Soso DNA — Buildathon Submission

## Project

**Soso DNA** is a behavioral market forensics platform for SoDEX traders. It connects a ValueChain testnet wallet, ingests SoDEX trades and orderbook snapshots, enriches analysis with SoSoValue macro/news context, and outputs AI-backed risk insights, replay timelines, and intervention prompts.

## Core Flow

1. Connect ValueChain testnet wallet (chain `138565`) and sign authentication message
2. Backend syncs SoDEX account state, trades, orderbook snapshots
3. SoSoValue API syncs news, macro events, and pair context
4. Behavioral metrics, regimes, heatmaps, and replay frames are derived from stored live data
5. Risk engine and WebSocket AI stream cite evidence from trades, spreads, and SoSoValue events

## Integrations

| Integration | Usage |
|-------------|-------|
| **SoSoValue API** | `x-soso-api-key` backend requests; events served via `/api/v1/sosovalue/*` |
| **SoDEX Testnet** | Account state, trades, orderbook ingestion via testnet gateway |
| **ValueChain Wallet** | wagmi + WalletConnect; signature auth with chain enforcement |

## Demo Checklist

- [ ] `DEMO_MODE=false` in production backend
- [ ] `SOSOVALUE_API_KEY` configured
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` configured
- [ ] ValueChain testnet wallet with trade history connected
- [ ] Dashboard shows imported trades (not demo seed)
- [ ] Market Regime page shows SoSoValue events with timestamps
- [ ] Heatmaps show data or honest empty state
- [ ] AI panel streams WebSocket phases with evidence
- [ ] Public GitHub repo + deployment URL + demo video uploaded

## Links (fill before submission)

- **GitHub:**
- **Live demo:**
- **Demo video:**
- **Team contact:**
