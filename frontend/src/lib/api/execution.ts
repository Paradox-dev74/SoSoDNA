import { api } from '@/lib/api/client'
import type { PreTradeRiskResponse } from '@/lib/api/risk'

export interface ExecutionMarket {
  symbol: string
  symbol_id: number
  price_precision: number
  quantity_precision: number
  step_size: string
  min_notional: string
  mark_price: string | null
  status: string | null
}

export interface OrderPreview {
  account_id: number
  symbol: string
  symbol_id: number
  side: string
  size_usd: number
  order_type: string
  cl_ord_id: string
  request_body: Record<string, unknown>
  risk_allowed: boolean
  risk_blocked_reason: string | null
  risk: PreTradeRiskResponse | null
  signing_nonce: number
  signing_domain: Record<string, unknown>
  signing_types: Record<string, { name: string; type: string }[]>
  signing_message: Record<string, unknown>
}

export interface OrderSubmitResult {
  success: boolean
  cl_ord_id: string | null
  order_id: string | null
  sodex_response: Record<string, unknown> | null
  error: string | null
  sync_summary: Record<string, unknown> | null
}

export function getExecutionMarkets(symbol?: string) {
  const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : ''
  return api.get<ExecutionMarket[]>(`/api/v1/execution/markets${query}`)
}

export function previewOrder(params: {
  symbol: string
  side: 'long' | 'short'
  size_usd: number
  order_type?: string
}) {
  return api.post<OrderPreview>('/api/v1/execution/preview', {
    symbol: params.symbol,
    side: params.side,
    size_usd: params.size_usd,
    order_type: params.order_type ?? 'market',
    market_type: 'perps',
  })
}

export function submitSignedOrder(params: {
  request_body: Record<string, unknown>
  api_key_name: string
  api_sign: string
  api_nonce: string
}) {
  return api.post<OrderSubmitResult>('/api/v1/execution/submit', {
    ...params,
    market_type: 'perps',
  })
}
