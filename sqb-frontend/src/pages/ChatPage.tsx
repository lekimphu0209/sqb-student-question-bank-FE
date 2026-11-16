import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Client } from '@stomp/stompjs'
import { convApi } from '@/api/endpoints'
import type { ChatMessage } from '@/api/types'
import { createChatClient, chatSend, chatRead, chatTyping } from '@/lib/chatSocket'
import { useAuthStore } from '@/store/auth'
import { applyEmotes, insertAtCursor } from '@/lib/emote'
import { Avatar, ErrorBox, Spinner, timeAgo } from '@/components/ui'
import EmoteButton from '@/components/EmoteButton'

function normalizeWsMessage(payload: unknown): ChatMessage | null {
  const p = payload as Record<string, any>
  if (!p) return null
  // WsMessageBroadcastDto có thể snake_case hoặc camelCase
  const id = Number(p.message_id ?? p.messageId)
  if (!id || Number.isNaN(id)) return null
  return {
    message_id: id,
    sender_id: Number(p.sender_id ?? p.senderId ?? 0),
    sender_name: String(p.sender_name ?? p.senderName ?? ''),
    avatar_url: String(p.avatar_url ?? p.avatarUrl ?? ''),
    frame_url: String(p.frame_url ?? p.frameUrl ?? ''),
    content: String(p.content ?? ''),
    message_type: (p.message_type ?? p.messageType ?? 'TEXT') as ChatMessage['message_type'],
    media_urls: (p.media_urls ?? p.mediaUrls ?? []) as string[],
    reply_to_message: null,
    created_at: String(p.created_at ?? p.createdAt ?? new Date().toISOString()),
    edited: Boolean(p.edited),
    revoked: Boolean(p.revoked),
  }
}

export default function ChatPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [connected, setConnected] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [wsError, setWsError] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hỗ trợ /messages/new?to=<userId>: tạo (hoặc lấy) conversation direct rồi vào chat
  const targetUserId = params.get('to')
  const direct = useMutation({
    mutationFn: (uid: number) => convApi.createDirect(uid),
  })

  const conversationId = id === 'new' ? direct.data?.conversation_id : Number(id)

  useEffect(() => {
    if (id === 'new' && targetUserId && direct.isIdle) direct.mutate(Number(targetUserId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, targetUserId])

  const history = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => convApi.messages(conversationId!, null, 50),
    enabled: !!conversationId,
  })

  // STOMP: nhận tin nhắn realtime + typing
  useEffect(() => {
    if (!conversationId) return
    const client = createChatClient(
      {
        onConnect: () => {
          setConnected(true)
          setWsError(false)
        },
        onDisconnect: () => setConnected(false),
        onError: () => setWsError(true),
        onMessage: (payload) => {
          const m = normalizeWsMessage(payload)
          if (m) {
            qc.setQueryData(['messages', conversationId], (old: any) => {
              if (!old) return old
              if (old.messages?.some((x: ChatMessage) => x.message_id === m.message_id)) return old
              return { ...old, messages: [...(old.messages ?? []), m] }
            })
          }
          qc.invalidateQueries({ queryKey: ['conversations'] })
        },
        onTyping: (payload) => {
          const p = payload as Record<string, any>
          if (p && (p.is_typing ?? p.isTyping)) {
            setPeerTyping(true)
            if (typingTimer.current) clearTimeout(typingTimer.current)
            typingTimer.current = setTimeout(() => setPeerTyping(false), 3000)
          }
        },
      },
      conversationId,
    )
    clientRef.current = client
    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [conversationId, qc])

  const messages = useMemo(() => {
    const list = history.data?.messages ?? []
    return [...list].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }, [history.data])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Đánh dấu đã đọc tới tin cuối
    const last = messages[messages.length - 1]
    if (last && clientRef.current?.connected) {
      try {
        chatRead(clientRef.current, Number(conversationId), last.message_id)
      } catch {
        // bỏ qua
      }
    }
  }, [messages, conversationId])

  function onTyping(v: string) {
    setText(v)
    const c = clientRef.current
    if (c?.connected && conversationId) {
      try {
        chatTyping(c, Number(conversationId), true)
      } catch {
        // bỏ qua
      }
    }
  }

  function send() {
    const content = text.trim()
    if (!content || !conversationId) return
    const c = clientRef.current
    if (c?.connected) {
      chatSend(c, { conversation_id: Number(conversationId), content: applyEmotes(content), message_type: 'TEXT' })
      setText('')
    } else {
      setWsError(true)
    }
  }

  if (id === 'new' && direct.isPending) return <Spinner label="Đang tạo cuộc trò chuyện..." />
  if (id === 'new' && direct.isError) return <ErrorBox error={direct.error} />
  if (!conversationId) return <ErrorBox error={new Error('Thiếu conversation_id')} />
  if (history.isPending) return <Spinner />

  return (
    <div className="card !p-0 flex flex-col h-[calc(100vh-180px)] min-h-[400px]">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <Link to="/messages" className="text-sm text-textMuted hover:text-primary">← Tin nhắn</Link>
        <span className={`text-xs ${connected ? 'text-success' : 'text-textMuted'}`}>
          {connected ? '● Trực tuyến' : wsError ? '○ Lỗi kết nối realtime' : '○ Đang kết nối...'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.isError && <ErrorBox error={history.error} onRetry={() => history.refetch()} />}
        {messages.map((m) => {
          const mine = m.sender_id === me?.user_id
          if (m.revoked) {
            return (
              <div key={m.message_id} className={`text-xs italic text-textMuted ${mine ? 'text-right' : ''}`}>
                Tin nhắn đã bị thu hồi
              </div>
            )
          }
          return (
            <div key={m.message_id} className={`flex gap-2 ${mine ? 'justify-end' : ''}`}>
              {!mine && <Avatar src={m.avatar_url} name={m.sender_name} size={28} />}
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white' : 'bg-bg'}`}>
                {m.reply_to_message && (
                  <div className={`text-xs mb-1 opacity-70 border-l-2 pl-2 ${mine ? 'border-white/50' : 'border-border'}`}>
                    {m.reply_to_message.sender_name}: {m.reply_to_message.content_preview}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                {m.media_urls?.map((u, i) => (
                  <img key={i} src={u} alt="" className="mt-1 max-h-48 rounded" />
                ))}
                <div className={`text-[10px] mt-0.5 ${mine ? 'text-white/70' : 'text-textMuted'}`}>
                  {timeAgo(m.created_at)}{m.edited ? ' · đã sửa' : ''}
                </div>
              </div>
            </div>
          )
        })}
        {peerTyping && <div className="text-xs text-textMuted italic">Đang soạn tin...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2 items-center">
        <input
          ref={inputRef}
          className="input !rounded-full"
          placeholder={connected ? 'Nhắn tin...' : 'Đang kết nối realtime...'}
          value={text}
          onChange={(e) => onTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <EmoteButton onPick={(emoji) => { setText((t) => insertAtCursor(inputRef.current, t, emoji)); inputRef.current?.focus() }} />
        <button className="btn-primary !rounded-full px-5" onClick={send} disabled={!text.trim() || !connected}>
          Gửi
        </button>
      </div>
    </div>
  )
}
