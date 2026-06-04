import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { TrendingDown, Zap, BarChart3, Brain, AlertTriangle, Activity, Shield, Eye } from 'lucide-react'

function AnimatedStat({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count}{suffix}
    </span>
  )
}

const metrics = [
  {
    icon: AlertTriangle,
    label: 'Liquidity Stress Index',
    value: 62,
    suffix: '%',
    color: '#d4af37',
    desc: 'Real-time hostility of current liquidity for your specific trading style.',
    tier: 'Critical',
  },
  {
    icon: Brain,
    label: 'Emotional Entry Score',
    value: 58,
    suffix: '%',
    color: '#f87171',
    desc: 'Measures impulsive entry patterns versus your optimal baseline.',
    tier: 'High',
  },
  {
    icon: Activity,
    label: 'Sweep Exposure Rating',
    value: 71,
    suffix: '%',
    color: '#5da9ff',
    desc: 'Vulnerability to institutional liquidity sweeps at time of entry.',
    tier: 'Critical',
  },
  {
    icon: Zap,
    label: 'Execution Precision',
    value: 64,
    suffix: '%',
    color: '#34d399',
    desc: 'Quality of fills relative to available liquidity depth.',
    tier: 'Moderate',
  },
  {
    icon: TrendingDown,
    label: 'Revenge Trade Risk',
    value: 54,
    suffix: '%',
    color: '#a78bfa',
    desc: 'Post-loss overtrading likelihood based on behavioral history.',
    tier: 'Elevated',
  },
  {
    icon: BarChart3,
    label: 'Volatility Fragility',
    value: 67,
    suffix: '%',
    color: '#fb923c',
    desc: 'Performance degradation during volatility regime expansion.',
    tier: 'High',
  },
  {
    icon: Shield,
    label: 'Pattern Match Score',
    value: 81,
    suffix: '%',
    color: '#d4af37',
    desc: 'Similarity of current setup to your 10 worst historical trades.',
    tier: 'Critical',
  },
  {
    icon: Eye,
    label: 'Market Regime Align.',
    value: 43,
    suffix: '%',
    color: '#34d399',
    desc: 'How well your strategy aligns with the current market regime.',
    tier: 'Low',
  },
]

const tierColors: Record<string, string> = {
  Critical: '#f87171',
  High: '#fbbf24',
  Elevated: '#fb923c',
  Moderate: '#5da9ff',
  Low: '#34d399',
}

export function MetricsSection() {
  return (
    <section id="metrics" className="relative px-6 py-28 lg:px-8 lg:py-40">
      {/* Section separator */}
      <div className="divider-subtle mb-24 mx-auto max-w-7xl" />

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
          <SectionReveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold">
              Institutional Metrics
            </p>
            <h2 className="heading-section text-text-primary">
              Hidden PNL leaks,
              <br />
              <span className="gradient-text">quantified.</span>
            </h2>
            <p className="heading-sub mt-5 max-w-xl">
              Proprietary behavioral metrics that generic dashboards never surface —
              built for institutional-grade self-analysis.
            </p>
          </SectionReveal>

          <SectionReveal delay={0.15}>
            <div className="flex gap-8">
              {[
                { value: 147, label: 'Behavioral signals', suffix: '' },
                { value: 8, label: 'Core metrics', suffix: '+' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-bold text-text-primary tabular-nums">
                    <AnimatedStat target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <SectionReveal key={m.label} delay={i * 0.05}>
              <motion.div
                whileHover={{ y: -5, borderColor: `${m.color}30` }}
                className="group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-350"
                style={{
                  background: 'rgba(13,13,18,0.72)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Icon */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-300"
                    style={{ background: `${m.color}12`, border: `1px solid ${m.color}25` }}>
                    <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                    style={{ background: `${tierColors[m.tier]}14`, color: tierColors[m.tier], border: `1px solid ${tierColors[m.tier]}30` }}
                  >
                    {m.tier}
                  </span>
                </div>

                {/* Label */}
                <p className="text-[11px] text-text-muted mb-2">{m.label}</p>

                {/* Big value */}
                <p className="text-4xl font-bold tabular-nums mb-3" style={{ color: m.color }}>
                  <AnimatedStat target={m.value} suffix={m.suffix} />
                </p>

                {/* Progress bar */}
                <div className="mb-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${m.color}60, ${m.color})` }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                {/* Desc */}
                <p className="text-[11px] leading-relaxed text-text-muted">{m.desc}</p>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px transition-all duration-500 opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg, transparent, ${m.color}60, transparent)` }}
                />

                {/* Corner glow on hover */}
                <div
                  className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${m.color}10 0%, transparent 70%)`, filter: 'blur(16px)' }}
                />
              </motion.div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
