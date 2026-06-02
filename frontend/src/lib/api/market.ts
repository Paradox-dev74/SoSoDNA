import { api } from '@/lib/api/client'

export interface MarketRegime {
  id: string
  symbol: string
  start_at: string
  end_at: string | null
  regime_type: string
  confidence: number
  features: Record<string, unknown> | null
}

export async function getMarketRegimes(symbol = 'BTC-USD'): Promise<MarketRegime[]> {
  return api.get(`/api/v1/market/regimes?symbol=${symbol}`)
}
