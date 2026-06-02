import { API_URL } from '@/lib/constants'

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) localStorage.setItem('access_token', token)
    else localStorage.removeItem('access_token')
  }

  getToken(): string | null {
    if (!this.token) this.token = localStorage.getItem('access_token')
    return this.token
  }

  private parseErrorDetail(error: unknown): string {
    if (!error || typeof error !== 'object') return 'Request failed'
    const detail = (error as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
      return String((detail[0] as { msg: string }).msg)
    }
    return 'Request failed'
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    const token = this.getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(`${API_URL}${path}`, { ...options, headers })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(this.parseErrorDetail(error))
    }
    return response.json()
  }

  get<T>(path: string) {
    return this.request<T>(path)
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
  }
}

export const api = new ApiClient()
