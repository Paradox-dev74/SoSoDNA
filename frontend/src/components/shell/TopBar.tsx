import { Bell, Command, PanelRight, RefreshCw, Search } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { syncSodexData } from '@/lib/api/heatmaps'
import { formatSyncLabel, formatSyncMessage, parseSyncResult } from '@/lib/sync-status'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

export function TopBar() {
  const { user, toggleSidebar, toggleAiPanel, syncStatus, syncMessage, lastSyncSummary, setSyncStatus, setLastSyncSummary } =
    useAppStore()

  const resync = useMutation({
    mutationFn: syncSodexData,
    onMutate: () => setSyncStatus('syncing', 'Refreshing SoDEX and SoSoValue data...'),
    onSuccess: (result) => {
      const summary = parseSyncResult(result)
      setLastSyncSummary(summary)
      setSyncStatus('synced', formatSyncMessage(summary))
    },
    onError: (err: Error) => setSyncStatus('error', err.message),
  })

  const statusLabel =
    syncStatus === 'syncing'
      ? 'Syncing...'
      : syncStatus === 'synced'
        ? lastSyncSummary
          ? formatSyncLabel(lastSyncSummary)
          : 'Synced'
        : syncStatus === 'error'
          ? 'Sync Error'
          : 'Not Synced'

  const statusColor =
    syncStatus === 'synced'
      ? lastSyncSummary && !lastSyncSummary.accountFound
        ? 'bg-amber-400'
        : lastSyncSummary && lastSyncSummary.tradesImported === 0
          ? 'bg-amber-400'
          : 'bg-emerald-400'
      : syncStatus === 'syncing'
        ? 'bg-gold animate-pulse'
        : syncStatus === 'error'
          ? 'bg-red-400'
          : 'bg-white/30'

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/8 bg-bg-surface/60 px-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Command className="h-4 w-4" />
        </Button>
        <button className="flex items-center gap-2 rounded-lg border border-white/8 bg-bg-elevated/50 px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-white/15">
          <Search className="h-3.5 w-3.5" />
          <span>Search trades, insights...</span>
          <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-white/8 px-3 py-1.5 md:flex" title={syncMessage ?? undefined}>
          <div className={cn('h-2 w-2 rounded-full', statusColor)} />
          <span className="text-xs text-text-muted">{statusLabel}</span>
          {user && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => resync.mutate()} disabled={resync.isPending}>
              <RefreshCw className={cn('h-3 w-3', resync.isPending && 'animate-spin')} />
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleAiPanel}>
          <PanelRight className="h-4 w-4" />
        </Button>
        {user && (
          <div className="flex items-center gap-2 rounded-lg border border-white/8 px-3 py-1.5">
            <div className="h-6 w-6 rounded-full bg-gold/20" />
            <span className="text-xs text-text-muted">
              {user.primary_wallet_address.slice(0, 6)}...{user.primary_wallet_address.slice(-4)}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
