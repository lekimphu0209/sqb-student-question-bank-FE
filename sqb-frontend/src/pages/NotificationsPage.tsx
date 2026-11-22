import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notiApi } from '@/api/endpoints'
import type { NotificationItem } from '@/api/types'
import { useInfiniteScroll } from '@/lib/infiniteScroll'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'
import {
  AlertTriangle, BarChart3, Bell, BellOff, CheckCircle2, Medal, MessageCircle, Trophy, UserPlus,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  FRIEND_REQUEST: UserPlus,
  NEW_COMMENT: MessageCircle,
  QUESTION_APPROVED: CheckCircle2,
  EARNED_BADGE: Medal,
  QUESTION_ERROR_PENALTY: AlertTriangle,
  GAME5_SEMESTER_RECAP: BarChart3,
  LEADERBOARD_HONOR: Trophy,
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const q = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }) => notiApi.list(pageParam, 15),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })
  const sentinel = useInfiniteScroll(q)

  const read = useMutation({
    mutationFn: (id: number) => notiApi.read(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['noti-unread'] })
    },
  })
  const readAll = useMutation({
    mutationFn: () => notiApi.readAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['noti-unread'] })
    },
  })

  const items = q.data?.pages.flatMap((p) => p.items) ?? []
  const unread = q.data?.pages[0]?.unread_count ?? 0

  function open(n: NotificationItem) {
    if (!n.read_at) read.mutate(n.notification_id)
    const url = n.target?.url
    if (url) navigate(url.startsWith('/') ? url : `/${url}`)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Thông báo {unread > 0 && <span className="text-sm text-textMuted">({unread} chưa đọc)</span>}</h1>
        {unread > 0 && (
          <button className="btn-ghost text-sm" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && <EmptyState icon={<BellOff size={32} />}>Chưa có thông báo nào.</EmptyState>}

      <div className="space-y-1">
        {items.map((n) => (
          <button
            key={n.notification_id}
            onClick={() => open(n)}
            className={`card w-full text-left flex gap-3 items-start transition-colors hover:bg-bg/60 ${!n.read_at ? 'border-l-4 border-l-primary' : ''}`}
          >
            <div className="relative shrink-0">
              {(() => {
                const Icon = ICONS[n.type] ?? Bell
                return (
                  <>
                    {n.actor?.avatar_url ? (
                      <Avatar src={n.actor.avatar_url} name={n.actor.full_name} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <Icon size={18} />
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface border border-border text-textMuted flex items-center justify-center">
                      <Icon size={12} />
                    </span>
                  </>
                )
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{n.title}</div>
              {n.body && <div className="text-sm text-textMuted line-clamp-2">{n.body}</div>}
              <div className="text-xs text-textMuted mt-0.5">{timeAgo(n.created_at)}</div>
            </div>
            {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
          </button>
        ))}
      </div>

      <div ref={sentinel} className="py-2 flex justify-center">
        {q.isFetchingNextPage && <Spinner label="" />}
      </div>
    </>
  )
}
