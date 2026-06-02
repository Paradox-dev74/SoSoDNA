import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { CHAIN_ID, VALUECHAIN_RPC_URL, WALLETCONNECT_PROJECT_ID } from '@/lib/constants'

export const valueChain = {
  id: CHAIN_ID,
  name: 'ValueChain Testnet',
  nativeCurrency: { name: 'VBC', symbol: 'VBC', decimals: 18 },
  rpcUrls: {
    default: { http: [VALUECHAIN_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'SoSoValue Explorer', url: 'https://explorer-testnet.sosovalue.com' },
  },
} as const

const connectors = [
  injected({ target: 'metaMask' }),
  injected(),
]

if (WALLETCONNECT_PROJECT_ID) {
  connectors.push(walletConnect({ projectId: WALLETCONNECT_PROJECT_ID, showQrModal: true }))
}

export const wagmiConfig = createConfig({
  chains: [valueChain],
  connectors,
  transports: {
    [valueChain.id]: http(VALUECHAIN_RPC_URL),
  },
})
