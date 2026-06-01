import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { getMe, refreshAuth } from '@/lib/api/auth'
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
  const { setUser, setAuthenticated } = useAppStore()

  useEffect(() => {
    async function bootstrap() {
      const token = api.getToken() || (await refreshAuth())?.access_token
      if (!token) return

      try {
        const user = await getMe()
        setUser(user)
        setAuthenticated(true)
      } catch {
        api.setToken(null)
        setAuthenticated(false)
      }
    }
    bootstrap()
  }, [setUser, setAuthenticated])

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
