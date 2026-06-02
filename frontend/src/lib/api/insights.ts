import { api } from '@/lib/api/client'

export interface AIInsight {
  id: string
  insight_type: string
  severity: string
  title: string
  summary: string
  evidence: Record<string, unknown> | null
  recommendations: Record<string, unknown> | null
  confidence: string
  trade_id: string | null
  created_at: string
}

export async function getInsights(): Promise<AIInsight[]> {
  return api.get('/api/v1/insights')
}
