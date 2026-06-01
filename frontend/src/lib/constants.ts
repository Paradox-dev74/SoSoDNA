export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 138565)
export const API_URL = import.meta.env.VITE_API_URL || ''
export const WS_URL = import.meta.env.VITE_WS_URL || ''
export const VALUECHAIN_RPC_URL =
  import.meta.env.VITE_VALUECHAIN_RPC_URL || 'https://testnet-rpc.valuechain.xyz'
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''
export const DEFAULT_MARKET_SYMBOL = 'BTC-USD'
export const DEFAULT_SOSO_SYMBOL = 'BTC'

export const COLORS = {
  gold: '#D4AF37',
  blue: '#3B82F6',
  emerald: '#34D399',
  red: '#F87171',
  muted: '#71717A',
}
