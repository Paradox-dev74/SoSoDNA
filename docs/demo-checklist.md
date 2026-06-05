# Live Demo Checklist

## Pre-demo (5 min)

- [ ] Backend running with `DEMO_MODE=false`, `APP_ENV=production`
- [ ] `SOSOVALUE_API_KEY` set and `/api/v1/health/integrations` shows key configured
- [ ] Frontend built with `VITE_DEMO_MODE=false` and valid WalletConnect project ID
- [ ] ValueChain testnet wallet funded and has SoDEX trade history
- [ ] Browser on correct network (chain 138565)

## Demo flow (90s)

1. Landing page — value prop
2. Connect wallet → sign → auto sync
3. Dashboard — live trades and metrics
4. Trade replay — check data source badge (snapshots vs trade-only)
5. Market Regime — SoSoValue events with timestamps
6. Risk Engine — simulate entry, show intervention
7. AI panel — WebSocket phases + evidence

## Verify no mocks

- [ ] No "Demo Mode Active" in sidebar (unless local dev)
- [ ] Top bar shows "SoDEX Synced" only after successful sync
- [ ] Heatmaps empty state if no snapshots (not fake chart)
- [ ] Dashboard chart empty if no metrics

## Post-demo

- [ ] Record screen capture
- [ ] Update `docs/submission.md` links
- [ ] Push public GitHub repo
