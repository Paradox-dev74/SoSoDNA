import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { evaluatePreTradeRisk } from '@/lib/api/risk'
import { formatPercent } from '@/lib/utils'

export function ExecutionConsolePage() {
  const [confirmed, setConfirmed] = useState(false)
  const [symbol, setSymbol] = useState('BTC-USD')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [sizeUsd, setSizeUsd] = useState(5000)

  const { data: risk, refetch, isFetching } = useQuery({
    queryKey: ['execution-preview', symbol, side, sizeUsd],
    queryFn: () => evaluatePreTradeRisk(symbol, side, sizeUsd),
    enabled: false,
  })

  const runPreview = async () => {
    setConfirmed(false)
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Execution Console</h1>
        <p className="text-sm text-text-muted">Risk-gated order preview — simulated execution only (no live trading)</p>
      </div>

      <div className="panel rounded-xl border border-amber-400/20 bg-amber-400/5 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <p className="text-sm text-amber-200">
            Buildathon scope: analytics and simulation only. Execution requires explicit confirmation and remains disabled on testnet.
          </p>
        </div>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Zap className="h-5 w-5 text-gold" /> Order Preview (Simulation)
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-text-muted">Symbol</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              <option>BTC-USD</option>
              <option>ETH-USD</option>
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={sizeUsd}
              onChange={(e) => setSizeUsd(Number(e.target.value))}
            />
          </label>
        </div>

        <Button className="mt-4" onClick={runPreview} disabled={isFetching}>
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating risk...
            </>
          ) : (
            'Generate Risk-Gated Preview'
          )}
        </Button>

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
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I understand this is a simulation and no order will be placed.
            </label>
            <Button variant="secondary" className="w-full" disabled={!confirmed || risk.similarity_to_losing_setups > 0.75}>
              {risk.similarity_to_losing_setups > 0.75
                ? 'Blocked — Risk threshold exceeded'
                : 'Simulate Submit (Disabled)'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
