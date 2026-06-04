import { motion } from 'framer-motion'
import { Brain, Dna, Target, Shield, BarChart3 } from 'lucide-react'
import { SectionReveal } from '@/components/landing/SectionReveal'

const metrics = [
  { label: 'Liquidity Stress', value: 0.62, color: '#d4af37' },
  { label: 'Emotional Entry', value: 0.58, color: '#5da9ff' },
  { label: 'Sweep Exposure', value: 0.71, color: '#f87171' },
  { label: 'Exec Precision', value: 0.64, color: '#34d399' },
  { label: 'Revenge Trade', value: 0.54, color: '#a78bfa' },
  { label: 'Vol Fragility', value: 0.67, color: '#fb923c' },
]

const features = [
  {
    icon: Dna,
    title: 'Trader Archetype',
    value: 'Post-Loss Accelerator',
    desc: 'Impulse-driven under stress — detected from 50+ behavioral signals.',
    color: '#d4af37',
  },
  {
    icon: Brain,
    title: 'AI Forensic Engine',
    value: 'Evidence-only insights',
    desc: 'Every insight requires real trade data + live orderbook evidence.',
    color: '#5da9ff',
  },
  {
    icon: Target,
    title: 'Execution Precision',
    value: '64% vs 82% peer avg',
    desc: 'Fragile execution patterns during spread expansion periods.',
    color: '#34d399',
  },
  {
    icon: Shield,
    title: 'Pre-Trade Risk Guard',
    value: '81% similarity score',
    desc: 'Warns before entries that match your historical losing setups.',
    color: '#a78bfa',
  },
]

function RadarBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="flex items-center gap-3"
    >
      <span className="w-28 text-[11px] text-text-muted shrink-0 tabular-nums">{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}bb, ${color})` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: delay + 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[12px] font-semibold tabular-nums w-10 text-right" style={{ color }}>
        {Math.round(value * 100)}%
      </span>
    </motion.div>
  )
}

export function BehavioralSection() {
  return (
    <section className="relative px-6 py-28 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: Visual DNA profile */}
          <SectionReveal>
            <div
              className="rounded-2xl p-6 lg:p-8"
              style={{
                background: 'rgba(11,11,15,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Dna className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">Trader Profile</p>
                    <p className="text-sm font-semibold text-text-primary">0x5c56...F1B1</p>
                  </div>
                </div>
                <div className="rounded-full px-3 py-1 text-[10px] font-medium"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', color: '#d4af37' }}>
                  Post-Loss Accelerator
                </div>
              </div>

              {/* Metric bars */}
              <div className="space-y-3.5 mb-6">
                {metrics.map((m, i) => (
                  <RadarBar key={m.label} {...m} delay={i * 0.08} />
                ))}
              </div>

              <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

              {/* AI insight card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="mt-5 rounded-xl p-4"
                style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-gold" />
                  <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">Live AI Insight</p>
                </div>
                <p className="text-sm leading-relaxed text-text-muted">
                  Your losses cluster during spread expansion. <span className="text-text-primary font-medium">68% of losing trades</span> in the last 30 days occurred when spread exceeded your 75th percentile entry threshold.
                </p>
              </motion.div>
            </div>
          </SectionReveal>

          {/* Right: Copy & features */}
          <div>
            <SectionReveal>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-blue">
                Behavioral Intelligence
              </p>
              <h2 className="heading-section text-text-primary">
                Your Trading DNA,
                <br />
                <span className="gradient-text-blue">decoded.</span>
              </h2>
              <p className="heading-sub mt-6">
                Proprietary behavioral metrics transform raw execution history
                into a personal intelligence profile — no generic benchmarks.
              </p>
            </SectionReveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {features.map((item, i) => (
                <SectionReveal key={item.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4, borderColor: `${item.color}33` }}
                    className="group rounded-xl p-5 transition-all duration-300"
                    style={{
                      background: 'rgba(17,17,22,0.6)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300"
                      style={{ background: `${item.color}14`, border: `1px solid ${item.color}28` }}>
                      <item.icon className="h-4 w-4 transition-colors" style={{ color: item.color }} />
                    </div>
                    <p className="text-[11px] text-text-muted mb-1">{item.title}</p>
                    <p className="text-sm font-semibold text-text-primary leading-tight">{item.value}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-text-muted/70">{item.desc}</p>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
