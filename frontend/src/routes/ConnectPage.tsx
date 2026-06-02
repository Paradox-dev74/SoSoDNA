import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Shield, Wallet } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedBackground } from '@/components/motion/AnimatedBackground'
import { Button } from '@/components/ui/button'
import { useWalletAuth } from '@/features/wallet/useWalletAuth'
import { CHAIN_ID } from '@/lib/constants'
import { useAppStore } from '@/stores/app-store'

export function ConnectPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppStore()
  const {
    address,
    isConnected,
    isConnecting,
    isAuthenticating,
    isWrongChain,
    authError,
    connectWallet,
    authenticate,
    switchToValueChain,
    connectors,
  } = useWalletAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/app')
  }, [isAuthenticated, navigate])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-deep px-6">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel relative z-10 w-full max-w-md rounded-2xl p-8"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-4 flex justify-center"
          >
            <Logo size="xl" showText={false} />
          </motion.div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">SOSO DNA</p>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">Connect ValueChain Wallet</h1>
          <p className="mt-2 text-sm text-text-muted">
            Sign in with your SoDEX testnet wallet on chain {CHAIN_ID}. No custody. No private keys stored.
          </p>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.uid}
              variant="secondary"
              className="w-full justify-start gap-3"
              onClick={() => connectWallet(connector.id)}
              disabled={isConnecting || isAuthenticating}
            >
              <Wallet className="h-4 w-4" />
              {connector.name}
              <ArrowRight className="ml-auto h-4 w-4" />
            </Button>
          ))}

          {isConnected && isWrongChain && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Wrong network. Switch to ValueChain Testnet ({CHAIN_ID}).
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={switchToValueChain}>
                Switch Network
              </Button>
            </div>
          )}

          {isConnected && address && !isWrongChain && (
            <Button className="w-full" onClick={() => authenticate()} disabled={isAuthenticating}>
              {isAuthenticating ? 'Signing & syncing...' : `Sign to Authenticate (${address.slice(0, 6)}...)`}
            </Button>
          )}

          {authError && (
            <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-300">
              {authError.message}
            </p>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-white/8 bg-bg-elevated/40 p-3 text-xs text-text-muted">
          <p className="font-medium text-text-primary">MetaMask network (if add-network fails)</p>
          <p className="mt-1">RPC: https://testnet-rpc.valuechain.xyz</p>
          <p>Chain ID: 138565 · Symbol: VBC</p>
          <p className="mt-1 text-amber-200/90">Include https:// in the RPC URL. Do not use testnet-rpc.sodex.dev.</p>
        </div>

        <div className="space-y-2 rounded-xl bg-bg-elevated/50 p-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Imports SoDEX testnet trades and orderbook snapshots
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Pulls SoSoValue macro/news context via backend API key
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            Wallet signature required — live data only
          </div>
        </div>
      </motion.div>
    </div>
  )
}
