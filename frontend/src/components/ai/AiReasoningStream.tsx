import { AnimatePresence, motion } from 'framer-motion'
import { Brain, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { wsClient } from '@/lib/websocket/client'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

interface AiPhase {
  phase: string
  status: 'pending' | 'active' | 'done'
}

interface AiReasoningStreamProps {
  isActive?: boolean
  onComplete?: (result: { title: string; confidence: number; claim?: string }) => void
}

const DEFAULT_PHASES = [
  'Reading trade history',
  'Matching historical setups',
  'Checking liquidity regime',
  'Validating SoSoValue context',
  'Writing forensic conclusion',
]

let activeStreamCount = 0

export function AiReasoningStream({ isActive = false, onComplete }: AiReasoningStreamProps) {
  const queryClient = useQueryClient()
  const user = useAppStore((s) => s.user)
  const streamGuard = useRef(false)
  const [phases, setPhases] = useState<AiPhase[]>(
    DEFAULT_PHASES.map((p) => ({ phase: p, status: 'pending' })),
  )
  const [result, setResult] = useState<{ title: string; confidence: number; claim?: string } | null>(null)
  const [evidence, setEvidence] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [blockers, setBlockers] = useState<string[]>([])

  useEffect(() => {
    if (!isActive || !user) return
    if (activeStreamCount > 0) return

    activeStreamCount += 1
    streamGuard.current = true
    wsClient.connect(user.id)

    const resetPhases = () =>
      setPhases(DEFAULT_PHASES.map((p) => ({ phase: p, status: 'pending' as const })))

    const onStarted = () => {
      resetPhases()
      setResult(null)
      setEvidence([])
      setError(null)
      setBlockers([])
    }

    const onPhase = (data: Record<string, unknown>) => {
      const payload = data.payload as { phase?: string }
      const phaseName = payload.phase
      if (!phaseName) return
      setPhases((prev) => {
        const idx = prev.findIndex((p) => p.phase === phaseName)
        return prev.map((p, i) => ({
          ...p,
          status: i < idx ? 'done' : i === idx ? 'active' : 'pending',
        }))
      })
    }

    const onEvidence = (data: Record<string, unknown>) => {
      const payload = data.payload as Record<string, unknown>
      setEvidence((prev) => [...prev, payload])
    }

    const onCompleteMsg = (data: Record<string, unknown>) => {
      const payload = data.payload as { title?: string; confidence?: number; claim?: string }
      setPhases((prev) => prev.map((p) => ({ ...p, status: 'done' as const })))
      if (!payload.title || payload.confidence == null) {
        setError('Insight completed without sufficient evidence payload.')
        return
      }
      const res = {
        title: payload.title,
        confidence: payload.confidence,
        claim: payload.claim,
      }
      setResult(res)
      onComplete?.(res)
      queryClient.invalidateQueries({ queryKey: ['insights'] })
    }

    const onError = (data: Record<string, unknown>) => {
      const payload = data.payload as { message?: string }
      setError(payload.message || 'AI stream failed')
    }

    const onInsufficient = (data: Record<string, unknown>) => {
      const payload = data.payload as { message?: string; blockers?: string[] }
      setError(payload.message || 'Insufficient live evidence')
      setBlockers(payload.blockers || [])
      setPhases((prev) => prev.map((p) => ({ ...p, status: 'pending' as const })))
    }

    wsClient.on('ai.reasoning_started', onStarted)
    wsClient.on('ai.phase_changed', onPhase)
    wsClient.on('ai.evidence_found', onEvidence)
    wsClient.on('ai.insight_completed', onCompleteMsg)
    wsClient.on('ai.error', onError)
    wsClient.on('ai.insufficient_evidence', onInsufficient)

    wsClient.requestAiGeneration()

    return () => {
      if (streamGuard.current) {
        activeStreamCount = Math.max(0, activeStreamCount - 1)
        streamGuard.current = false
      }
      wsClient.off('ai.reasoning_started', onStarted)
      wsClient.off('ai.phase_changed', onPhase)
      wsClient.off('ai.evidence_found', onEvidence)
      wsClient.off('ai.insight_completed', onCompleteMsg)
      wsClient.off('ai.error', onError)
      wsClient.off('ai.insufficient_evidence', onInsufficient)
    }
  }, [isActive, user, onComplete, queryClient])

  return (
    <div className="panel rounded-xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-blue" />
        <span className="text-sm font-medium text-text-primary">Forensic Intelligence Engine</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {phases.map((p) => (
            <motion.div
              key={p.phase}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm"
            >
              {p.status === 'done' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              ) : p.status === 'active' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-white/10" />
              )}
              <span className={cn(p.status === 'active' ? 'text-gold' : p.status === 'done' ? 'text-text-muted' : 'text-text-muted/50')}>
                {p.phase}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {evidence.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-bg-elevated/60 p-2">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Evidence</p>
          {evidence.map((item, i) => (
            <p key={i} className="text-xs text-text-muted">
              {String(item.source || 'data')}: {String(item.spread_bps ?? item.sosovalue_event ?? item.trade_id ?? 'matched')}
            </p>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
          <p className="text-xs text-amber-200">{error}</p>
          {blockers.length > 0 && (
            <ul className="mt-2 space-y-1">
              {blockers.map((b) => (
                <li key={b} className="text-[11px] text-amber-100/80">• {b}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg border border-gold/20 bg-gold/5 p-3"
        >
          <p className="text-sm font-medium text-gold">{result.title}</p>
          {result.claim && <p className="mt-1 text-xs text-text-muted">{result.claim}</p>}
          <p className="mt-1 text-xs text-text-muted">Confidence: {Math.round(result.confidence * 100)}%</p>
        </motion.div>
      )}
    </div>
  )
}
