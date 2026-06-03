import { useQuery } from '@tanstack/react-query'
import { Activity, Loader2, Newspaper, TrendingUp } from 'lucide-react'
import { MetricTile } from '@/components/ui/metric-tile'
import { getMarketRegimes } from '@/lib/api/market'
import { getMarketContext, getSoSoValueEvents } from '@/lib/api/sosovalue'
import { formatPercent } from '@/lib/utils'

export function MarketRegimePage() {
  const { data: context, isLoading: contextLoading, error: contextError } = useQuery({
    queryKey: ['market-context'],
    queryFn: () => getMarketContext('BTC'),
  })
  const { data: regimes, isLoading: regimesLoading } = useQuery({
    queryKey: ['market-regimes'],
    queryFn: () => getMarketRegimes('BTC-USD'),
  })
  const { data: macroEvents } = useQuery({
    queryKey: ['sosovalue-macro'],
    queryFn: () => getSoSoValueEvents('macro'),
  })

  if (contextLoading || regimesLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading live regime and SoSoValue context...
      </div>
    )
  }

  if (contextError) {
    return (
      <div className="panel rounded-xl p-6 text-sm text-red-300">
        Failed to load market context. Ensure SOSOVALUE_API_KEY is configured and you have synced data.
      </div>
    )
  }

  const regimeList = regimes?.length ? regimes : []
  const newsItems = context?.recent_news?.length ? context.recent_news : []
  const macroItems = macroEvents?.length ? macroEvents : context?.macro_events ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Market Regime Panel</h1>
        <p className="text-sm text-text-muted">Live liquidity regimes derived from SoDEX snapshots and SoSoValue context</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Current Regime" value={context?.current_regime?.replace(/_/g, ' ') ?? '—'} />
        <MetricTile label="Regime Confidence" value={formatPercent(context?.regime_confidence ?? 0)} />
        <MetricTile
          label="SoSoValue Context"
          value={macroItems.length ? `${macroItems.length} macro events` : 'No macro events'}
        />
      </div>

      {regimeList.length === 0 ? (
        <div className="panel rounded-xl p-6 text-sm text-text-muted">
          No regime history yet. Connect your wallet, sync SoDEX data, and ensure orderbook snapshots are available.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {regimeList.map((regime) => (
            <div key={regime.id} className="panel rounded-xl p-6 panel-hover">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-blue" />
                <div>
                  <h3 className="font-semibold text-text-primary">{regime.regime_type.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-text-muted">
                    {new Date(regime.start_at).toLocaleString()}
                    {regime.end_at ? ` → ${new Date(regime.end_at).toLocaleString()}` : ' → ongoing'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-text-muted">Confidence</p>
                <p className="text-lg font-semibold tabular-nums text-text-primary">{formatPercent(regime.confidence)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel rounded-xl p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Newspaper className="h-4 w-4 text-gold" /> SoSoValue Live Context
        </h3>
        {newsItems.length === 0 && macroItems.length === 0 ? (
          <p className="text-sm text-text-muted">No SoSoValue events synced yet. Check API key and run sync.</p>
        ) : (
          <div className="space-y-3">
            {[...macroItems, ...newsItems].slice(0, 8).map((event) => (
              <div key={event.id} className="flex items-start gap-2 rounded-lg bg-bg-elevated px-4 py-3 text-sm">
                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue" />
                <div className="flex-1">
                  <p className="text-text-primary">{event.title || event.summary || 'SoSoValue event'}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {event.event_type} · {new Date(event.published_at).toLocaleString()}
                    {event.importance_score != null && ` · impact ${Math.round(event.importance_score * 100)}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
