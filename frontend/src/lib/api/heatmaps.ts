import { api } from '@/lib/api/client'

export interface HeatmapPoint {
  price: number
  bid_depth: number
  ask_depth: number
  sweep_risk: number
  timestamp: string
}

export interface LiquidityHeatmap {
  symbol: string
  points: HeatmapPoint[]
  spread_centerline: { timestamp: string; spread_bps: number }[]
  sweep_zones: { price: number; risk: number }[]
  regime_overlays: { regime: string; start: string | null }[]
}

export interface SyncResult {
  status: string
  account_id?: number | null
  account_state_found?: boolean
  trades_imported?: number
  snapshots_imported?: number
  sosovalue_events_synced?: number
  regimes_updated?: number
  spot_balance?: unknown
  perps_positions?: unknown
  warnings?: string[]
  message?: string
  error?: string
}

export async function getLiquidityHeatmap(symbol = 'BTC-USD'): Promise<LiquidityHeatmap> {
  return api.get(`/api/v1/heatmaps/liquidity?symbol=${symbol}`)
}

export async function syncSodexData(): Promise<SyncResult> {
  return api.post('/api/v1/sodex/sync')
}
