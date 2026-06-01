import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MetricTileProps {
  label: string
  value: string
  delta?: string
  trend?: string
  className?: string
  delay?: number
}

export function MetricTile({ label, value, delta, trend, className, delay = 0 }: MetricTileProps) {
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-text-muted'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('panel rounded-xl p-4 panel-hover', className)}
    >
      <p className="text-xs uppercase tracking-wider text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
      {delta && <p className={cn('mt-1 text-xs tabular-nums', trendColor)}>{delta}</p>}
    </motion.div>
  )
}
