import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { getMe, refreshAuth } from '@/lib/api/auth'
import { syncSodexData } from '@/lib/api/heatmaps'
import { formatSyncMessage, parseSyncResult } from '@/lib/sync-status'
import { api } from '@/lib/api/client'
import { wagmiConfig } from '@/features/wallet/wallet-config'
import { useAppStore } from '@/stores/app-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated, setSyncStatus, setLastSyncSummary } = useAppStore()

  useEffect(() => {
    async function bootstrap() {
      const token = api.getToken() || (await refreshAuth())?.access_token
      if (!token) return

      try {
        const user = await getMe()
        setUser(user)
        setAuthenticated(true)
        setSyncStatus('syncing', 'Restoring session — refreshing live data...')
        try {
          const result = await syncSodexData()
          const summary = parseSyncResult(result)
          setLastSyncSummary(summary)
          setSyncStatus(result.status === 'failed' ? 'error' : 'synced', formatSyncMessage(summary))
        } catch {
          setSyncStatus('idle', 'Session restored. Run sync to load latest SoDEX data.')
        }
      } catch {
        api.setToken(null)
        setAuthenticated(false)
      }
    }
    bootstrap()
  }, [setUser, setAuthenticated, setSyncStatus, setLastSyncSummary])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>{children}</SessionBootstrap>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
