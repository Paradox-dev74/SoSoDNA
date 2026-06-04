import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import { SectionReveal } from '@/components/landing/SectionReveal'
import { MagneticButton } from '@/components/motion/MagneticButton'

function FloatingParticle({ i }: { i: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${5 + (i * 9.7) % 90}%`,
        top: `${10 + (i * 13.3) % 80}%`,
        width: i % 3 === 0 ? 2 : 1,
        height: i % 3 === 0 ? 2 : 1,
        background: i % 4 === 0 ? '#5da9ff' : '#d4af37',
        opacity: 0.3,
      }}
      animate={{
        y: [0, -(15 + i * 2), 0],
        opacity: [0.2, 0.6, 0.2],
        scale: [1, 1.5, 1],
      }}
      transition={{ duration: 4 + (i % 6), repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
    />
  )
}

const integrations = [
  { name: 'SoDEX', desc: 'Live testnet orderbook', color: '#5da9ff' },
  { name: 'SoSoValue', desc: 'Market intelligence', color: '#d4af37' },
  { name: 'AI Engine', desc: 'Evidence-only insights', color: '#34d399' },
]

export function FinalCTA() {
  const navigate = useNavigate()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-40 lg:px-8 lg:py-60">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%)',
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 60% at 30% 60%, rgba(93,169,255,0.05) 0%, transparent 65%)',
        }} />
        <div className="grid-overlay opacity-[0.15]" />
      </div>

      {/* Gold orb */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          y,
          width: 640,
          height: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.03) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => <FloatingParticle key={i} i={i} />)}

      {/* Glowing ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block"
        style={{
          width: 700,
          height: 700,
          borderRadius: '50%',
          border: '1px solid rgba(212,175,55,0.06)',
        }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block"
        style={{
          width: 900,
          height: 900,
          borderRadius: '50%',
          border: '1px solid rgba(93,169,255,0.04)',
        }}
      />

      {/* Content */}
      <SectionReveal className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 inline-flex items-center gap-2 rounded-full px-5 py-2"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.2)' }}
        >
          <Zap className="h-3.5 w-3.5 text-gold" />
          <span className="text-[11px] font-medium tracking-wide text-gold">
            Start Your Free Analysis
          </span>
        </motion.div>

        <h2 className="heading-display text-text-primary text-balance">
          Discover Your
          <br />
          <span className="gradient-text">Trading DNA.</span>
        </h2>

        <p className="heading-sub mx-auto mt-8 max-w-xl">
          Connect your wallet. Transform raw SoDEX trade history into institutional-grade
          behavioral intelligence — in minutes.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <MagneticButton onClick={() => navigate('/connect')}>
            <div
              className="flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-semibold text-bg-deep transition-all duration-200 hover:shadow-2xl hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f5d76e 45%, #c49a22 100%)' }}
            >
              Connect Wallet
              <ArrowRight className="h-4 w-4" />
            </div>
          </MagneticButton>

          <MagneticButton onClick={() => navigate('/connect')}>
            <div
              className="flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-text-primary transition-all duration-200 hover:border-white/20 hover:bg-white/[0.08]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Start Analysis
            </div>
          </MagneticButton>
        </motion.div>

        {/* Integration row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6"
        >
          <span className="text-[11px] text-text-muted">Powered by</span>
          {integrations.map((int) => (
            <div
              key={int.name}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: `${int.color}08`, border: `1px solid ${int.color}20` }}
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: int.color }} />
              <span className="text-[11px] font-medium" style={{ color: int.color }}>{int.name}</span>
              <span className="text-[10px] text-text-muted">{int.desc}</span>
            </div>
          ))}
        </motion.div>
      </SectionReveal>
    </section>
  )
}
