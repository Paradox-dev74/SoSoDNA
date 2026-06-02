import { api } from '@/lib/api/client'

export interface DnaMetric {
  key: string
  label: string
  value: number
  trend?: number | null
  description: string
}

export interface TraderDnaProfile {
  data_status: 'no_trades' | 'live_analysis'
  trade_count: number
  archetype: string
  risk_personality: string
  strengths: string[]
  weaknesses: string[]
  hidden_pnl_leaks: string[]
  metrics: DnaMetric[]
  behavioral_fingerprint: Record<string, number>
  message?: string | null
}

export async function getDnaProfile(): Promise<TraderDnaProfile> {
  return api.get('/api/v1/dna/profile')
}
