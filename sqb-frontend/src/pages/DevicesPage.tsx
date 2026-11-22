import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '@/api/endpoints'
import { CardSkeleton, EmptyState, ErrorBox, timeAgo } from '@/components/ui'
import { Globe, Monitor, MonitorSmartphone, Smartphone, type LucideIcon } from 'lucide-react'

const PLATFORM_ICON: Record<string, LucideIcon> = { WEB: Globe, IOS: Smartphone, ANDROID: Smartphone, DESKTOP: Monitor }

export default function DevicesPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['devices'], queryFn: deviceApi.list })
  const logoutDevice = useMutation({
    mutationFn: (id: number) => deviceApi.logoutDevice(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['devices'] }),
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
          {!d.is_current_device && d.is_active && (
            <button
              className="btn-ghost text-danger text-sm"
              disabled={logoutDevice.isPending}
              onClick={() => logoutDevice.mutate(d.user_device_id)}
            >
              Đăng xuất
            </button>
          )}
        </div>
      ))}
    </>
  )
}
