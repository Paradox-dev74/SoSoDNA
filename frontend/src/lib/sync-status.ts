import type { SyncResult } from '@/lib/api/heatmaps'

export interface SyncSummary {
  accountFound: boolean
  accountId?: number | null
  tradesImported: number
  totalTrades: number
  snapshotsImported: number
  sosovalueEvents: number
  warnings: string[]
}

export function parseSyncResult(result: SyncResult): SyncSummary {
  return {
    accountFound: Boolean(result.account_state_found || result.account_id),
    accountId: result.account_id,
    tradesImported: result.trades_imported ?? 0,
    totalTrades: result.total_trades ?? result.trades_imported ?? 0,
    snapshotsImported: result.snapshots_imported ?? 0,
    sosovalueEvents: result.sosovalue_events_synced ?? 0,
    warnings: result.warnings ?? [],
  }
}

export function formatSyncLabel(summary: SyncSummary): string {
  if (!summary.accountFound) {
    return 'No SoDEX account found'
  }
  if (summary.totalTrades === 0) {
    return `Account found${summary.accountId ? ` #${summary.accountId}` : ''}, 0 trades`
  }
  return `Account synced · ${summary.totalTrades} trade${summary.totalTrades === 1 ? '' : 's'}`
}

export function formatSyncMessage(summary: SyncSummary): string {
  const parts = [
    summary.accountFound
      ? `Account${summary.accountId ? ` #${summary.accountId}` : ''} found`
      : 'No account found',
    `${summary.totalTrades} trades (${summary.tradesImported} new)`,
    `${summary.snapshotsImported} snapshots`,
    `${summary.sosovalueEvents} SoSoValue events`,
  ]
  const message = parts.join(' · ')
  if (summary.warnings.length) {
    return `${message}. ${summary.warnings[0]}`
  }
  return message
}
