import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blockApi } from '@/api/endpoints'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, timeAgo } from '@/components/ui'

export default function BlockedPage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['blocked'], queryFn: () => blockApi.list(null, 50) })
  const unblock = useMutation({
    mutationFn: (id: number) => blockApi.unblock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocked'] }),
  })

  return (
    <>
      <h1 className="text-xl font-bold">Người dùng đã chặn</h1>
      <p className="text-sm text-textMuted">
        Người bị chặn không thể xem hồ sơ, nhắn tin hay tương tác với bạn. Bạn cũng không thấy nội dung của họ.
      </p>

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && q.data.items.length === 0 && <EmptyState>Bạn chưa chặn ai.</EmptyState>}

      {q.data?.items.map((u) => (
        <div key={u.user_id} className="card flex items-center gap-3">
          <Link to={`/users/${u.user_id}`}>
            <Avatar src={u.avatar_url} name={u.full_name} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{u.full_name}</div>
            <div className="text-xs text-textMuted">Đã chặn {timeAgo(u.blocked_at)}</div>
          </div>
          <button className="btn-ghost" onClick={() => unblock.mutate(u.user_id)} disabled={unblock.isPending}>
            Bỏ chặn
          </button>
        </div>
      ))}
    </>
  )
}
