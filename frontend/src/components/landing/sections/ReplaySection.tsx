import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Rewind, FastForward } from 'lucide-react'
import { useState } from 'react'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { Area, AreaChart, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts'

const timelineEvents = [
  { time: 'T−20s', label: 'Stable liquidity', state: 'stable', detail: 'Bid/ask balanced, spread 4.2 bps' },
  { time: 'T−8s', label: 'Bid thinning', state: 'warning', detail: 'Depth drops 32%, imbalance rising' },
  { time: 'T+0', label: 'Entry executed', state: 'entry', detail: '$65,240 · Long · $5,000 notional' },
  { time: 'T+12s', label: 'Spread +312%', state: 'critical', detail: 'Spread spikes to 14.8 bps' },
  { time: 'T+18s', label: 'Liquidity collapse', state: 'critical', detail: 'Ask depth −63%, stop triggered' },
]

const stateColors: Record<string, string> = {
  stable: '#34d399',
  warning: '#fbbf24',
  entry: '#d4af37',
  critical: '#f87171',
}

const priceChart = Array.from({ length: 32 }, (_, i) => ({
  i,
  v: 65400 + Math.sin(i * 0.3) * 80 - (i > 18 ? (i - 18) * 30 : 0),
}))

export function ReplaySection() {
  const [progress, setProgress] = useState(22)
  const [playing, setPlaying] = useState(false)
  const [activeEvent, setActiveEvent] = useState(2)

  const currentState = timelineEvents[activeEvent]?.state ?? 'stable'
  const accentColor = stateColors[currentState]

  return (
    <section id="replay" className="relative px-6 py-28 lg:px-8 lg:py-40">
      {/* Section separator */}
      <div className="divider-subtle mb-24 mx-auto max-w-7xl" />

      <div className="mx-auto max-w-7xl">
        <SectionReveal className="text-center max-w-3xl mx-auto">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue">
            Trade Replay Engine
          </p>
          <h2 className="heading-section text-text-primary">
            Investigate every loss
            <br />
            <span className="gradient-text-blue">like a forensic case.</span>
          </h2>
          <p className="heading-sub mt-6 mx-auto max-w-xl">
            Step through the exact market microstructure around your trade — second by second,
            with AI commentary annotated at each inflection point.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.15} className="mt-16">
          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: 'rgba(11,11,15,0.88)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Trade header */}
            <div
              className="flex items-center justify-between px-6 py-4 transition-colors duration-500"
              style={{ borderBottom: `1px solid ${accentColor}20` }}
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  BTC-USD · Long · <span className="text-red-400 tabular-nums">−$890.75</span>
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {currentState === 'entry' ? 'Entry point' : currentState === 'critical' ? 'Critical phase' : 'Pre-entry analysis'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300"
                  style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}35` }}
                >
                  <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: accentColor }} />
                </div>
                <span className="text-[10px] font-medium capitalize" style={{ color: accentColor }}>
                  {currentState}
                </span>
              </div>
            </div>

            <div className="p-6 lg:p-8">
              {/* Price chart */}
              <div className="relative mb-6 rounded-xl overflow-hidden"
                style={{ background: 'rgba(5,5,8,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={priceChart}>
                    <defs>
                      <linearGradient id="replayGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: 'rgba(11,11,15,0.98)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v) => [`$${Number(v).toFixed(0)}`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={accentColor}
                      fill="url(#replayGrad)"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <ReferenceLine
                      x={18}
                      stroke="rgba(212,175,55,0.4)"
                      strokeDasharray="4 4"
                      label={{ value: 'Entry', fill: '#d4af37', fontSize: 10, position: 'top' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Progress cursor */}
                <motion.div
                  className="absolute inset-y-0 pointer-events-none"
                  style={{ left: `${progress}%`, width: 1, background: `linear-gradient(to bottom, ${accentColor}80, transparent)` }}
                />
              </div>

              {/* Scrubber */}
              <div className="relative mb-5 h-2 overflow-hidden rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accentColor}60, ${accentColor})` }}
                  animate={playing ? { width: ['22%', '85%'] } : { width: `${progress}%` }}
                  transition={playing ? { duration: 8, ease: 'linear' } : { type: 'spring', stiffness: 200 }}
                />
                {/* Event markers */}
                {timelineEvents.map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-0.5 rounded-full"
                    style={{ left: `${15 + i * 17}%`, background: stateColors[timelineEvents[i].state], opacity: 0.5 }}
                  />
                ))}
              </div>

              {/* Event cards */}
              <div className="grid gap-2.5 sm:grid-cols-5 mb-6">
                {timelineEvents.map((e, i) => {
                  const c = stateColors[e.state]
                  const isActive = i === activeEvent
                  return (
                    <motion.button
                      key={e.time}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => { setActiveEvent(i); setProgress(15 + i * 17) }}
                      whileHover={{ y: -2 }}
                      className="relative rounded-xl px-3 py-3.5 text-left transition-all duration-200 overflow-hidden"
                      style={{
                        background: isActive ? `${c}12` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isActive ? `${c}35` : 'rgba(255,255,255,0.05)'}`,
                      }}
                    >
                      <p className="font-mono text-[9px] mb-1" style={{ color: c, opacity: 0.8 }}>{e.time}</p>
                      <p className="text-[11px] font-medium leading-tight" style={{ color: isActive ? c : 'inherit' }}>
                        {e.label}
                      </p>
                    </motion.button>
                  )
                })}
              </div>

              {/* Active event detail */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeEvent}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mb-5 rounded-xl p-4"
                  style={{ background: `${stateColors[currentState]}08`, border: `1px solid ${stateColors[currentState]}20` }}
                >
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: stateColors[currentState] }}>
                    {timelineEvents[activeEvent]?.time}
                  </p>
                  <p className="text-sm text-text-primary font-medium">{timelineEvents[activeEvent]?.detail}</p>
                </motion.div>
              </AnimatePresence>

              {/* Controls */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setActiveEvent(Math.max(0, activeEvent - 1)); setProgress(Math.max(15, progress - 17)) }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <Rewind className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPlaying(!playing)}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`, boxShadow: `0 4px 20px ${accentColor}40` }}
                >
                  {playing ? <Pause className="h-4 w-4 text-bg-deep" /> : <Play className="h-4 w-4 text-bg-deep ml-0.5" />}
                </button>
                <button onClick={() => { setActiveEvent(Math.min(4, activeEvent + 1)); setProgress(Math.min(85, progress + 17)) }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <FastForward className="h-3.5 w-3.5" />
                </button>
                <div className="ml-auto text-[11px] tabular-nums text-text-muted">
                  {activeEvent + 1} / {timelineEvents.length}
                </div>
              </div>

              {/* AI commentary */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-gold font-semibold mb-2">
                  AI Commentary
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeEvent}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm leading-relaxed text-text-muted"
                  >
                    {activeEvent === 0 && 'Liquidity conditions are stable. Spread at 4.2 bps, well within your historical comfort zone. No behavioral flags.'}
                    {activeEvent === 1 && 'Warning: bid depth thinning detected. Imbalance rising. This pattern precedes spread expansion in 71% of similar setups.'}
                    {activeEvent === 2 && 'Entry executed at T+0. Market microstructure was already deteriorating — execution fragility score elevated.'}
                    {activeEvent === 3 && 'Spread expansion of +312%. This matches your top-5 worst historical execution conditions. Stop exposure critical.'}
                    {activeEvent === 4 && 'At T+18s, ask depth collapsed by 63%, creating a sweep zone before your stop was triggered. The entry was execution-fragile — not directionally wrong.'}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
