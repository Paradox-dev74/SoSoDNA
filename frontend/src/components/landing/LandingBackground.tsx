import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useId } from 'react'

function ParticleField() {
  const id = useId()
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${4 + (i * 4.1) % 92}%`,
    top: `${8 + (i * 7.3) % 82}%`,
    size: i % 3 === 0 ? 1.5 : 1,
    duration: 5 + (i % 7),
    delay: i * 0.22,
    opacity: i % 4 === 0 ? 0.5 : 0.25,
  }))

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={`${id}-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: p.id % 5 === 0 ? '#5da9ff' : '#d4af37',
            opacity: p.opacity,
          }}
          animate={{ y: [0, -22, 0], opacity: [p.opacity, p.opacity * 2.2, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

function LiquidityFlowLines() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.07]"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
          <stop offset="50%" stopColor="#d4af37" stopOpacity="1" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5da9ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#5da9ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#5da9ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGoldV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0" />
          <stop offset="50%" stopColor="#d4af37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Horizontal flow lines */}
      <motion.line
        x1="-10%" y1="30%" x2="110%" y2="30%"
        stroke="url(#lineGold)" strokeWidth="0.5"
        animate={{ x1: ['-80%', '10%', '-80%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.line
        x1="-10%" y1="65%" x2="110%" y2="65%"
        stroke="url(#lineBlue)" strokeWidth="0.4"
        animate={{ x1: ['10%', '-80%', '10%'] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
      <motion.line
        x1="-10%" y1="50%" x2="110%" y2="50%"
        stroke="url(#lineGold)" strokeWidth="0.3"
        animate={{ x1: ['-40%', '40%', '-40%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      {/* Vertical accent */}
      <motion.line
        x1="20%" y1="-10%" x2="20%" y2="110%"
        stroke="url(#lineGoldV)" strokeWidth="0.4"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.line
        x1="78%" y1="-10%" x2="78%" y2="110%"
        stroke="url(#lineGoldV)" strokeWidth="0.3"
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
    </svg>
  )
}

export function LandingBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const y1 = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const y2 = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const y3 = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [1, 0.9, 0.7])

  return (
    <motion.div ref={ref} style={{ opacity }} className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-bg-deep" />

      {/* Grid */}
      <div className="absolute inset-0 grid-overlay opacity-[0.22] grid-fade-bottom" />

      {/* Mesh gradients */}
      <div className="absolute inset-0 mesh-gradient-hero opacity-90" />

      {/* Primary gold orb */}
      <motion.div
        className="absolute -left-[18%] top-[5%] h-[700px] w-[700px] rounded-full"
        animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          y: y1,
          background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 50%, transparent 75%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Blue orb */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{
          y: y2,
          position: 'absolute',
          right: '-14%',
          top: '25%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(93,169,255,0.1) 0%, rgba(93,169,255,0.03) 55%, transparent 75%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Bottom center accent */}
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          y: y3,
          position: 'absolute',
          left: '35%',
          bottom: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Liquidity flow lines */}
      <LiquidityFlowLines />

      {/* Floating particles */}
      <ParticleField />

      {/* Corner vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 120% 120% at 50% -20%, transparent 50%, rgba(5,5,7,0.6) 100%)',
        }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-b from-transparent to-bg-deep/80" />
    </motion.div>
  )
}
