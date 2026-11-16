import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { reviewApi, subjectApi } from '@/api/endpoints'
import { Avatar, Badge, CardSkeleton, EmptyState, ErrorBox, timeAgo } from '@/components/ui'

const SORTS = [
  { key: '', label: 'Mới nhất' },
  { key: 'REACTS', label: 'Nhiều tương tác' },
  { key: 'RATINGS', label: 'Đánh giá cao' },
  { key: 'CREATED', label: 'Cũ nhất' },
]

export default function LecturerReviewPage() {
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState('')
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: subjectApi.all })

  const q = useInfiniteQuery({
    queryKey: ['pending-sessions', subjectId, sortBy],
    queryFn: ({ pageParam }) => reviewApi.pending(pageParam, 10, subjectId || undefined, sortBy || undefined),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <h1 className="text-xl font-bold">Phiên câu hỏi chờ duyệt</h1>

      <div className="card flex flex-wrap gap-3">
        <select className="input w-auto" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value) || '')}>
          <option value="">Tất cả môn</option>
          {subjects.data?.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.code} - {s.name}
            </option>
          ))}
        </select>
        <select className="input w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && <EmptyState>Không có phiên nào chờ duyệt. 🎉</EmptyState>}

      {items.map((s) => (
        <Link key={s.session_id} to={`/lecturer/review/${s.session_id}`} className="card block hover:bg-bg/50 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar src={s.author?.avatar_url} name={s.author?.full_name ?? '?'} size={32} />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{s.author?.full_name}</div>
                <div className="text-xs text-textMuted">{timeAgo(s.created_at)}</div>
              </div>
            </div>
            <Badge>{s.status}</Badge>
          </div>
          <div className="font-semibold">{s.title || s.topic || `Phiên #${s.session_id}`}</div>
          {s.content && <p className="text-sm text-textMuted line-clamp-2">{s.content}</p>}
        </Link>
      ))}

      {q.hasNextPage && (
        <button className="btn-ghost w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}
    </>
  )
}
