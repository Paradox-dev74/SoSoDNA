import { api } from '@/lib/api/client'

export interface Trade {
  id: string
  external_trade_id: string
  symbol: string
  market_type: string
  side: string
  order_type: string
  quantity: string
  price: string
  notional_usd: string
  fee_usd: string
  realized_pnl_usd: string | null
  executed_at: string
}

export async function getTrades(): Promise<Trade[]> {
  return api.get('/api/v1/trades')
}

export async function getTrade(tradeId: string): Promise<Trade> {
  return api.get(`/api/v1/trades/${tradeId}`)
}
