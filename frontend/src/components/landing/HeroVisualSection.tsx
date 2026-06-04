import { motion } from 'framer-motion'
import { HeroDashboardPreview } from '@/components/landing/HeroDashboardPreview'

export function HeroVisualSection() {
  return (
    <section className="relative -mt-8 px-6 pb-24 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{ background: 'linear-gradient(to bottom, #050507, transparent)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto max-w-3xl"
      >
        <HeroDashboardPreview />
      </motion.div>
    </section>
  )
}
