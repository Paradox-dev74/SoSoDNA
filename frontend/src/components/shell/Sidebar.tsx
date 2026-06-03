import { motion } from 'framer-motion'
import {
  Activity,
  BarChart3,
  Brain,
  Dna,
  LayoutDashboard,
  Play,
  Settings,
  Shield,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/dna', icon: Dna, label: 'Trading DNA' },
  { to: '/app/insights', icon: Brain, label: 'AI Insights' },
  { to: '/app/heatmaps', icon: BarChart3, label: 'Heatmaps' },
  { to: '/app/risk', icon: Shield, label: 'Risk Engine' },
  { to: '/app/regimes', icon: Activity, label: 'Regimes' },
  { to: '/app/execute', icon: Zap, label: 'Execute' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const syncStatus = useAppStore((s) => s.syncStatus)
  const lastSyncSummary = useAppStore((s) => s.lastSyncSummary)

  const footerLabel =
    syncStatus === 'synced' && lastSyncSummary
      ? lastSyncSummary.tradesImported > 0
        ? `Live · ${lastSyncSummary.tradesImported} trades`
        : 'Account found · 0 trades'
      : syncStatus === 'synced'
        ? 'Live Testnet'
        : 'Connect & Sync'

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      className="relative z-10 flex flex-col border-r border-white/8 bg-bg-surface/80 backdrop-blur-xl"
    >
      <div className="flex h-14 items-center gap-2 overflow-hidden border-b border-white/8 px-4">
        <Logo size="sm" showText={!collapsed} />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-white/5 hover:text-text-primary',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg border border-gold/20"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="relative h-4 w-4 shrink-0" />
                {!collapsed && <span className="relative">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="border-t border-white/8 p-3">
          <div className="flex items-center gap-2 rounded-lg bg-blue/5 px-3 py-2">
            <Play className="h-3 w-3 text-blue" />
            <span className="text-[10px] text-blue">{footerLabel}</span>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
