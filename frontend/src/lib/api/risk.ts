import { api } from '@/lib/api/client'

export interface RiskContributor {
  factor: string
  impact: number
  description: string
}

export interface PreTradeRiskResponse {
  similarity_to_losing_setups: number
  severity: string
  title: string
  summary: string
  contributors: RiskContributor[]
  recommended_action: string
  confidence: number
}

export async function evaluatePreTradeRisk(symbol = 'BTC-USD', side = 'long', size_usd = 5000): Promise<PreTradeRiskResponse> {
  return api.post('/api/v1/risk/pretrade', { symbol, side, size_usd })
}
