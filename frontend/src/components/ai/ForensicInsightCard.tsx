import { motion } from 'framer-motion'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import type { AIInsight } from '@/lib/api/insights'
import { cn } from '@/lib/utils'

const severityConfig = {
  info: { icon: Info, color: 'text-blue border-blue/20 bg-blue/5' },
  watch: { icon: Info, color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  warning: { icon: AlertTriangle, color: 'text-gold border-gold/20 bg-gold/5' },
  critical: { icon: ShieldAlert, color: 'text-red-400 border-red-400/20 bg-red-400/5' },
}

interface ForensicInsightCardProps {
  insight: AIInsight
  index?: number
  onClick?: () => void
}

export function ForensicInsightCard({ insight, index = 0, onClick }: ForensicInsightCardProps) {
  const config = severityConfig[insight.severity as keyof typeof severityConfig] || severityConfig.info
  const Icon = config.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn('panel w-full rounded-xl p-4 text-left panel-hover border', config.color)}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-sm font-medium text-text-primary">{insight.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">{insight.summary}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              {insight.insight_type}
            </span>
            <span className="text-[10px] tabular-nums text-text-muted">
              {Math.round(Number(insight.confidence) * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}
