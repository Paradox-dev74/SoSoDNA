import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import type { PreTradeRiskResponse } from '@/lib/api/risk'
import { Button } from '@/components/ui/button'
import { formatPercent } from '@/lib/utils'

interface InterventionModalProps {
  open: boolean
  onClose: () => void
  risk: PreTradeRiskResponse | null
}

export function InterventionModal({ open, onClose, risk }: InterventionModalProps) {
  if (!risk) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="panel mx-4 w-full max-w-lg rounded-2xl border border-red-400/20 p-6 glow-gold"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-red-400">AI Intervention</p>
                  <h3 className="text-lg font-semibold text-text-primary">{risk.title}</h3>
                </div>
              </div>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-text-muted">{risk.summary}</p>

            <div className="mt-4 rounded-xl bg-bg-elevated p-4">
              <p className="text-3xl font-bold tabular-nums text-red-400">
                {formatPercent(risk.similarity_to_losing_setups)}
              </p>
              <p className="text-xs text-text-muted">Similarity to historical losing entries</p>
            </div>

            <div className="mt-4 space-y-2">
              {risk.contributors.map((c) => (
                <div key={c.factor} className="flex items-start gap-2 rounded-lg bg-white/3 px-3 py-2">
                  <span className="mt-0.5 text-xs font-medium text-gold">{Math.round(c.impact * 100)}%</span>
                  <div>
                    <p className="text-xs font-medium text-text-primary">{c.factor}</p>
                    <p className="text-[11px] text-text-muted">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-gold/20 bg-gold/5 p-3">
              <p className="text-xs font-medium text-gold">Recommended Action</p>
              <p className="mt-1 text-sm text-text-primary">{risk.recommended_action}</p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="danger" className="flex-1" onClick={onClose}>
                Acknowledge Risk
              </Button>
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Wait for Better Setup
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
