import type { ReactNode } from 'react'
import { ApiError } from '@/api/client'
import { MESSAGES } from '@/i18n/messages'

export function Spinner({ label = 'Đang tải...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-textMuted text-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  )
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof ApiError ? `${error.message} (mã ${error.code})` : MESSAGES.connectionError
  return (
    <div className="card border-danger/40 bg-danger/5 text-danger text-sm flex items-center justify-between gap-3">
      <span>{msg}</span>
      {onRetry && (
        <button className="btn-ghost text-danger" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  )
}

export function EmptyState({ children = MESSAGES.empty }: { children?: ReactNode }) {
  return <div className="card text-center text-textMuted text-sm py-10">{children}</div>
}

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size / 2.5 }}
      className="rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center"
    >
      {initials || '?'}
    </div>
  )
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`
  return new Date(iso).toLocaleDateString('vi-VN')
}
