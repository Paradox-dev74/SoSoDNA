import { API_URL, WS_URL } from '@/lib/constants'
import { api } from '@/lib/api/client'

type MessageHandler = (data: Record<string, unknown>) => void

function resolveWsBase(): string {
  if (WS_URL) return WS_URL.replace(/\/$/, '')
  if (API_URL) return API_URL.replace(/^http/, 'ws').replace(/\/$/, '')
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: Map<string, MessageHandler[]> = new Map()

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const token = api.getToken()
    if (!token) return

    const base = resolveWsBase()
    const url = `${base}/ws/user/${userId}?token=${encodeURIComponent(token)}`
    this.ws = new WebSocket(url)

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>
        const type = data.type as string
        const handlers = this.handlers.get(type) || []
        handlers.forEach((h) => h(data))
        const allHandlers = this.handlers.get('*') || []
        allHandlers.forEach((h) => h(data))
      } catch {
        // ignore parse errors
      }
    }

    this.ws.onclose = () => {
      setTimeout(() => this.connect(userId), 3000)
    }
  }

  on(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) || []
    this.handlers.set(type, [...existing, handler])
  }

  off(type: string, handler: MessageHandler) {
    const existing = this.handlers.get(type) || []
    this.handlers.set(type, existing.filter((h) => h !== handler))
  }

  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  requestAiGeneration(payload: Record<string, unknown> = {}) {
    this.send({ type: 'ai.generate', payload })
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }
}

export const wsClient = new WebSocketClient()
