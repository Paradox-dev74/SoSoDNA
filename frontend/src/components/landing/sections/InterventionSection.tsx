import { motion } from 'framer-motion'
import { AlertTriangle, Shield, Brain, ArrowRight } from 'lucide-react'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { StreamingText } from '@/components/landing/StreamingText'
import { useNavigate } from 'react-router-dom'

const contributors = [
  { factor: 'Spread Expansion', impact: 31, color: '#d4af37' },
  { factor: 'Revenge Trade Window', impact: 24, color: '#f87171' },
  { factor: 'Thin Ask Depth', impact: 18, color: '#5da9ff' },
  { factor: 'Macro Proximity', impact: 15, color: '#a78bfa' },
]

export function InterventionSection() {
  const navigate = useNavigate()

  return (
    <section className="relative px-6 py-28 lg:px-8 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left: Copy */}
          <SectionReveal>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-red-400">
              AI Intervention
            </p>
            <h2 className="heading-section text-text-primary">
              Warned before
              <br />
              the mistake happens.
            </h2>
            <p className="heading-sub mt-6">
              Before you enter, SOSO DNA detects similarity to your historical
              losing patterns and explains <em className="not-italic font-medium text-text-primary">exactly</em>{' '}
              why this setup is dangerous — in real time.
            </p>

            <div className="mt-10 space-y-5">
              {[
                {
                  icon: Brain,
                  title: 'Behavioral Pattern Matching',
                  desc: 'Compares entry conditions against your full trade history at millisecond speed.',
                  color: '#5da9ff',
                },
                {
                  icon: Shield,
                  title: 'Live Liquidity Validation',
                  desc: 'Cross-references live SoDEX orderbook depth before emitting any risk score.',
                  color: '#d4af37',
                },
                {
                  icon: AlertTriangle,
                  title: 'Evidence-Only Insights',
                  desc: 'No AI hallucinations — every warning is backed by your actual data.',
                  color: '#34d399',
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
                    style={{ background: `${item.color}14`, border: `1px solid ${item.color}30` }}>
                    <item.icon className="h-4 w-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                    <p className="text-sm leading-relaxed text-text-muted mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              onClick={() => navigate('/connect')}
              className="mt-10 flex items-center gap-2 text-sm font-medium text-gold hover:gap-3 transition-all duration-200"
            >
              Enable AI Guard
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </SectionReveal>

          {/* Right: Warning card */}
          <SectionReveal delay={0.2}>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(11,11,15,0.9)',
                border: '1px solid rgba(248,113,113,0.2)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(248,113,113,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Red glow top */}
              <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(248,113,113,0.12) 0%, transparent 70%)' }}
              />

              <div className="relative p-8">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}>
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-red-400">
                      Critical Warning
                    </p>
                    <p className="mt-1 text-base font-semibold leading-snug text-text-primary">
                      This setup matches your historical losing entries
                    </p>
                  </div>
                </div>

                {/* Big score */}
                <div
                  className="rounded-xl p-5 mb-5"
                  style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.p
                        className="text-6xl font-bold tabular-nums text-red-400"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
                      >
                        81%
                      </motion.p>
                      <p className="text-sm text-text-muted mt-1">Similarity to losing setups</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Severity</p>
                      <div className="rounded-lg px-3 py-1.5"
                        style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
                        <p className="text-sm font-bold text-red-400">CRITICAL</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #f87171, #ef4444)' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: '81%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                    />
                  </div>
                </div>

                {/* Contributors */}
                <div className="space-y-2 mb-5">
                  {contributors.map((c, i) => (
                    <motion.div
                      key={c.factor}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="flex-1 text-[12px] text-text-primary">{c.factor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full" style={{ width: `${c.impact * 3.2}%`, background: c.color, opacity: 0.7 }} />
                        </div>
                        <span className="text-[11px] font-medium tabular-nums w-8 text-right" style={{ color: c.color }}>
                          {c.impact}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* AI reasoning */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(5,5,8,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2">AI Analysis</p>
                  <StreamingText
                    lines={[
                      '→ Matching spread conditions...',
                      '→ Entry window: 8min after prior loss',
                      '→ Ask depth: 47% below 30-day avg',
                      '→ Rec: delay until spread normalizes.',
                    ]}
                  />
                </div>
              </div>
            </motion.div>
          </SectionReveal>
        </div>
      </div>
    </section>
  )
}
