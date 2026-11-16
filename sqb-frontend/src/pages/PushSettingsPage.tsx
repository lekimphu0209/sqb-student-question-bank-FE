import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pushApi } from '@/api/endpoints'
import type { PushSettings } from '@/api/types'
import { CardSkeleton, ErrorBox } from '@/components/ui'
import { MESSAGES } from '@/i18n/messages'

const CATEGORY_LABELS: Record<string, string> = {
  SOCIAL: 'Tương tác xã hội (like, comment)',
  FRIEND: 'Bạn bè & lời mời',
  MESSAGE: 'Tin nhắn',
  QUESTION: 'Câu hỏi & duyệt câu hỏi',
  GAME: 'Minigame & BXH',
  SYSTEM: 'Hệ thống',
}

export default function PushSettingsPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['push-settings'], queryFn: pushApi.get })
  const [form, setForm] = useState<PushSettings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (q.data) setForm(q.data)
  }, [q.data])

  const update = useMutation({
    mutationFn: (body: PushSettings) => pushApi.update(body),
    onSuccess: (d) => {
      setForm(d)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      qc.invalidateQueries({ queryKey: ['push-settings'] })
    },
  })

  if (q.isPending) return <CardSkeleton />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />
  if (!form) return null

  const patch = (p: Partial<PushSettings>) => setForm({ ...form, ...p })

  return (
    <>
      <h1 className="text-xl font-bold">Cài đặt thông báo đẩy</h1>

      <div className="card space-y-4">
        <label className="flex items-center justify-between">
          <span className="font-medium">Nhận thông báo đẩy</span>
          <input
            type="checkbox"
            className="w-5 h-5 accent-primary"
            checked={form.push_enabled}
            onChange={(e) => patch({ push_enabled: e.target.checked })}
          />
        </label>

        <div className={form.push_enabled ? '' : 'opacity-50 pointer-events-none'}>
          <h3 className="font-semibold text-sm mb-2">Loại thông báo</h3>
          <div className="space-y-2">
            {Object.entries(form.categories ?? {}).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between text-sm">
                <span>{val.description || CATEGORY_LABELS[key] || key}</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-primary"
                  checked={val.enabled}
                  onChange={(e) =>
                    patch({ categories: { ...form.categories, [key]: { ...val, enabled: e.target.checked } } })
                  }
                />
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3 space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Âm thanh</span>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.sound_enabled}
              onChange={(e) => patch({ sound_enabled: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Rung</span>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.vibration_enabled}
              onChange={(e) => patch({ vibration_enabled: e.target.checked })}
            />
          </label>
        </div>

        <div className="border-t border-border pt-3">
          <label className="flex items-center justify-between text-sm">
            <span>Giờ yên tĩnh</span>
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.quiet_hours?.enabled}
              onChange={(e) => patch({ quiet_hours: { ...form.quiet_hours, enabled: e.target.checked } })}
            />
          </label>
          {form.quiet_hours?.enabled && (
            <div className="flex items-center gap-2 mt-2 text-sm">
              <input
                type="time"
                className="input w-auto"
                value={form.quiet_hours.start_time?.slice(0, 5) ?? '22:00'}
                onChange={(e) => patch({ quiet_hours: { ...form.quiet_hours, start_time: e.target.value } })}
              />
              <span className="text-textMuted">đến</span>
              <input
                type="time"
                className="input w-auto"
                value={form.quiet_hours.end_time?.slice(0, 5) ?? '07:00'}
                onChange={(e) => patch({ quiet_hours: { ...form.quiet_hours, end_time: e.target.value } })}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button className="btn-primary" onClick={() => update.mutate(form)} disabled={update.isPending}>
            {update.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
          {saved && <span className="text-sm text-success">{MESSAGES.saved}</span>}
          {update.isError && <span className="error-text">{(update.error as Error).message}</span>}
        </div>
      </div>
    </>
  )
}
