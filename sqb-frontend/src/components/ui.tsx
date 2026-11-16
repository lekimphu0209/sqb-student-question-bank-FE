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

// Skeleton cho trạng thái loading (yêu cầu phi chức năng)
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border/50 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key ? 'border-primary text-primary' : 'border-transparent text-textMuted hover:text-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative card w-full max-w-md space-y-3 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="btn-ghost px-2" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Badge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'muted' | 'success' | 'danger' }) {
  const map = {
    primary: 'bg-primary/10 text-primary',
    muted: 'bg-bg text-textMuted',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
  } as const
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>
}
