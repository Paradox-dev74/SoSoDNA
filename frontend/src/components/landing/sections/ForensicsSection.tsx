import { motion } from 'framer-motion'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { COLORS } from '@/lib/constants'
import { Activity, AlertCircle, Eye, BarChart3, ArrowUpRight } from 'lucide-react'

const heatmapData = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  bid: Math.max(8, 100 - Math.max(0, i - 9) * 9 + Math.sin(i * 0.8) * 6),
  ask: Math.max(8, 94 - Math.max(0, i - 10) * 8 + Math.cos(i * 0.6) * 5),
  sweep: i > 12 ? 0.25 + (i - 12) * 0.14 : 0.04 + Math.random() * 0.05,
}))

const features = [
  'Orderbook depth',
  'Sweep detection',
  'Spread timeline',
  'Imbalance score',
  'Volatility zones',
  'Regime overlays',
]

const annotations = [
  { label: 'Bid Depth Collapse', value: '-63%', color: '#f87171', x: '62%', y: '8%' },
  { label: 'Sweep Zone', value: 'Active', color: '#d4af37', x: '72%', y: '55%' },
]

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; name: string }[] }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(11,11,15,0.98)', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      <p className="text-text-muted mb-1">Orderbook State</p>
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums">
          <span className="text-text-muted">{p.name === 'bid' ? 'Bid' : 'Ask'}: </span>
          <span className="font-semibold text-text-primary">{Math.round(p.value)}k</span>
        </p>
      ))}
    </div>
  )
}

export function ForensicsSection() {
  return (
    <section id="forensics" className="relative px-6 py-28 lg:px-8 lg:py-40">
      {/* Section separator */}
      <div className="divider-subtle mb-24 mx-auto max-w-7xl" />

      <div className="mx-auto max-w-7xl">
        <SectionReveal className="text-center max-w-3xl mx-auto">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
            Liquidity Forensics
          </p>
          <h2 className="heading-section text-text-primary">
            See what the market was doing
            <br />
            <span className="gradient-text">when you lost.</span>
          </h2>
          <p className="heading-sub mt-6 mx-auto max-w-xl">
            Cinematic microstructure analysis — depth, sweeps, spread expansion,
            and volatility zones reconstructed around every entry.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.18} className="mt-16">
          <div
            className="relative overflow-hidden rounded-2xl p-6 lg:p-10"
            style={{
              background: 'rgba(11,11,15,0.85)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Chart header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(93,169,255,0.1)', border: '1px solid rgba(93,169,255,0.2)' }}>
                  <BarChart3 className="h-4 w-4 text-blue" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Orderbook Depth Map</p>
                  <p className="text-[10px] text-text-muted">BTC-USD · 2-minute window around trade entry</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm" style={{ background: COLORS.blue }} />
                  <span className="text-text-muted">Bid</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm" style={{ background: COLORS.gold }} />
                  <span className="text-text-muted">Ask</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 text-red-400" />
                  <span className="text-text-muted">Sweep</span>
                </div>
              </div>
            </div>

            {/* Main chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={heatmapData} barGap={1} barCategoryGap={2}>
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="bid" stackId="a" fill={COLORS.blue} opacity={0.55} radius={[0, 0, 0, 0]} isAnimationActive={true} animationDuration={1400} />
                  <Bar dataKey="ask" stackId="a" radius={[3, 3, 0, 0]} isAnimationActive={true} animationDuration={1600}>
                    {heatmapData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.sweep > 0.25 ? COLORS.gold : 'rgba(212,175,55,0.35)'}
                        opacity={0.5 + entry.sweep * 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Entry line */}
              <div
                className="absolute top-0 bottom-0"
                style={{ left: '62%', width: 1, background: 'linear-gradient(to bottom, transparent, rgba(212,175,55,0.6), transparent)' }}
              />
              <div
                className="absolute rounded px-2 py-0.5 text-[9px] font-bold"
                style={{ left: '63%', top: '6px', background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                ENTRY
              </div>

              {/* Floating annotations */}
              {annotations.map((ann) => (
                <motion.div
                  key={ann.label}
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="absolute rounded-lg px-2.5 py-1.5 pointer-events-none hidden sm:block"
                  style={{
                    left: ann.x,
                    top: ann.y,
                    background: 'rgba(11,11,15,0.92)',
                    border: `1px solid ${ann.color}40`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: ann.color }}>{ann.label}</p>
                  <p className="text-[12px] font-bold tabular-nums" style={{ color: ann.color }}>{ann.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Glow line divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="divider-glow my-6 origin-left"
            />

            {/* Summary row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Bid Depth Collapse', value: '-63%', icon: Activity, color: '#f87171' },
                { label: 'Spread at Entry', value: '14.2 bps', icon: ArrowUpRight, color: '#d4af37' },
                { label: 'Sweep Risk', value: 'Critical', icon: AlertCircle, color: '#f87171' },
                { label: 'Imbalance', value: '0.82', icon: Eye, color: '#5da9ff' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.025)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <stat.icon className="h-3 w-3" style={{ color: stat.color }} />
                    <p className="text-[9px] uppercase tracking-wider text-text-muted">{stat.label}</p>
                  </div>
                  <p className="text-base font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>

        {/* Feature pills */}
        <SectionReveal delay={0.3} className="mt-10">
          <div className="flex flex-wrap justify-center gap-2.5">
            {features.map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2, borderColor: 'rgba(212,175,55,0.3)' }}
                className="cursor-default rounded-full px-4 py-2 text-[12px] text-text-muted transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {f}
              </motion.span>
            ))}
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
