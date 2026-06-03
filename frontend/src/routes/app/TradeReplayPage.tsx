import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PriceChart } from '@/components/charts/PriceChart'
import { Button } from '@/components/ui/button'
import { createReplay } from '@/lib/api/replay'
import { getTrade } from '@/lib/api/trades'
import { useReplayStore } from '@/stores/replay-store'

export function TradeReplayPage() {
  const { tradeId } = useParams<{ tradeId: string }>()
  const { data: trade } = useQuery({ queryKey: ['trade', tradeId], queryFn: () => getTrade(tradeId!), enabled: !!tradeId })
  const { data: replay, error: replayError, isLoading: replayLoading } = useQuery({
    queryKey: ['replay', tradeId],
    queryFn: () => createReplay(tradeId!),
    enabled: !!tradeId,
    retry: false,
  })

  const { isPlaying, currentFrameIndex, setPlaying, setFrameIndex, playbackSpeed } = useReplayStore()

  const frames = replay?.frames || []
  const currentFrame = frames[currentFrameIndex]

  const chartData = useMemo(
    () =>
      frames.map((f, i) => ({
        time: String(i),
        value: parseFloat(f.price),
      })),
    [frames],
  )

  useEffect(() => {
    if (!isPlaying || !frames.length) return
    const interval = setInterval(() => {
      setFrameIndex(Math.min(currentFrameIndex + 1, frames.length - 1))
      if (currentFrameIndex >= frames.length - 1) setPlaying(false)
    }, 1000 / playbackSpeed)
    return () => clearInterval(interval)
  }, [isPlaying, currentFrameIndex, frames.length, playbackSpeed, setFrameIndex, setPlaying])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-gold">Forensic Investigation</p>
        <h1 className="text-2xl font-bold text-text-primary">
          Trade Replay — {trade?.symbol ?? 'Loading...'}
        </h1>
        <p className="text-sm text-text-muted">
          {trade?.side} · PNL ${trade?.realized_pnl_usd ?? '—'}
          {replay?.summary && typeof replay.summary.data_source === 'string' && (
            <span className="ml-2 rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase">
              source: {replay.summary.data_source.replace(/_/g, ' ')}
            </span>
          )}
        </p>
      </div>

      {replayLoading && (
        <div className="panel rounded-xl p-6 text-sm text-text-muted">Loading snapshot-based replay...</div>
      )}

      {replayError && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Replay unavailable — no orderbook snapshots for this trade window.</p>
          <p className="mt-1 text-xs">
            Re-sync SoDEX data to import orderbook snapshots. Replay requires real stored snapshots, not synthetic frames.
          </p>
        </div>
      )}

      {!replayError && !replayLoading && (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel rounded-xl p-4 lg:col-span-2">
          <PriceChart data={chartData} height={350} />
          <div className="mt-2 flex items-center justify-center gap-1">
            {frames.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === currentFrameIndex ? 'w-4 bg-gold' : 'w-1.5 bg-white/10'}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel rounded-xl p-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Market State</h3>
            {currentFrame && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Price</span>
                  <span className="tabular-nums text-text-primary">${currentFrame.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Spread</span>
                  <span className="tabular-nums text-gold">{currentFrame.spread_bps} bps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Bid Depth</span>
                  <span className="tabular-nums text-text-primary">{currentFrame.depth_payload?.bid_depth_1pct ?? '—'}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Regime</span>
                  <span className="text-blue">{String(currentFrame.regime_payload?.regime ?? '—').replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>

          {currentFrame?.ai_annotation && (
            <motion.div
              key={currentFrameIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="panel rounded-xl border border-gold/20 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-gold">AI Commentary</p>
              <p className="mt-2 text-sm text-text-primary">{currentFrame.ai_annotation.text}</p>
            </motion.div>
          )}
        </div>
      </div>
      )}

      {!replayError && frames.length > 0 && (
      <div className="panel flex items-center justify-center gap-4 rounded-xl p-4">
        <Button variant="ghost" size="icon" onClick={() => setFrameIndex(Math.max(0, currentFrameIndex - 1))}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="default" size="icon" onClick={() => setPlaying(!isPlaying)}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setFrameIndex(Math.min(frames.length - 1, currentFrameIndex + 1))}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentFrameIndex}
          onChange={(e) => setFrameIndex(Number(e.target.value))}
          className="mx-4 w-full max-w-md accent-gold"
        />
        <span className="text-xs tabular-nums text-text-muted">
          {currentFrameIndex + 1} / {frames.length}
        </span>
      </div>
      )}
    </div>
  )
}
