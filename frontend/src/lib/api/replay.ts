import { api } from '@/lib/api/client'

export interface ReplayFrame {
  timestamp: string
  price: string
  spread_bps: string
  depth_payload: Record<string, number> | null
  regime_payload: Record<string, unknown> | null
  ai_annotation: { text: string; severity: string } | null
}

export interface ReplaySession {
  id: string
  trade_id: string
  start_at: string
  end_at: string
  timeline_resolution_ms: number
  summary: Record<string, unknown> | null
  frames: ReplayFrame[]
}

export async function createReplay(tradeId: string): Promise<ReplaySession> {
  return api.post(`/api/v1/replay/trades/${tradeId}`)
}
