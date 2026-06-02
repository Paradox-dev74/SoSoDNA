import { useMutation } from '@tanstack/react-query'
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi'
import { getAuthNonce, logoutAuth, verifyAuth } from '@/lib/api/auth'
import { syncSodexData } from '@/lib/api/heatmaps'
import { CHAIN_ID } from '@/lib/constants'
import { formatSyncMessage, parseSyncResult } from '@/lib/sync-status'
import { valueChain } from '@/features/wallet/wallet-config'
import { useAppStore } from '@/stores/app-store'

export function useWalletAuth() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { switchChain } = useSwitchChain()
  const { setUser, setAuthenticated, setSyncStatus, setLastSyncSummary } = useAppStore()

  const authMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      if (chainId !== CHAIN_ID) {
        await switchChain({ chainId: CHAIN_ID })
      }
      const nonceRes = await getAuthNonce(walletAddress)
      const signature = await signMessageAsync({ message: nonceRes.message })
      const authRes = await verifyAuth(walletAddress, signature, nonceRes.nonce)
      setSyncStatus('syncing', 'Syncing SoDEX and SoSoValue data...')
      const syncResult = await syncSodexData()
      const summary = parseSyncResult(syncResult)
      setLastSyncSummary(summary)
      setSyncStatus('synced', formatSyncMessage(summary))
      return authRes
    },
    onSuccess: (data) => {
      setUser(data.user)
      setAuthenticated(true)
    },
    onError: (err: Error) => {
      setSyncStatus('error', err.message)
    },
  })

  const connectWallet = async (connectorId?: string) => {
    const connector = connectorId
      ? connectors.find((c) => c.id === connectorId || c.name === connectorId)
      : connectors[0]
    if (!connector) throw new Error('No wallet connector available')
    connect({ connector, chainId: CHAIN_ID })
  }

  const authenticate = async () => {
    if (!address) throw new Error('Wallet not connected')
    await authMutation.mutateAsync(address)
  }

  const switchToValueChain = async () => {
    await switchChain({ chainId: valueChain.id })
  }

  const logout = async () => {
    await logoutAuth()
    disconnect()
    setUser(null)
    setAuthenticated(false)
    setSyncStatus('idle')
    setLastSyncSummary(null)
  }

  const isWrongChain = isConnected && chainId !== CHAIN_ID

  return {
    address,
    isConnected,
    isConnecting,
    isAuthenticating: authMutation.isPending,
    isWrongChain,
    authError: authMutation.error as Error | null,
    connectWallet,
    authenticate,
    logout,
    switchToValueChain,
    connectors,
  }
}
