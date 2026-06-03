import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowDownRight, Loader2, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BehaviorChart } from '@/components/charts/BehaviorChart'
import { ForensicInsightCard } from '@/components/ai/ForensicInsightCard'
import { MetricTile } from '@/components/ui/metric-tile'
import { getDashboardSummary } from '@/lib/api/dashboard'
import { getInsights } from '@/lib/api/insights'
import { getTrades } from '@/lib/api/trades'
import { formatUsd } from '@/lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
  })
  const { data: trades, isLoading: tradesLoading } = useQuery({ queryKey: ['trades'], queryFn: getTrades })
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: getInsights })

  const hasLiveAnalysis = summary?.data_status === 'live_analysis'
  const chartData =
    hasLiveAnalysis
      ? summary.metrics.map((m) => ({
          name: m.label.split(' ')[0],
          value: parseFloat(m.value) / 100 || 0,
        }))
      : []

  if (summaryLoading || tradesLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading live dashboard...
      </div>
    )
  }

  if (summaryError) {
    return (
      <div className="panel rounded-xl p-6 text-sm text-red-300">
        Failed to load dashboard. Reconnect wallet and sync SoDEX data from the top bar.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Command Center</h1>
        <p className="text-sm text-text-muted">
          {hasLiveAnalysis
            ? summary.message
            : 'Market regime and heatmaps use live market data. Personal analysis awaits your first SoDEX trade.'}
        </p>
      </div>

      {!hasLiveAnalysis && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-medium">No live trade data yet</p>
          <p className="mt-1 text-xs">
            {summary?.message ??
              'Connect your wallet, sync SoDEX, and place testnet trades to unlock behavioral metrics and PNL analysis.'}
          </p>
        </div>
      )}

      {hasLiveAnalysis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricTile label="Net PNL" value={formatUsd(summary.net_pnl_usd)} trend="down" delay={0} />
          <MetricTile label="Behavioral Risk" value={`${Math.round(summary.behavioral_risk_score * 100)}%`} trend="up" delay={0.05} />
          <MetricTile label="Liquidity Stress" value={`${Math.round(summary.liquidity_stress_index * 100)}%`} trend="up" delay={0.1} />
          <MetricTile label="Execution Precision" value={`${Math.round(summary.execution_precision_score * 100)}%`} trend="down" delay={0.15} />
          <MetricTile label="Market Regime" value={summary.current_regime.replace(/_/g, ' ')} delay={0.2} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricTile label="Market Regime" value={summary?.current_regime?.replace(/_/g, ' ') ?? '—'} delay={0} />
          <MetricTile label="Imported Trades" value="0" delay={0.05} />
          <MetricTile label="Analysis Status" value="Awaiting trades" delay={0.1} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel rounded-xl p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Behavioral Metrics Trend</h3>
          {chartData.length ? (
            <BehaviorChart data={chartData} />
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-text-muted">
              No behavioral metrics yet. Sync trades to populate this chart.
            </div>
          )}
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Recent Forensic Insights</h3>
          {insights?.length ? (
            insights.slice(0, 3).map((insight, i) => <ForensicInsightCard key={insight.id} insight={insight} index={i} />)
          ) : (
            <div className="panel rounded-xl p-4 text-sm text-text-muted">
              Insights appear after trade sync and sufficient live evidence. Open the intelligence panel to generate reasoning.
            </div>
          )}
        </div>
      </div>

      <div className="panel rounded-xl p-4">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Trade History</h3>
        {!trades?.length ? (
          <div className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-text-muted">
            <p>No trades imported yet.</p>
            <p className="mt-2">Connect your ValueChain/SoDEX testnet wallet and click sync. Ensure the wallet has test trades.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => {
              const pnl = parseFloat(trade.realized_pnl_usd || '0')
              const isLoss = pnl < 0
              return (
                <motion.button
                  key={trade.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/app/replay/${trade.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-bg-elevated/50 px-4 py-3 text-left transition-colors hover:border-gold/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">{trade.symbol}</span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-text-muted">{trade.side}</span>
                    <span className="text-xs text-text-muted">{new Date(trade.executed_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoss ? <TrendingDown className="h-3.5 w-3.5 text-red-400" /> : <ArrowDownRight className="h-3.5 w-3.5 rotate-180 text-emerald-400" />}
                    <span className={`text-sm font-medium tabular-nums ${isLoss ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatUsd(pnl)}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
