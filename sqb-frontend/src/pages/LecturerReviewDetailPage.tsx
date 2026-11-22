import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewApi } from '@/api/endpoints'
import type { PracticeOption, PracticeQuestion, ReviewQuestion } from '@/api/types'
import { Badge, CardSkeleton, EmptyState, ErrorBox, Modal } from '@/components/ui'
import { AlertTriangle, ArrowLeft, Check, Pencil, X } from 'lucide-react'

// Modal sửa câu hỏi trước khi duyệt (PUT /questions/{id})
function EditQuestionModal({
  q,
  onClose,
  onSaved,
}: {
  q: ReviewQuestion
  onClose: () => void
  onSaved: () => void
}) {
  const [content, setContent] = useState(q.content)
  const [opts, setOpts] = useState<PracticeOption[]>(q.options.map((o) => ({ ...o })))
  const [explanation, setExplanation] = useState(q.explanation ?? '')
  const [err, setErr] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: () => {
      const body = {
        content: content.trim(),
        options: opts,
        correct_answer: opts.find((o) => o.is_correct)?.key ?? q.correct_answer,
        explanation: explanation.trim(),
      }
      return reviewApi.editQuestion(q.question_id, body as Partial<PracticeQuestion>)
    },
    onSuccess: onSaved,
    onError: (e: Error) => setErr(e.message),
  })

  return (
    <Modal open onClose={onClose} title={`Sửa câu #${q.question_id}`}>
      <div className="space-y-3">
        <div>
          <label className="label">Nội dung câu hỏi</label>
          <textarea className="input min-h-[80px]" value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div>
          <label className="label">Đáp án (chọn đáp án đúng)</label>
          <div className="space-y-2">
            {opts.map((o, i) => (
              <div key={o.key} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  className="accent-success"
                  checked={!!o.is_correct}
                  onChange={() => setOpts((s) => s.map((x, j) => ({ ...x, is_correct: j === i })))}
                />
                <span className="font-semibold text-sm w-4">{o.key}.</span>
                <input
                  className="input !py-1.5 text-sm"
                  value={o.text}
                  onChange={(e) => setOpts((s) => s.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Giải thích</label>
          <textarea
            className="input min-h-[60px]"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>
        {err && <p className="error-text">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button className="btn-primary" disabled={!content.trim() || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function QuestionReviewCard({
  q,
  selected,
  onToggle,
  onEdit,
}: {
  q: ReviewQuestion
  selected: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const reviewed = !!q.status && q.status !== 'PENDING'
  return (
    <div className={`card space-y-2 ${reviewed ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 accent-primary"
          checked={selected}
          disabled={reviewed}
          onChange={onToggle}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Câu #{q.question_id}</span>
            <Badge tone={q.status === 'APPROVED' ? 'success' : q.status === 'REJECTED' ? 'danger' : 'muted'}>{q.status}</Badge>
            {!reviewed && (
              <button className="btn-ghost !p-1 text-xs ml-auto" onClick={onEdit} title="Sửa câu hỏi">
                <Pencil size={14} />
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm">{q.content}</p>
          {q.image_urls?.map((u, i) => (
            <img key={i} src={u} alt="" className="max-h-48 rounded" />
          ))}
          <div className="space-y-1">
            {q.options.map((o) => (
              <div
                key={o.key}
                className={`text-sm rounded px-2 py-1 ${o.is_correct ? 'bg-success/10 text-success font-medium' : 'bg-bg'}`}
              >
                <b>{o.key}.</b> {o.text} {o.is_correct && <Check size={13} className="inline -mt-0.5" />}
              </div>
            ))}
          </div>
          {q.explanation && <p className="text-xs text-textMuted">Giải thích: {q.explanation}</p>}
        </div>
      </div>
    </div>
  )
}

export default function LecturerReviewDetailPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const [editQ, setEditQ] = useState<ReviewQuestion | null>(null)

  const q = useQuery({
    queryKey: ['review-session', sessionId],
    queryFn: () => reviewApi.detail(sessionId!),
    enabled: !!sessionId,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['review-session', sessionId] })

  const approve = useMutation({
    mutationFn: (ids: number[]) => reviewApi.approve(ids),
    onSuccess: () => {
      setSelected(new Set())
      invalidate()
      setDone('Đã phê duyệt.')
    },
  })
  const reject = useMutation({
    mutationFn: ({ ids, reason }: { ids: number[]; reason: string }) => reviewApi.reject(ids, reason),
    onSuccess: () => {
      setSelected(new Set())
      setRejectOpen(false)
      setReason('')
      invalidate()
      setDone('Đã từ chối.')
    },
  })
  const complete = useMutation({
    mutationFn: () => reviewApi.completeReview(sessionId!),
    onSuccess: () => navigate('/lecturer/review'),
  })

  if (q.isPending) return <CardSkeleton />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />

  const items = q.data.items
  const pendingItems = items.filter((i) => !i.status || i.status === 'PENDING')
  const ids = [...selected]

  function toggle(id: number) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Link to="/lecturer/review" className="text-sm text-textMuted hover:text-primary inline-flex items-center gap-1"><ArrowLeft size={14} /> Danh sách chờ duyệt</Link>
        <button className="btn-primary" onClick={() => complete.mutate()} disabled={complete.isPending || pendingItems.length > 0}>
          {complete.isPending ? 'Đang chốt...' : 'Hoàn tất duyệt'}
        </button>
      </div>

      {done && <div className="card text-sm text-success">{done}</div>}
      {(approve.isError || reject.isError || complete.isError) && (
        <ErrorBox error={(approve.error ?? reject.error ?? complete.error) as Error} />
      )}
      {complete.isError === false && pendingItems.length === 0 && items.length > 0 && (
        <div className="card text-sm text-textMuted">Tất cả câu hỏi đã được xử lý — có thể chốt phiên.</div>
      )}

      {q.data.duplicate_warnings?.length > 0 && (
        <div className="card border-warning bg-warning/5 text-sm">
          <b className="flex items-center gap-1">
            <AlertTriangle size={15} className="text-warning" />
            Cảnh báo trùng lặp ({q.data.duplicate_warnings.length}):
          </b>
          <ul className="list-disc pl-5 mt-1">
            {q.data.duplicate_warnings.map((w, i) => (
              <li key={i}>
                Câu #{w.question_id} giống câu #{w.similar_question_id}
                {w.similarity_score != null && ` (${Math.round(w.similarity_score * 100)}%)`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Thanh action nổi */}
      {ids.length > 0 && (
        <div className="card sticky top-16 z-10 flex items-center justify-between border-primary">
          <span className="text-sm font-semibold">Đã chọn {ids.length} câu</span>
          <div className="flex gap-2">
            <button className="btn-primary" disabled={approve.isPending} onClick={() => approve.mutate(ids)}>
              <Check size={15} className="mr-1" />Duyệt
            </button>
            <button className="btn-ghost text-danger" onClick={() => setRejectOpen(true)}>
              <X size={15} className="mr-1" />Từ chối
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-textMuted">
        <span>{items.length} câu hỏi · {pendingItems.length} chờ xử lý</span>
        {pendingItems.length > 0 && (
          <button
            className="btn-ghost text-sm"
            onClick={() =>
              setSelected((s) =>
                s.size === pendingItems.length ? new Set() : new Set(pendingItems.map((p) => p.question_id)),
              )
            }
          >
            {selected.size === pendingItems.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        )}
      </div>

      {items.length === 0 && <EmptyState>Phiên này không có câu hỏi nào.</EmptyState>}
      {items.map((item) => (
        <QuestionReviewCard
          key={item.question_id}
          q={item}
          selected={selected.has(item.question_id)}
          onToggle={() => toggle(item.question_id)}
          onEdit={() => setEditQ(item)}
        />
      ))}

      {editQ && (
        <EditQuestionModal
          q={editQ}
          onClose={() => setEditQ(null)}
          onSaved={() => {
            setEditQ(null)
            invalidate()
            setDone('Đã lưu chỉnh sửa câu hỏi.')
          }}
        />
      )}

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={`Từ chối ${ids.length} câu hỏi`}>
        <textarea
          className="input min-h-[80px]"
          placeholder="Lý do từ chối (bắt buộc)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          className="btn-primary w-full !bg-danger"
          disabled={!reason.trim() || reject.isPending}
          onClick={() => reject.mutate({ ids, reason: reason.trim() })}
        >
          {reject.isPending ? 'Đang gửi...' : 'Xác nhận từ chối'}
        </button>
      </Modal>
    </>
  )
}
