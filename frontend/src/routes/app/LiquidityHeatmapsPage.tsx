import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getLiquidityHeatmap } from '@/lib/api/heatmaps'
import { COLORS } from '@/lib/constants'

export function LiquidityHeatmapsPage() {
  const { data: heatmap, isLoading, error } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => getLiquidityHeatmap(),
    retry: false,
  })

  const depthData = useMemo(
    () =>
      heatmap?.points.map((p, i) => ({
        name: `${i}`,
        bid: p.bid_depth,
        ask: p.ask_depth,
        sweep: p.sweep_risk * 100,
      })) || [],
    [heatmap],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading orderbook-derived heatmap...
      </div>
    )
  }

  if (error || !heatmap?.points.length) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Liquidity Heatmaps</h1>
          <p className="text-sm text-text-muted">Depth and sweep zones from stored SoDEX orderbook snapshots</p>
        </div>
        <div className="panel rounded-xl p-6 text-sm text-text-muted">
          <p>No liquidity snapshots available yet.</p>
          <p className="mt-2">
            Sync your wallet from the top bar after connecting. Heatmaps require ingested SoDEX orderbook depth data — not synthetic frames.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Liquidity Heatmaps</h1>
        <p className="text-sm text-text-muted">
          Live depth from SoDEX snapshots — {heatmap.symbol} · {heatmap.points.length} points
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel rounded-xl p-4">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Depth Bands</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={depthData}>
            <XAxis dataKey="name" tick={false} axisLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111114', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
            <Bar dataKey="bid" stackId="a" fill={COLORS.blue} opacity={0.7} />
            <Bar dataKey="ask" stackId="a" fill={COLORS.gold} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Sweep Risk Zones</h3>
          <div className="space-y-2">
            {heatmap.sweep_zones.slice(0, 8).map((zone, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-bg-elevated px-3 py-2">
                <span className="text-sm tabular-nums text-text-primary">${zone.price.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-red-400" style={{ width: `${zone.risk * 100}px`, maxWidth: 100 }} />
                  <span className="text-xs tabular-nums text-red-400">{Math.round(zone.risk * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-xl p-4">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Spread Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={heatmap.spread_centerline.map((s, i) => ({ name: String(i), spread: s.spread_bps }))}>
              <XAxis dataKey="name" tick={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} />
              <Bar dataKey="spread" radius={[2, 2, 0, 0]}>
                {heatmap.spread_centerline.map((s, i) => (
                  <Cell key={i} fill={s.spread_bps > 10 ? COLORS.gold : COLORS.blue} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
