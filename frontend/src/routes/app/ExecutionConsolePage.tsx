import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Loader2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getExecutionMarkets, previewOrder, submitSignedOrder } from '@/lib/api/execution'
import { invalidateLiveDataQueries } from '@/lib/sync/invalidate'
import { formatPercent } from '@/lib/utils'
import {
  clearSodexCredentials,
  getSodexCredentials,
  signSodexPerpsOrder,
  storeSodexCredentials,
} from '@/lib/sodex/signing'

const SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD']

export function ExecutionConsolePage() {
  const queryClient = useQueryClient()
  const [confirmed, setConfirmed] = useState(false)
  const [symbol, setSymbol] = useState('BTC-USD')
  const [side, setSide] = useState<'long' | 'short'>('long')
  const [sizeUsd, setSizeUsd] = useState(50)
  const [apiKeyName, setApiKeyName] = useState(getSodexCredentials()?.apiKeyName ?? '')
  const [apiKeyPrivateKey, setApiKeyPrivateKey] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const { data: markets } = useQuery({
    queryKey: ['execution-markets', symbol],
    queryFn: () => getExecutionMarkets(symbol),
  })

  const preview = useMutation({
    mutationFn: () => previewOrder({ symbol, side, size_usd: sizeUsd, order_type: 'market' }),
    onMutate: () => {
      setConfirmed(false)
      setSubmitError(null)
      setSubmitSuccess(null)
    },
  })

  const submit = useMutation({
    mutationFn: async () => {
      const previewData = preview.data
      if (!previewData) throw new Error('Run risk preview before submitting.')
      if (!previewData.risk_allowed) throw new Error(previewData.risk_blocked_reason ?? 'Risk gate blocked order.')
      if (!confirmed) throw new Error('Confirm order details before submitting.')

      const creds = getSodexCredentials()
      if (!creds?.apiKeyName || !creds.apiKeyPrivateKey) {
        throw new Error('SoDEX API key credentials required for signed order submission.')
      }

      const apiSign = await signSodexPerpsOrder(creds.apiKeyPrivateKey as `0x${string}`, {
        signing_domain: previewData.signing_domain,
        signing_types: previewData.signing_types,
        signing_message: previewData.signing_message,
      })

      return submitSignedOrder({
        request_body: previewData.request_body,
        api_key_name: creds.apiKeyName,
        api_sign: apiSign,
        api_nonce: String(previewData.signing_nonce),
      })
    },
    onSuccess: async (result) => {
      if (result.success) {
        setSubmitSuccess(
          result.order_id
            ? `Order ${result.order_id} submitted on SoDEX testnet.`
            : `Order ${result.cl_ord_id ?? ''} submitted on SoDEX testnet.`,
        )
        await invalidateLiveDataQueries(queryClient)
      } else {
        setSubmitError(result.error ?? 'SoDEX rejected the order.')
      }
    },
    onError: (err: Error) => setSubmitError(err.message),
  })

  const saveCredentials = () => {
    if (!apiKeyName.trim() || !apiKeyPrivateKey.trim()) return
    const key = apiKeyPrivateKey.startsWith('0x') ? apiKeyPrivateKey : `0x${apiKeyPrivateKey}`
    storeSodexCredentials({ apiKeyName: apiKeyName.trim(), apiKeyPrivateKey: key })
    setApiKeyPrivateKey('')
  }

  const risk = preview.data?.risk
  const market = markets?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Execution Console</h1>
        <p className="text-sm text-text-muted">
          Live SoDEX testnet order submission — risk-gated with EIP-712 signed API requests
        </p>
      </div>

      <div className="panel rounded-xl border border-blue-400/20 bg-blue-400/5 p-6">
        <p className="text-sm text-blue-100">
          Orders are placed on SoDEX testnet via your SoDEX API key (not wallet custody). Credentials stay in this
          browser session only and are never stored on our backend.
        </p>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-text-primary">SoDEX API Key (session only)</h3>
        <p className="mt-1 text-xs text-text-muted">
          Create an API key on testnet.sodex.com. Enter the key name and signing private key below.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-text-muted">API Key Name</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              placeholder="api-key-01"
            />
          </label>
          <label className="text-sm">
            <span className="text-text-muted">API Key Private Key</span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={apiKeyPrivateKey}
              onChange={(e) => setApiKeyPrivateKey(e.target.value)}
              placeholder="0x..."
            />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={saveCredentials}>
            Save for Session
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSodexCredentials}>
            Clear
          </Button>
        </div>
      </div>

      <div className="panel rounded-xl p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
          <Zap className="h-5 w-5 text-gold" /> Order Builder
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-text-muted">Symbol</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-text-muted">Side</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={side}
              onChange={(e) => setSide(e.target.value as 'long' | 'short')}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-text-muted">Size (USD)</span>
            <input
              type="number"
              min={10}
              step={10}
              className="mt-1 w-full rounded-lg border border-white/10 bg-bg-elevated px-3 py-2"
              value={sizeUsd}
              onChange={(e) => setSizeUsd(Number(e.target.value))}
            />
          </label>
        </div>

        {market && (
          <p className="mt-3 text-xs text-text-muted">
            Live market: {market.symbol} · min notional ${market.min_notional}
            {market.mark_price ? ` · mark ${market.mark_price}` : ''}
          </p>
        )}

        <Button className="mt-4" onClick={() => preview.mutate()} disabled={preview.isPending}>
          {preview.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating risk...
            </>
          ) : (
            'Run Live Risk Preview'
          )}
        </Button>

        {preview.isError && (
          <p className="mt-3 text-sm text-red-300">{(preview.error as Error).message}</p>
        )}

        {risk && (
          <div className="mt-6 space-y-3 border-t border-white/8 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Risk Similarity</span>
              <span className={risk.similarity_to_losing_setups > 0.7 ? 'text-red-400' : 'text-emerald-400'}>
                {formatPercent(risk.similarity_to_losing_setups)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Severity</span>
              <span className="text-text-primary">{risk.severity}</span>
            </div>
            <p className="text-sm text-text-muted">{risk.summary}</p>

            {!preview.data?.risk_allowed && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{preview.data?.risk_blocked_reason}</p>
              </div>
            )}

            {preview.data?.risk_allowed && (
              <>
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  I confirm this live testnet order and understand it will execute on SoDEX.
                </label>
                <Button
                  className="w-full"
                  disabled={!confirmed || submit.isPending || !getSodexCredentials()}
                  onClick={() => submit.mutate()}
                >
                  {submit.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting to SoDEX...
                    </>
                  ) : (
                    'Submit Live Order'
                  )}
                </Button>
                {!getSodexCredentials() && (
                  <p className="text-xs text-amber-200">Save SoDEX API key credentials before submitting.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {submitSuccess && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{submitSuccess}</p>
        </div>
      )}
      {submitError && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{submitError}</div>
      )}
    </div>
  )
}
