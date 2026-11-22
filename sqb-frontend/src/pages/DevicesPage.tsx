import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '@/api/endpoints'
import type { Device } from '@/api/types'
import { CardSkeleton, EmptyState, ErrorBox, Modal, timeAgo } from '@/components/ui'
import { toast } from '@/lib/toast'
import { Globe, Monitor, MonitorSmartphone, Smartphone, Trash2, type LucideIcon } from 'lucide-react'

const PLATFORM_ICON: Record<string, LucideIcon> = { WEB: Globe, IOS: Smartphone, ANDROID: Smartphone, DESKTOP: Monitor }

export default function DevicesPage() {
  const qc = useQueryClient()
  const [confirmRemove, setConfirmRemove] = useState<Device | null>(null)
  const q = useQuery({ queryKey: ['devices'], queryFn: deviceApi.list })
  const logoutDevice = useMutation({
    mutationFn: (id: number) => deviceApi.logoutDevice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => deviceApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      setConfirmRemove(null)
      toast('Đã xoá thiết bị', 'success')
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  return (
    <>
      <h1 className="text-xl font-bold">Thiết bị đã đăng nhập</h1>
      <p className="text-sm text-textMuted">
        Quản lý các phiên đăng nhập. Nếu thấy thiết bị lạ, hãy đăng xuất nó và đổi mật khẩu.
      </p>

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && q.data.devices.length === 0 && <EmptyState icon={<MonitorSmartphone size={32} />}>Không có thiết bị nào.</EmptyState>}

      {q.data?.devices.map((d) => (
        <div key={d.user_device_id} className="card flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-bg text-textMuted flex items-center justify-center">
            {(() => { const I = PLATFORM_ICON[d.platform] ?? Smartphone; return <I size={20} /> })()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">
              {d.device_name || d.platform}
              {d.is_current_device && <span className="ml-2 text-xs text-success">(Thiết bị này)</span>}
            </div>
            <div className="text-xs text-textMuted">
              {d.platform} · v{d.app_version} · hoạt động {timeAgo(d.last_active_at)}
            </div>
          </div>
          {!d.is_current_device && (
            <div className="flex gap-2">
              {d.is_active && (
                <button
                  className="btn-ghost text-danger text-sm"
                  disabled={logoutDevice.isPending}
                  onClick={() => logoutDevice.mutate(d.user_device_id)}
                >
                  Đăng xuất
                </button>
              )}
              <button className="btn-ghost text-danger text-sm" onClick={() => setConfirmRemove(d)}>
                <Trash2 size={14} className="inline mr-1 -mt-0.5" />
                Xoá
              </button>
            </div>
          )}
        </div>
      ))}

      <Modal open={confirmRemove !== null} onClose={() => setConfirmRemove(null)} title="Xoá thiết bị?">
        <p className="text-sm text-textMuted">
          Xoá "{confirmRemove?.device_name || confirmRemove?.platform}" khỏi danh sách thiết bị đã đăng nhập.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmRemove(null)}>
            Huỷ
          </button>
          <button
            className="btn-ghost text-danger"
            disabled={remove.isPending}
            onClick={() => confirmRemove && remove.mutate(confirmRemove.user_device_id)}
          >
            {remove.isPending ? 'Đang xoá...' : 'Xoá thiết bị'}
          </button>
        </div>
      </Modal>
    </>
  )
}
