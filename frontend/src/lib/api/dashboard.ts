import { api } from '@/lib/api/client'

export interface MetricTile {
  label: string
  value: string
  delta?: string
  trend?: string
}

export interface DashboardSummary {
  data_status: 'no_trades' | 'live_analysis'
  trade_count: number
  net_pnl_usd: number
  behavioral_risk_score: number
  liquidity_stress_index: number
  execution_precision_score: number
  current_regime: string
  metrics: MetricTile[]
  recent_insight_titles: string[]
  message?: string | null
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get('/api/v1/dashboard/summary')
}
