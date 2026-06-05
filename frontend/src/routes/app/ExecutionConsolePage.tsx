import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ExternalLink, Loader2, RefreshCw, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getExecutionMarkets } from '@/lib/api/execution'
import { syncSodexData } from '@/lib/api/heatmaps'
import { evaluatePreTradeRisk } from '@/lib/api/risk'
import {
  buildSodexTradeUrl,
  formatHandoffInstructions,
  RISK_BLOCK_THRESHOLD,
} from '@/lib/sodex/handoff'
import { invalidateLiveDataQueries } from '@/lib/sync/invalidate'
import { formatSyncMessage, parseSyncResult } from '@/lib/sync-status'
import { formatPercent } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD']

export function ExecutionConsolePage() {
  const queryClient = useQueryClient()
  const { setSyncStatus, setLastSyncSummary } = useAppStore()
  const [handoffOpened, setHandoffOpened] = useState(false)
  const [symbol, setSymbol] = useState('BTC-USD')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [sizeUsd, setSizeUsd] = useState(50)

  const { data: markets } = useQuery({
    queryKey: ['execution-markets', symbol],
    queryFn: () => getExecutionMarkets(symbol),
  })

  const riskPreview = useMutation({
    mutationFn: () => evaluatePreTradeRisk(symbol, side, sizeUsd),
    onSuccess: () => setHandoffOpened(false),
  })

  const resync = useMutation({
    mutationFn: syncSodexData,
    onMutate: () => setSyncStatus('syncing', 'Importing trades from SoDEX...'),
    onSuccess: async (result) => {
      const summary = parseSyncResult(result)
      setLastSyncSummary(summary)
      setSyncStatus(result.status === 'failed' ? 'error' : 'synced', formatSyncMessage(summary))
      await invalidateLiveDataQueries(queryClient)
    },
    onError: (err: Error) => setSyncStatus('error', err.message),
  })

  const risk = riskPreview.data
  const market = markets?.[0]
  const riskBlocked = risk ? risk.similarity_to_losing_setups >= RISK_BLOCK_THRESHOLD : false
  const handoffUrl = buildSodexTradeUrl({ symbol, side })
  const instructions = formatHandoffInstructions({ symbol, side, sizeUsd })

  const openSodex = () => {
    window.open(handoffUrl, '_blank', 'noopener,noreferrer')
    setHandoffOpened(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Execution Console</h1>
        <p className="text-sm text-text-muted">
          Risk-gated handoff to SoDEX testnet — execute with your connected wallet on SoDEX, then sync back here
        </p>
      </div>

      <div className="panel rounded-xl border border-blue-400/20 bg-blue-400/5 p-6">
        <p className="text-sm text-blue-100">
          SOSO DNA does not custody funds or store trading keys. After the risk check, you place the order directly on
          SoDEX testnet with your wallet, then return here to sync imported trades.
        </p>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Zap className="h-5 w-5 text-gold" /> Order Plan
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-text-muted">Symbol</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-text-muted">Side</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={side}
              onChange={(e) => setSide(e.target.value as 'long' | 'short')}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-text-muted">Size (USD)</span>
            <input
              type="number"
              min={10}
              step={10}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={sizeUsd}
              onChange={(e) => setSizeUsd(Number(e.target.value))}
            />
          </label>
        </div>

        {market && (
          <p className="mt-3 text-xs text-text-muted">
            Live market: {market.symbol} · min notional ${market.min_notional}
            {market.mark_price ? ` · mark ${market.mark_price}` : ''}
          </p>
        )}

        <Button className="mt-4" onClick={() => riskPreview.mutate()} disabled={riskPreview.isPending}>
          {riskPreview.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating risk...
            </>
          ) : (
            'Run Live Risk Check'
          )}
        </Button>

        {riskPreview.isError && (
          <p className="mt-3 text-sm text-red-300">{(riskPreview.error as Error).message}</p>
        )}

        {risk && (
          <div className="mt-6 space-y-3 border-t border-white/8 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Risk Similarity</span>
              <span className={risk.similarity_to_losing_setups > 0.7 ? 'text-red-400' : 'text-emerald-400'}>
                {formatPercent(risk.similarity_to_losing_setups)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Severity</span>
              <span className="text-text-primary">{risk.severity}</span>
            </div>
            <p className="text-sm text-text-muted">{risk.summary}</p>
            <p className="text-xs text-text-muted">{risk.recommended_action}</p>

            {riskBlocked ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Risk threshold exceeded ({formatPercent(RISK_BLOCK_THRESHOLD)}). Wait for a better setup before
                  executing on SoDEX.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gold/20 bg-gold/5 p-3 text-sm text-gold/90">{instructions}</div>
                <Button className="w-full" onClick={openSodex}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Execute on SoDEX Testnet
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {handoffOpened && (
        <div className="panel rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <h3 className="text-sm font-semibold text-emerald-200">After you trade on SoDEX</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-text-muted">
            <li>Complete the order on SoDEX with the same wallet you use in SOSO DNA.</li>
            <li>Return to this tab and sync to import the new trade.</li>
            <li>Check Dashboard, DNA, and Replay for updated analysis.</li>
          </ol>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => resync.mutate()}
            disabled={resync.isPending}
          >
            {resync.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> I placed my trade — Sync now
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
