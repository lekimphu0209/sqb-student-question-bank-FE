import { useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/api/endpoints'
import { EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'

export default function MySubmissionsPage() {
  const q = useQuery({ queryKey: ['my-submissions'], queryFn: () => sessionApi.mySubmissions(null, 20) })

  if (q.isPending) return <Spinner />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />

  const items = q.data.content ?? q.data.items ?? []

  return (
    <>
      <h1 className="text-xl font-bold">Phiên đề xuất của tôi</h1>
      {items.length === 0 && <EmptyState>Bạn chưa đề xuất câu hỏi nào.</EmptyState>}
      {items.map((s) => (
        <div key={s.session_id} className="card flex items-center justify-between">
          <div>
            <div className="font-semibold">
              #{s.session_id} · {s.subject_name}
            </div>
            <div className="text-sm text-textMuted">
              {s.question_counts ?? s.questions_count ?? 0} câu · {timeAgo(s.created_at)}
              {s.status && ` · ${s.status}`}
            </div>
          </div>
          <div className="text-sm text-textMuted">
            👍 {s.react_count ?? 0} · 💬 {s.comment_count ?? 0}
          </div>
        </div>
      ))}
    </>
  )
}
