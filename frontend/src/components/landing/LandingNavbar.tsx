import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { MagneticButton } from '@/components/motion/MagneticButton'

const navLinks = [
  { label: 'Product', href: '#intelligence' },
  { label: 'Features', href: '#forensics' },
  { label: 'Intelligence', href: '#replay' },
  { label: 'Metrics', href: '#metrics' },
]

export function LandingNavbar() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 48))

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 z-50 w-full"
    >
      <div
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-10"
        style={{
          background: scrolled ? 'rgba(5,5,7,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Logo */}
        <button onClick={() => navigate('/')} className="shrink-0">
          <Logo size="sm" />
        </button>

        {/* Center nav — Dovetail floating pill */}
        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full px-1.5 py-1.5 md:flex"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-text-muted transition-all duration-200 hover:bg-white/[0.06] hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={() => navigate('/connect')}
            className="text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            Log in
          </button>
          <MagneticButton onClick={() => navigate('/connect')}>
            <div
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-bg-deep transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
              style={{ background: 'linear-gradient(135deg, #f5d76e 0%, #d4af37 50%, #c49a22 100%)' }}
            >
              Connect Wallet
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </MagneticButton>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted md:hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={mobileOpen ? { opacity: 1, y: 0, pointerEvents: 'auto' } : { opacity: 0, y: -8, pointerEvents: 'none' }}
        transition={{ duration: 0.2 }}
        className="mx-4 overflow-hidden rounded-2xl md:hidden"
        style={{
          background: 'rgba(11,11,15,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex flex-col gap-1 p-3">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-text-muted hover:bg-white/[0.04] hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 border-t border-white/[0.06] pt-3">
            <button
              onClick={() => navigate('/connect')}
              className="w-full rounded-xl py-3 text-sm font-semibold text-bg-deep"
              style={{ background: 'linear-gradient(135deg, #d4af37 0%, #f0c842 100%)' }}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </motion.div>
    </motion.header>
  )
}
