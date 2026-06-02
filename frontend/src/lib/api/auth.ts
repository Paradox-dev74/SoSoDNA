import { api } from '@/lib/api/client'
import { CHAIN_ID } from '@/lib/constants'

export interface AuthNonceResponse {
  nonce: string
  message: string
  expires_at: string
}

export interface UserResponse {
  id: string
  display_name: string | null
  primary_wallet_address: string
  created_at: string
}

export interface AuthVerifyResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: UserResponse
}

export async function getAuthNonce(address: string): Promise<AuthNonceResponse> {
  return api.post('/api/v1/auth/nonce', { address, chain_id: CHAIN_ID })
}

export async function verifyAuth(address: string, signature: string, nonce: string): Promise<AuthVerifyResponse> {
  const result = await api.post<AuthVerifyResponse>('/api/v1/auth/verify', {
    address,
    signature,
    nonce,
    chain_id: CHAIN_ID,
  })
  api.setToken(result.access_token)
  localStorage.setItem('refresh_token', result.refresh_token)
  return result
}

export async function refreshAuth(): Promise<AuthVerifyResponse | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null
  try {
    const result = await api.post<AuthVerifyResponse>('/api/v1/auth/refresh', { refresh_token: refreshToken })
    api.setToken(result.access_token)
    localStorage.setItem('refresh_token', result.refresh_token)
    return result
  } catch {
    api.setToken(null)
    localStorage.removeItem('refresh_token')
    return null
  }
}

export async function logoutAuth(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    await api.post('/api/v1/auth/logout', { refresh_token: refreshToken }).catch(() => null)
  }
  api.setToken(null)
  localStorage.removeItem('refresh_token')
}

export async function getMe(): Promise<UserResponse> {
  return api.get('/api/v1/auth/me')
}
