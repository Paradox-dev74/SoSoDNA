import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { InterventionModal } from '@/features/wallet/InterventionModal'
import { Button } from '@/components/ui/button'
import { MetricTile } from '@/components/ui/metric-tile'
import { evaluatePreTradeRisk } from '@/lib/api/risk'
import { getDnaProfile } from '@/lib/api/dna'
import { formatPercent } from '@/lib/utils'

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD']

export function RiskEnginePage() {
  const [showIntervention, setShowIntervention] = useState(false)
  const [symbol, setSymbol] = useState('BTC-USD')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [sizeUsd, setSizeUsd] = useState(5000)

  const { data: profile } = useQuery({ queryKey: ['dna'], queryFn: getDnaProfile })
  const { data: risk, refetch, isFetching } = useQuery({
    queryKey: ['pretrade-risk', symbol, side, sizeUsd],
    queryFn: () => evaluatePreTradeRisk(symbol, side, sizeUsd),
    enabled: false,
  })

  const handleEvaluate = async () => {
    await refetch()
    setShowIntervention(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Risk Engine</h1>
        <p className="text-sm text-text-muted">Pre-trade evaluation using live SoDEX spread data and SoSoValue macro proximity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profile?.metrics.slice(0, 3).map((m, i) => (
          <MetricTile key={m.key} label={m.label} value={formatPercent(m.value)} delay={i * 0.05} />
        ))}
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary">Pre-Trade Risk Check</h3>
        <p className="mt-2 text-sm text-text-muted">
          Evaluate a proposed order against imported trade history, latest orderbook snapshot, and macro events.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-text-muted">Symbol</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2 text-text-primary"
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
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2 text-text-primary"
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
              min={100}
              step={100}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2 text-text-primary"
              value={sizeUsd}
              onChange={(e) => setSizeUsd(Number(e.target.value))}
            />
          </label>
        </div>

        <Button className="mt-4" onClick={handleEvaluate} disabled={isFetching}>
          {isFetching ? 'Evaluating...' : 'Run Risk Evaluation'}
        </Button>
      </div>

      {risk && !showIntervention && (
        <div className="panel rounded-xl border border-red-400/20 p-6">
          <p className="text-3xl font-bold tabular-nums text-red-400">{formatPercent(risk.similarity_to_losing_setups)}</p>
          <p className="mt-1 text-sm text-text-muted">Similarity to historical losing entries</p>
          <p className="mt-4 text-sm text-text-primary">{risk.summary}</p>
          {risk.contributors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-text-muted">
              {risk.contributors.map((c) => (
                <li key={c.factor}>
                  {c.factor}: {c.description}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <InterventionModal open={showIntervention} onClose={() => setShowIntervention(false)} risk={risk ?? null} />
    </div>
  )
}
