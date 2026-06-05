import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { getIntegrationHealth } from '@/lib/api/health'
import { useAppStore } from '@/stores/app-store'

export function IntegrationBanner() {
  const lastSyncSummary = useAppStore((s) => s.lastSyncSummary)
  const { data: health } = useQuery({
    queryKey: ['integration-health'],
    queryFn: getIntegrationHealth,
    staleTime: 60_000,
  })

  if (!health) return null

  const missingKey = !health.integrations.sosovalue_api_key_configured
  const sodexDown = !health.integrations.sodex_reachable
  const zeroTrades = lastSyncSummary?.accountFound && lastSyncSummary.totalTrades === 0

  return (
    <div className="space-y-2 px-4 pt-3">
      {sodexDown && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          SoDEX testnet API is unreachable. Sync and heatmaps may fail until connectivity is restored.
        </div>
      )}
      {missingKey && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          SOSOVALUE_API_KEY is not configured. Macro/news context will be unavailable.
        </div>
      )}
      {zeroTrades && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          SoDEX account found but no trades imported. Place testnet trades and re-sync for personal analysis.
        </div>
      )}
    </div>
  )
}
