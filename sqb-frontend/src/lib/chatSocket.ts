import { Client, type IMessage } from '@stomp/stompjs'
import { useAuthStore } from '@/store/auth'

// Theo spec docs/websocket-stomp.txt + api-summary:
//  - Handshake: ws(s)://<host>/api/v1/ws, header CONNECT: Authorization Bearer <jwt>
//  - Publish: /app/chat.send | /app/chat.read | /app/chat.typing
//  - Subscribe: /user/queue/messages (tin 1-1 + read receipt), /topic/conversations.{id} (typing, nhóm)

export interface ChatSocketHandlers {
  onMessage?: (payload: unknown, raw: IMessage) => void
  onTyping?: (payload: unknown, raw: IMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (err: unknown) => void
}

function wsUrl(): string {
  // VITE_WS_URL: deploy tĩnh (Vercel/CF Pages) set thẳng wss://backend — serverless không proxy WS
  const explicit: string | undefined = import.meta.env.VITE_WS_URL
  if (explicit) return explicit
  const base: string = import.meta.env.VITE_API_BASE || '/api/v1'
  if (base.startsWith('http')) return `${base.replace(/^http/, 'ws')}/ws`
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}${base}/ws`
}

function unwrap(body: string): unknown {
  try {
    const parsed = JSON.parse(body)
    // Backend có thể bọc envelope {code,message,data} hoặc gửi raw DTO
    return parsed && typeof parsed === 'object' && 'data' in parsed && 'code' in parsed ? parsed.data : parsed
  } catch {
    return body
  }
}

export function createChatClient(handlers: ChatSocketHandlers, conversationId?: number | string): Client {
  const token = useAuthStore.getState().accessToken ?? ''
  const client = new Client({
    brokerURL: wsUrl(),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  })

  client.onConnect = () => {
    client.subscribe('/user/queue/messages', (msg) => handlers.onMessage?.(unwrap(msg.body), msg))
    if (conversationId) {
      client.subscribe(`/topic/conversations.${conversationId}`, (msg) => handlers.onTyping?.(unwrap(msg.body), msg))
    }
    handlers.onConnect?.()
  }
  client.onDisconnect = () => handlers.onDisconnect?.()
  client.onStompError = (f) => handlers.onError?.(f)
  client.onWebSocketError = (e) => handlers.onError?.(e)

  client.activate()
  return client
}

export function chatSend(client: Client, body: Record<string, unknown>) {
  client.publish({ destination: '/app/chat.send', body: JSON.stringify(body) })
}

export function chatRead(client: Client, conversation_id: number, last_read_message_id: number) {
  client.publish({
    destination: '/app/chat.read',
    body: JSON.stringify({ conversation_id, last_read_message_id }),
  })
}

export function chatTyping(client: Client, conversation_id: number, is_typing: boolean) {
  client.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify({ conversation_id, is_typing }),
  })
}
