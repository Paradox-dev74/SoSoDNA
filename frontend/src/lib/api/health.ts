import { api } from '@/lib/api/client'

export interface IntegrationHealth {
  status: string
  service: string
  app_env: string
  demo_mode: boolean
  integrations: {
    database: boolean
    redis: boolean
    sosovalue_api_key_configured: boolean
    sodex_reachable: boolean
    openai_configured: boolean
    chain_id: number
    sodex_env: string
  }
}

export async function getIntegrationHealth(): Promise<IntegrationHealth> {
  try {
    return await api.get('/api/v1/health/integrations')
  } catch {
    return api.get('/health')
  }
}
