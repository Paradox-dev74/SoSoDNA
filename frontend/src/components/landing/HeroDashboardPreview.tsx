import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { AlertTriangle, Brain, Activity, TrendingDown, Zap, BarChart2 } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useRef } from 'react'

const priceData = Array.from({ length: 24 }, (_, i) => ({
  v: 67400 + Math.sin(i * 0.45) * 280 - (i > 14 ? (i - 14) * 55 : 0) + (Math.random() - 0.5) * 60,
}))

const dnaScores = [
  { label: 'Emotional Entry', value: 58, color: '#d4af37' },
  { label: 'Sweep Exposure', value: 71, color: '#5da9ff' },
  { label: 'Exec Precision', value: 64, color: '#34d399' },
]

function FloatingCard({
  children,
  className,
  delay,
  floatY = 8,
  floatDuration = 6,
}: {
  children: React.ReactNode
  className?: string
  delay: number
  floatY?: number
  floatDuration?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -floatY, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function HeroDashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 })
  const rotateX = useTransform(springY, [-150, 150], [4, -4])
  const rotateY = useTransform(springX, [-150, 150], [-4, 4])

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0) }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto h-[500px] w-full max-w-xl lg:h-[560px] cursor-default select-none"
    >
      {/* Main forensics card */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-4 top-12 bottom-4 rounded-2xl p-5 shadow-2xl"
        style={{
          background: 'rgba(13,13,18,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
          rotateX,
          rotateY,
          transformPerspective: 1000,
        }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'rgba(93,169,255,0.1)' }}>
              <Brain className="h-3.5 w-3.5 text-blue" />
            </div>
            <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Forensic Analysis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-medium text-red-400">LIVE</span>
          </div>
        </div>

        {/* Price chart */}
        <div className="relative">
          <div className="absolute left-0 top-2 text-[10px] text-text-muted font-mono">BTC-USD</div>
          <div className="absolute right-0 top-2 text-[10px] font-mono tabular-nums text-red-400">-2.4%</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity={0.3} />
                  <stop offset="60%" stopColor="#d4af37" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#d4af37"
                fill="url(#heroGrad)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
          {/* Entry marker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute left-[58%] top-[22%] flex flex-col items-center"
          >
            <div className="h-10 w-px bg-gradient-to-b from-gold to-transparent opacity-60" />
            <div className="rounded-full bg-gold px-1.5 py-0.5 text-[8px] font-bold text-bg-deep mt-px">ENTRY</div>
          </motion.div>
        </div>

        {/* DNA score bars */}
        <div className="mt-4 space-y-2.5">
          {dnaScores.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.12 }}
              className="flex items-center gap-3"
            >
              <span className="w-[90px] text-[10px] text-text-muted shrink-0">{s.label}</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 1.2, delay: 1.0 + i * 0.15, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: s.color }}>{s.value}%</span>
            </motion.div>
          ))}
        </div>

        {/* AI alert */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-4 flex items-start gap-2.5 rounded-xl p-3"
          style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider">AI Warning</p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              Entry during spread expansion — matches <span className="text-red-300 font-semibold">81%</span> of your historical losing setups
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating: Pattern Match */}
      <FloatingCard
        delay={0.7}
        floatY={7}
        floatDuration={5.5}
        className="absolute -left-4 top-8 hidden lg:block"
      >
        <div
          className="w-40 rounded-xl p-3"
          style={{
            background: 'rgba(11,11,15,0.92)',
            border: '1px solid rgba(212,175,55,0.2)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="h-3 w-3 text-gold" />
            <span className="text-[9px] uppercase tracking-widest text-text-muted">Pattern Match</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-gold">81%</p>
          <p className="text-[9px] text-text-muted mt-0.5">Losing setup similarity</p>
        </div>
      </FloatingCard>

      {/* Floating: Liquidity Stress */}
      <FloatingCard
        delay={0.9}
        floatY={9}
        floatDuration={7}
        className="absolute -right-6 top-20 hidden lg:block"
      >
        <div
          className="w-44 rounded-xl p-3"
          style={{
            background: 'rgba(11,11,15,0.92)',
            border: '1px solid rgba(93,169,255,0.2)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart2 className="h-3 w-3 text-blue" />
            <span className="text-[9px] uppercase tracking-widest text-text-muted">Liquidity Stress</span>
          </div>
          <p className="text-xl font-bold text-blue">Critical</p>
          <div className="mt-2 flex gap-1">
            {[0.9, 0.75, 0.95, 0.6, 0.85, 0.7, 0.92].map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-sm"
                style={{ background: '#5da9ff' }}
                animate={{ height: `${h * 20}px`, opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>
      </FloatingCard>

      {/* Floating: PNL Leak */}
      <FloatingCard
        delay={1.1}
        floatY={6}
        floatDuration={8}
        className="absolute -left-2 bottom-4 hidden lg:block"
      >
        <div
          className="w-40 rounded-xl p-3"
          style={{
            background: 'rgba(11,11,15,0.92)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3 w-3 text-red-400" />
            <span className="text-[9px] uppercase tracking-widest text-text-muted">Spread Impact</span>
          </div>
          <p className="text-xl font-bold tabular-nums text-red-400">+312%</p>
          <p className="text-[9px] text-text-muted mt-0.5">Above 75th percentile</p>
        </div>
      </FloatingCard>

      {/* Floating: AI Active */}
      <FloatingCard
        delay={1.3}
        floatY={5}
        floatDuration={5}
        className="absolute -right-4 bottom-16 hidden xl:block"
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: 'rgba(11,11,15,0.92)',
            border: '1px solid rgba(212,175,55,0.15)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'rgba(212,175,55,0.1)' }}>
            <Zap className="h-3 w-3 text-gold" />
          </div>
          <div>
            <p className="text-[9px] text-text-muted">AI Engine</p>
            <p className="text-[11px] font-semibold text-gold">Active</p>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </FloatingCard>

      {/* Ambient glow under card */}
      <div
        className="absolute bottom-0 left-1/2 h-32 w-64 -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
    </div>
  )
}
