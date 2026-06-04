import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { CursorReactiveCard } from '@/components/motion/CursorReactiveCard'
import { TrendingDown, AlertTriangle, RotateCcw } from 'lucide-react'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1600
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

const problems = [
  {
    icon: AlertTriangle,
    myth: 'Bad signals',
    reality: 'Spread expansion at entry',
    stat: 68,
    suffix: '%',
    color: '#d4af37',
    desc: 'of losses linked to elevated spread at the moment of execution — not signal quality.',
  },
  {
    icon: TrendingDown,
    myth: 'Wrong direction',
    reality: 'Liquidity sweep exposure',
    stat: 71,
    suffix: '%',
    color: '#5da9ff',
    desc: 'of underwater positions correlated with thin orderbook depth at entry time.',
  },
  {
    icon: RotateCcw,
    myth: 'Bad timing',
    reality: 'Post-loss revenge trading',
    stat: 54,
    suffix: '%',
    color: '#34d399',
    desc: 'of losing streaks contain at least one revenge entry within 10 minutes of a prior loss.',
  },
]

export function ProblemSection() {
  return (
    <section id="intelligence" className="relative px-6 py-28 lg:px-8 lg:py-40">
      {/* Section separator */}
      <div className="divider-subtle mb-24 mx-auto max-w-7xl" />

      <div className="mx-auto max-w-7xl">
        <SectionReveal>
          <div className="max-w-3xl">
            <motion.p
              className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-gold"
            >
              The Problem
            </motion.p>
            <h2 className="heading-section text-text-primary text-balance">
              Most traders don't know
              <br />
              <span className="gradient-text">why they lose.</span>
            </h2>
            <p className="heading-sub mt-6 max-w-2xl">
              PNL compresses thousands of trading decisions into a single number.
              SOSO DNA decompresses those decisions — and shows exactly where the bleeding happens.
            </p>
          </div>
        </SectionReveal>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {problems.map((item, i) => (
            <SectionReveal key={item.myth} delay={i * 0.12}>
              <CursorReactiveCard className="h-full">
                <div className="p-8">
                  {/* Myth */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: `rgba(${item.color === '#d4af37' ? '212,175,55' : item.color === '#5da9ff' ? '93,169,255' : '52,211,153'},0.1)` }}>
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <p className="text-sm text-text-muted line-through decoration-red-400/40 decoration-2">
                      "{item.myth}"
                    </p>
                  </div>

                  {/* Reality */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <p className="text-sm uppercase tracking-wider font-medium"
                      style={{ color: item.color, opacity: 0.7 }}>
                      Actually:
                    </p>
                    <p className="mt-2 text-lg font-semibold text-text-primary leading-tight">
                      {item.reality}
                    </p>
                  </motion.div>

                  {/* Big stat */}
                  <div className="mt-8 flex items-baseline gap-1">
                    <span className="text-5xl font-bold tabular-nums" style={{ color: item.color }}>
                      <AnimatedCounter target={item.stat} suffix={item.suffix} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.desc}</p>

                  {/* Bottom bar */}
                  <div className="mt-6 h-0.5 w-0 rounded-full transition-all duration-700 group-hover:w-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
                  />
                </div>
              </CursorReactiveCard>
            </SectionReveal>
          ))}
        </div>

        {/* Quote */}
        <SectionReveal delay={0.35} className="mt-20 text-center">
          <blockquote className="mx-auto max-w-2xl">
            <p className="text-xl font-medium italic leading-relaxed text-text-muted">
              "The difference between a profitable trader and an unprofitable one
              isn't their signals — it's what they{' '}
              <em className="not-italic font-semibold text-text-primary">don't see</em>{' '}
              about their own behavior."
            </p>
          </blockquote>
        </SectionReveal>
      </div>
    </section>
  )
}
