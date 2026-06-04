import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HeroKeycap } from '@/components/landing/HeroKeycap'
import { MagneticButton } from '@/components/motion/MagneticButton'

const trustBadges = [
  { rating: '4.9', label: 'SoDEX Testnet', stars: 5 },
  { rating: 'Live', label: 'AI Forensics', stars: 5 },
]

const partners = ['SoDEX', 'SoSoValue', 'ValueChain', 'OpenAI', 'Hyperliquid', 'Aevo']

export function LandingHero() {
  const navigate = useNavigate()

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-20 lg:px-8">
      {/* Hero wallpaper */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src="/hero-wallpaper.png"
          alt=""
          className="h-full w-full object-cover object-center"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, rgba(5,5,7,0.55) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(5,5,7,0.3) 0%, transparent 25%, transparent 75%, rgba(5,5,7,0.6) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {/* Trust row — Dovetail G2/Capterra style */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hero-trust mb-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {trustBadges.map((badge) => (
            <div key={badge.label} className="flex items-center gap-2.5">
              <div className="flex gap-0.5">
                {Array.from({ length: badge.stars }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-white text-white" />
                ))}
              </div>
              <span className="tabular-nums text-text-primary">{badge.rating}</span>
              <span className="text-text-muted">{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Headline — Dovetail: sans + keycap + pixel word */}
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-hero-sans hero-headline text-balance text-text-primary"
          aria-label="Trade with intelligence, not emotion."
        >
          <span className="block">Trade with intelligence,</span>
          <span className="mt-1 flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4">
            <span>not</span>
            <HeroKeycap />
            <span className="font-hero-pixel text-[0.92em] text-text-primary">emotion.</span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="hero-subline mt-8 max-w-2xl text-balance text-text-muted"
        >
          SOSO DNA uses AI, live SoDEX orderbook data, and SoSoValue intelligence
          to surface the behavioral patterns and liquidity traps destroying your PNL.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton onClick={() => navigate('/connect')}>
            <div
              className="flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-bg-deep transition-all duration-200 hover:shadow-xl hover:shadow-gold/25 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #f5d76e 0%, #d4af37 50%, #c49a22 100%)' }}
            >
              Connect Wallet
              <ArrowRight className="h-4 w-4" />
            </div>
          </MagneticButton>

          <MagneticButton onClick={() => navigate('/connect')}>
            <div
              className="flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-white/25 hover:bg-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              View Live Demo
            </div>
          </MagneticButton>
        </motion.div>
      </div>

      {/* Partner logo bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.8 }}
        className="relative z-10 mx-auto mt-auto w-full max-w-5xl pt-20 lg:pt-28"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          {partners.map((name, i) => (
            <motion.span
              key={name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 + i * 0.06 }}
              className="text-sm font-medium tracking-wide text-text-muted/40 transition-colors duration-300 hover:text-text-muted/70"
              style={{ fontVariant: 'all-small-caps', letterSpacing: '0.08em' }}
            >
              {name}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
