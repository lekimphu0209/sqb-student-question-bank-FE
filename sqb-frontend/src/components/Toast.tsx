import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { onToast, type Toast, type ToastType } from '@/lib/toast'

const STYLES: Record<ToastType, { cls: string; Icon: typeof Info }> = {
  success: { cls: 'border-success/40 bg-card text-success', Icon: CheckCircle2 },
  error: { cls: 'border-danger/40 bg-card text-danger', Icon: AlertCircle },
  info: { cls: 'border-primary/40 bg-card text-primary', Icon: Info },
}

const DURATION = 4000

export default function ToastHost() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(
    () =>
      onToast((t) => {
        setItems((xs) => [...xs, t])
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), DURATION)
      }),
    [],
  )

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {items.map((t) => {
        const { cls, Icon } = STYLES[t.type]
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full flex items-center gap-2 rounded-lg border px-3 py-2.5 shadow-lg text-sm font-medium ${cls}`}
          >
            <Icon size={18} className="shrink-0" />
            <span className="flex-1 text-text">{t.text}</span>
            <button
              aria-label="Đóng thông báo"
              className="text-textMuted hover:text-text shrink-0"
              onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
