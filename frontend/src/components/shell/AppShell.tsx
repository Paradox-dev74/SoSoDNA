import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatedBackground } from '@/components/motion/AnimatedBackground'
import { AiPanel } from '@/components/shell/AiPanel'
import { Sidebar } from '@/components/shell/Sidebar'
import { IntegrationBanner } from '@/components/shell/IntegrationBanner'
import { TopBar } from '@/components/shell/TopBar'
import { useAppStore } from '@/stores/app-store'

export function AppShell() {
  const location = useLocation()
  const aiPanelOpen = useAppStore((s) => s.aiPanelOpen)

  return (
    <div className="relative min-h-screen bg-bg-deep">
      <AnimatedBackground />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <TopBar />
          <IntegrationBanner />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
            <AnimatePresence>
              {aiPanelOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden overflow-hidden border-l border-white/8 xl:block"
                >
                  <AiPanel />
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
