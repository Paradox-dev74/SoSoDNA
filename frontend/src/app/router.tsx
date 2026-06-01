import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { AuthGuard } from '@/components/shell/AuthGuard'
import { ConnectPage } from '@/routes/ConnectPage'
import { LandingPage } from '@/routes/LandingPage'
import { DashboardPage } from '@/routes/app/DashboardPage'
import { TraderDnaPage } from '@/routes/app/TraderDnaPage'
import { AiInsightsPage } from '@/routes/app/AiInsightsPage'
import { TradeReplayPage } from '@/routes/app/TradeReplayPage'
import { LiquidityHeatmapsPage } from '@/routes/app/LiquidityHeatmapsPage'
import { RiskEnginePage } from '@/routes/app/RiskEnginePage'
import { MarketRegimePage } from '@/routes/app/MarketRegimePage'
import { ExecutionConsolePage } from '@/routes/app/ExecutionConsolePage'
import { SettingsPage } from '@/routes/app/SettingsPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/connect', element: <ConnectPage /> },
  {
    path: '/app',
    element: <AuthGuard><AppShell /></AuthGuard>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dna', element: <TraderDnaPage /> },
      { path: 'insights', element: <AiInsightsPage /> },
      { path: 'replay/:tradeId', element: <TradeReplayPage /> },
      { path: 'heatmaps', element: <LiquidityHeatmapsPage /> },
      { path: 'risk', element: <RiskEnginePage /> },
      { path: 'regimes', element: <MarketRegimePage /> },
      { path: 'execute', element: <ExecutionConsolePage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
