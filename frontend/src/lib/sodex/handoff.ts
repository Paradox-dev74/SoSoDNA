export const SODEX_TESTNET_URL = 'https://testnet.sodex.com'

export const RISK_BLOCK_THRESHOLD = 0.75

export interface ExecutionHandoff {
  symbol: string
  side: 'long' | 'short'
  sizeUsd: number
}

export function buildSodexTradeUrl({ symbol, side }: Pick<ExecutionHandoff, 'symbol' | 'side'>): string {
  const params = new URLSearchParams({
    symbol,
    side: side === 'long' ? 'buy' : 'sell',
  })
  return `${SODEX_TESTNET_URL}/trade?${params.toString()}`
}

export function formatHandoffInstructions({ symbol, side, sizeUsd }: ExecutionHandoff): string {
  const direction = side === 'long' ? 'Long (Buy)' : 'Short (Sell)'
  return `On SoDEX testnet: connect the same wallet, open ${symbol}, place a ${direction} market order around $${sizeUsd.toLocaleString()} notional.`
}
