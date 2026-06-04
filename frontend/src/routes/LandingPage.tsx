import { LandingBackground } from '@/components/landing/LandingBackground'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingHero } from '@/components/landing/LandingHero'
import { HeroVisualSection } from '@/components/landing/HeroVisualSection'
import { LandingNavbar } from '@/components/landing/LandingNavbar'
import { BehavioralSection } from '@/components/landing/sections/BehavioralSection'
import { FinalCTA } from '@/components/landing/sections/FinalCTA'
import { ForensicsSection } from '@/components/landing/sections/ForensicsSection'
import { InterventionSection } from '@/components/landing/sections/InterventionSection'
import { MetricsSection } from '@/components/landing/sections/MetricsSection'
import { ProblemSection } from '@/components/landing/sections/ProblemSection'
import { ReplaySection } from '@/components/landing/sections/ReplaySection'

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg-deep">
      <LandingBackground />
      <LandingNavbar />

      <main className="relative z-10">
        <LandingHero />
        <HeroVisualSection />
        <ProblemSection />
        <BehavioralSection />
        <ForensicsSection />
        <InterventionSection />
        <ReplaySection />
        <MetricsSection />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  )
}
