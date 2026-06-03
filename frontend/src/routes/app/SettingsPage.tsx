import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { useWalletAuth } from '@/features/wallet/useWalletAuth'
import { Button } from '@/components/ui/button'
import { getIntegrationHealth } from '@/lib/api/health'
import { syncSodexData } from '@/lib/api/heatmaps'
import { formatSyncLabel, formatSyncMessage, parseSyncResult } from '@/lib/sync-status'
import { cn } from '@/lib/utils'

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
      )}
      <div>
        <p className={cn('text-sm', ok ? 'text-text-primary' : 'text-red-300')}>{label}</p>
        {detail && <p className="text-xs text-text-muted">{detail}</p>}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { user, syncStatus, syncMessage, lastSyncSummary, setSyncStatus, setLastSyncSummary } = useAppStore()
  const { logout } = useWalletAuth()

  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['integration-health'],
    queryFn: getIntegrationHealth,
    refetchInterval: 30_000,
  })

  const resync = useMutation({
    mutationFn: syncSodexData,
    onMutate: () => setSyncStatus('syncing', 'Manual sync in progress...'),
    onSuccess: (result) => {
      const summary = parseSyncResult(result)
      setLastSyncSummary(summary)
      setSyncStatus('synced', formatSyncMessage(summary))
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['trades'] })
      queryClient.invalidateQueries({ queryKey: ['dna'] })
      queryClient.invalidateQueries({ queryKey: ['market-context'] })
      refetchHealth()
    },
    onError: (err: Error) => setSyncStatus('error', err.message),
  })

  const sodexOk = health?.integrations.sodex_reachable ?? false
  const sosoOk = health?.integrations.sosovalue_api_key_configured ?? false
  const dbOk = health?.integrations.database ?? false
  const liveMode = health ? !health.demo_mode : true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Account, integrations, and sync status</p>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-primary">Wallet</h3>
        <p className="mt-2 font-mono text-sm text-text-muted">{user?.primary_wallet_address}</p>
        <Button variant="danger" className="mt-4" onClick={logout}>
          Disconnect Wallet
        </Button>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-primary">Live Integrations</h3>

        {healthLoading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking backend integrations...
          </div>
        )}

        {healthError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p>Cannot reach backend health endpoint.</p>
              <p className="mt-1 text-xs">Ensure backend is running: uvicorn app.main:app --reload --port 8000</p>
            </div>
          </div>
        )}

        {health && (
          <div className="mt-4 space-y-3">
            <StatusRow ok={dbOk} label="Database" detail={dbOk ? 'Connected' : 'Database unavailable'} />
            <StatusRow
              ok={sodexOk}
              label="SoDEX testnet API"
              detail={sodexOk ? `Environment: ${health.integrations.sodex_env}` : 'Cannot reach testnet-gw.sodex.dev'}
            />
            <StatusRow
              ok={sosoOk}
              label="SoSoValue API key"
              detail={sosoOk ? 'Configured in backend/.env' : 'Set SOSOVALUE_API_KEY in backend/.env and restart backend'}
            />
            <StatusRow
              ok={liveMode}
              label="Live data mode"
              detail={liveMode ? 'Demo paths disabled — live SoDEX data only' : 'Demo mode flag detected in backend'}
            />
            <p className="text-xs text-text-muted">
              App env: {health.app_env} · Chain ID: {health.integrations.chain_id}
            </p>
            <p className="text-xs text-text-muted">
              Sync: {syncStatus === 'synced' && lastSyncSummary ? formatSyncLabel(lastSyncSummary) : syncStatus}
              {syncMessage ? ` — ${syncMessage}` : ''}
            </p>
            {lastSyncSummary && (
              <p className="text-xs text-text-muted">
                Imported: {lastSyncSummary.tradesImported} trades · {lastSyncSummary.snapshotsImported} snapshots ·{' '}
                {lastSyncSummary.sosovalueEvents} SoSoValue events
              </p>
            )}
          </div>
        )}

        <Button variant="secondary" className="mt-4" onClick={() => resync.mutate()} disabled={resync.isPending}>
          {resync.isPending ? 'Syncing...' : 'Re-sync SoDEX + SoSoValue'}
        </Button>

        {lastSyncSummary?.accountFound && lastSyncSummary.tradesImported === 0 && (
          <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100">
            <p className="font-medium">Account found, 0 trades imported.</p>
            <p className="mt-1">
              Place 2–3 test trades on testnet.sodex.com with this same wallet, then click Re-sync.
              Heatmaps and SoSoValue context still work; dashboard/replay/DNA need trade history.
            </p>
          </div>
        )}
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-primary">Privacy</h3>
        <p className="mt-2 text-sm text-text-muted">
          No master private keys stored. Wallet signatures used for authentication only.
          Trading data synced from SoDEX testnet for behavioral analysis.
        </p>
      </div>
    </div>
  )
}
