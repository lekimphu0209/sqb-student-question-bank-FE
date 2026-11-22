import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MessageCircle, ThumbsUp, Trash2 } from 'lucide-react'
import { reactApi, submissionApi } from '@/api/endpoints'
import CommentThread from '@/components/CommentThread'
import { EmptyState, ErrorBox, Modal, Spinner, timeAgo } from '@/components/ui'
import { toast } from '@/lib/toast'

// Chi tiết phiên đề xuất của chính sinh viên: xem câu hỏi đã nộp + rút phiên
export default function SubmissionDetailPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState<number | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)

  const q = useQuery({ queryKey: ['submission', sessionId], queryFn: () => submissionApi.detail(sessionId) })

  // Like/unlike phiên (POST /react target SESSION)
  const like = useMutation({
    mutationFn: () => reactApi.toggle('SESSION', Number(sessionId), liked ? 'NONE' : 'LIKE'),
    onMutate: () => {
      setLiked(!liked)
      setLikeCount((c) => (c ?? q.data?.react_count ?? 0) + (liked ? -1 : 1))
    },
    onError: () => {
      setLiked(liked)
      setLikeCount((c) => (c ?? 0) + (liked ? 1 : -1))
    },
  })
  const withdraw = useMutation({
    mutationFn: () => submissionApi.remove(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-submissions'] })
      toast('Đã rút phiên đề xuất', 'success')
      navigate('/questions/my-submissions')
    },
    onError: (e: Error) => toast(e.message, 'error'),
  })

  if (q.isPending) return <Spinner />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />
  const s = q.data

  return (
    <>
      <Link
        to="/questions/my-submissions"
        className="text-sm text-textMuted hover:text-primary inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Phiên của tôi
      </Link>

      <div className="card space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{s.title || `Phiên #${s.session_id}`}</h1>
            <div className="text-sm text-textMuted">
              {s.session_code && <span className="mr-2">#{s.session_code}</span>}
              {s.subject_code} · {s.subject_name} · {timeAgo(s.created_at)}
            </div>
            {s.reviewed_by_lecturer && (
              <div className="text-xs text-textMuted mt-1">
                Đã duyệt bởi {s.reviewed_by_lecturer}
                {s.reviewed_at ? ` · ${timeAgo(s.reviewed_at)}` : ''}
              </div>
            )}
          </div>
          <button className="btn-ghost text-danger text-sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 size={14} className="inline mr-1 -mt-0.5" />
            Rút phiên
          </button>
        </div>
        {s.content && <p className="text-sm whitespace-pre-wrap">{s.content}</p>}
        <div className="text-sm text-textMuted flex items-center gap-1 border-t border-border pt-2">
          <button
            className={`btn-ghost !px-2 !py-1 text-xs inline-flex items-center gap-1 ${liked ? 'text-primary' : ''}`}
            onClick={() => like.mutate()}
          >
            <ThumbsUp size={13} className={liked ? 'fill-current' : ''} />
            {likeCount ?? s.react_count}
          </button>
          <button
            className="btn-ghost !px-2 !py-1 text-xs inline-flex items-center gap-1"
            onClick={() => setCommentsOpen((v) => !v)}
          >
            <MessageCircle size={13} />
            {s.comment_count} bình luận
          </button>
          <span className="ml-auto text-xs">{s.questions?.length ?? 0} câu hỏi</span>
        </div>
        {commentsOpen && <CommentThread targetType="SESSION" targetId={s.session_id} />}
      </div>

      <h2 className="font-semibold">Câu hỏi đã nộp</h2>
      {(!s.questions || s.questions.length === 0) && <EmptyState>Phiên không có câu hỏi nào.</EmptyState>}
      {s.questions?.map((question, i) => (
        <div key={question.question_id} className="card space-y-2">
          <div className="font-medium text-sm">
            Câu {i + 1}. {question.content}
          </div>
          {question.image_urls?.map((u, j) => (
            <img key={j} src={u} alt="" className="max-h-48 rounded" />
          ))}
          <div className="grid sm:grid-cols-2 gap-1">
            {question.options?.map((o) => (
              <div key={o.key} className="text-sm rounded border border-border px-2 py-1.5">
                <span className="font-semibold">{o.key}.</span> {o.text}
              </div>
            ))}
          </div>
          {question.explanation && <p className="text-xs text-textMuted">Giải thích: {question.explanation}</p>}
          <div className="text-xs text-textMuted">
            Nguồn: {question.source === 'LLM' ? 'AI' : 'Người dùng'}
          </div>
        </div>
      ))}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Rút phiên đề xuất?">
        <p className="text-sm text-textMuted">
          Phiên #{s.session_id} và toàn bộ câu hỏi trong phiên sẽ bị xoá. Hành động này không thể hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setConfirmOpen(false)}>
            Huỷ
          </button>
          <button className="btn-ghost text-danger" disabled={withdraw.isPending} onClick={() => withdraw.mutate()}>
            {withdraw.isPending ? 'Đang rút...' : 'Rút phiên'}
          </button>
        </div>
      </Modal>
    </>
  )
}
