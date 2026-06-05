import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Dna, Loader2 } from 'lucide-react'
import { BehaviorChart } from '@/components/charts/BehaviorChart'
import { MetricTile } from '@/components/ui/metric-tile'
import { getDnaProfile } from '@/lib/api/dna'
import { formatPercent } from '@/lib/utils'

export function TraderDnaPage() {
  const { data: profile, isLoading, error } = useQuery({ queryKey: ['dna'], queryFn: getDnaProfile })

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading DNA profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="panel rounded-xl p-6 text-sm text-red-300">
        Failed to load DNA profile. Sync SoDEX data from Settings or the top bar.
      </div>
    )
  }

  const hasLiveAnalysis = profile?.data_status === 'live_analysis'
  const chartData = hasLiveAnalysis ? profile.metrics.map((m) => ({ name: m.label.split(' ')[0], value: m.value })) : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Trading DNA Profile</h1>
        <p className="text-sm text-text-muted">
          {hasLiveAnalysis ? profile.message : 'Personal DNA profiling requires imported SoDEX trade history'}
        </p>
      </div>

      {!hasLiveAnalysis && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-medium">No live trade data for DNA analysis</p>
          <p className="mt-1 text-xs">{profile?.message}</p>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel relative overflow-hidden rounded-2xl p-8"
      >
        <div className="absolute inset-0 mesh-gradient opacity-50" />
        <div className="relative flex flex-col items-center text-center md:flex-row md:text-left md:gap-8">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gold/10 md:mb-0"
          >
            <Dna className="h-12 w-12 text-gold" />
          </motion.div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gold">Trader Archetype</p>
            <h2 className="text-3xl font-bold text-text-primary">{profile?.archetype ?? 'Analyzing...'}</h2>
            <p className="mt-1 text-sm text-text-muted">{profile?.risk_personality}</p>
          </div>
        </div>
      </motion.div>

      {hasLiveAnalysis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.metrics.map((m, i) => (
            <MetricTile
              key={m.key}
              label={m.label}
              value={formatPercent(m.value)}
              trend={m.trend != null && m.trend > 0 ? 'up' : 'down'}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-xl p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Strengths
          </h3>
          <ul className="space-y-2">
            {profile?.strengths.map((s) => (
              <li key={s} className="text-sm text-text-muted">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="panel rounded-xl p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-red-400">
            <AlertTriangle className="h-4 w-4" /> Weaknesses
          </h3>
          <ul className="space-y-2">
            {profile?.weaknesses.map((w) => (
              <li key={w} className="text-sm text-text-muted">• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="mb-4 text-sm font-semibold text-gold">Hidden PNL Leaks</h3>
        <div className="space-y-3">
          {profile?.hidden_pnl_leaks.map((leak) => (
            <div key={leak} className="rounded-lg border border-gold/10 bg-gold/5 px-4 py-3 text-sm text-text-primary">
              {leak}
            </div>
          ))}
        </div>
      </div>

      {hasLiveAnalysis && (
        <div className="panel rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Behavioral Fingerprint</h3>
          <BehaviorChart data={chartData} color="#D4AF37" />
        </div>
      )}
    </div>
  )
}
