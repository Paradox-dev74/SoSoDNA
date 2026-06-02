import { api } from '@/lib/api/client'

export interface SoSoValueEvent {
  id: string
  event_type: string
  source_id: string
  published_at: string
  symbols: string[] | null
  sentiment_score: number | null
  importance_score: number | null
  title: string | null
  summary: string | null
  payload: Record<string, unknown> | null
}

export interface MarketContext {
  symbol: string
  pair_market: Record<string, unknown> | null
  recent_news: SoSoValueEvent[]
  macro_events: SoSoValueEvent[]
  current_regime: string
  regime_confidence: number
}

export async function getSoSoValueEvents(eventType?: string): Promise<SoSoValueEvent[]> {
  const query = eventType ? `?event_type=${eventType}` : ''
  return api.get(`/api/v1/sosovalue/events${query}`)
}

export async function getMarketContext(symbol = 'BTC'): Promise<MarketContext> {
  return api.get(`/api/v1/sosovalue/context?symbol=${symbol}`)
}
