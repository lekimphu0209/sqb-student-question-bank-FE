import { useNavigate } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notiApi } from '@/api/endpoints'
import type { NotificationItem } from '@/api/types'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, timeAgo } from '@/components/ui'

const ICONS: Record<string, string> = {
  FRIEND_REQUEST: '👥',
  NEW_COMMENT: '💬',
  QUESTION_APPROVED: '✅',
  EARNED_BADGE: '🏅',
  QUESTION_ERROR_PENALTY: '⚠️',
  GAME5_SEMESTER_RECAP: '📊',
  LEADERBOARD_HONOR: '🏆',
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
      {q.isSuccess && items.length === 0 && <EmptyState>Chưa có thông báo nào.</EmptyState>}

      <div className="space-y-1">
        {items.map((n) => (
          <button
            key={n.notification_id}
            onClick={() => open(n)}
            className={`card w-full text-left flex gap-3 items-start transition-colors hover:bg-bg/60 ${!n.read_at ? 'border-l-4 border-l-primary' : ''}`}
          >
            <div className="relative shrink-0">
              {n.actor?.avatar_url ? (
                <Avatar src={n.actor.avatar_url} name={n.actor.full_name} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                  {ICONS[n.type] ?? '🔔'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 text-sm">{ICONS[n.type] ?? '🔔'}</span>
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

      {q.hasNextPage && (
        <button className="btn-ghost w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}
    </>
  )
}
