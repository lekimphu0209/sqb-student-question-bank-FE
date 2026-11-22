import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { practiceApi } from '@/api/endpoints'
import type { AnswerResult, PracticeQuestion } from '@/api/types'
import { Badge, CardSkeleton, EmptyState, ErrorBox } from '@/components/ui'
import { Check, CheckCircle2, MessageCircle, Star, ThumbsUp, XCircle } from 'lucide-react'

const DIFF_LABEL: Record<string, string> = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó', UNCLASSIFIED: 'Chưa phân loại' }

function QuestionCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [result, setResult] = useState<AnswerResult | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [isError, setIsError] = useState(false)
  const [rateComment, setRateComment] = useState('')
  const [rated, setRated] = useState(q.my_interaction?.rated ?? false)

  const answered = q.my_interaction?.answered || !!result

  const answer = useMutation({
    mutationFn: () => practiceApi.answer(q.question_id, selected, q.updated_at),
    onSuccess: (d) => {
      setResult(d)
      qc.invalidateQueries({ queryKey: ['practice', 'session'] })
    },
  })

  const rate = useMutation({
    mutationFn: () => practiceApi.rate(q.question_id, rating!, isError, rateComment.trim() || undefined),
    onSuccess: () => setRated(true),
  })

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]))

  const correctKey = result?.correct_answer ?? q.hidden_fields?.correct_answer

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">Câu {index + 1}</span>
        <div className="flex gap-1">
          {q.source === 'LLM' && <Badge tone="muted">AI</Badge>}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-[15px]">{q.content}</p>
      {q.image_urls?.map((u, i) => (
        <img key={i} src={u} alt="" className="max-h-64 rounded-md" />
      ))}

      <div className="space-y-2">
        {q.options.map((o) => {
          const isSel = selected.includes(o.key)
          const showCorrect = answered && correctKey === o.key
          const showWrong = answered && isSel && result && !result.is_correct && correctKey !== o.key
          return (
            <label
              key={o.key}
              className={`flex items-start gap-2 rounded-lg border p-2.5 text-sm cursor-pointer transition-colors ${
                showCorrect
                  ? 'border-success bg-success/10'
                  : showWrong
                    ? 'border-danger bg-danger/10'
                    : isSel
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-bg'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 accent-primary"
                checked={isSel}
                disabled={answered}
                onChange={() => toggle(o.key)}
              />
              <span>
                <b>{o.key}.</b> {o.text}
                {o.media_url && <img src={o.media_url} alt="" className="mt-1 max-h-32 rounded" />}
              </span>
            </label>
          )
        })}
      </div>

      {!answered && (
        <button className="btn-primary" disabled={selected.length === 0 || answer.isPending} onClick={() => answer.mutate()}>
          {answer.isPending ? 'Đang nộp...' : 'Trả lời'}
        </button>
      )}
      {answer.isError && <p className="error-text">{(answer.error as Error).message}</p>}

      {result && (
        <div className={`rounded-lg p-3 text-sm ${result.is_correct ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          <b className="flex items-center gap-1">
            {result.is_correct ? <><CheckCircle2 size={16} /> Chính xác!</> : <><XCircle size={16} /> Sai rồi.</>}
          </b>
          {!result.is_correct && <span className="ml-1">Đáp án đúng: {result.correct_answer}</span>}
          {result.explanation && <p className="mt-1 text-text">{result.explanation}</p>}
        </div>
      )}
      {!result && answered && q.hidden_fields?.explanation && (
        <div className="rounded-lg p-3 text-sm bg-bg">
          <b>Giải thích:</b> {q.hidden_fields.explanation}
        </div>
      )}

      {/* Rating + báo lỗi (Game 5) */}
      {answered && !rated && (
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span>Đánh giá câu hỏi:</span>
            {[0, 1, 2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => setRating(v)}
                className={rating !== null && v <= rating ? 'text-primary' : 'text-border'}
                aria-label={`${v} sao`}
              >
                <Star size={22} className={rating !== null && v <= rating ? 'fill-current' : ''} />
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-danger">
            <input type="checkbox" checked={isError} onChange={(e) => setIsError(e.target.checked)} />
            Câu hỏi có lỗi (sai đáp án/sai nội dung)
          </label>
          {isError && (
            <input
              className="input"
              placeholder="Mô tả lỗi bạn phát hiện..."
              value={rateComment}
              onChange={(e) => setRateComment(e.target.value)}
            />
          )}
          <button className="btn-ghost" disabled={rating === null || rate.isPending} onClick={() => rate.mutate()}>
            {rate.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
          {rate.isError && <p className="error-text">{(rate.error as Error).message}</p>}
        </div>
      )}
      {rated && (
        <p className="text-xs text-textMuted flex items-center gap-1">
          <Check size={13} /> Bạn đã đánh giá câu hỏi này.
        </p>
      )}

      <div className="text-xs text-textMuted flex items-center gap-3">
        <span className="inline-flex items-center gap-1"><ThumbsUp size={12} />{q.react_count}</span>
        <span className="inline-flex items-center gap-1"><MessageCircle size={12} />{q.comment_count}</span>
        <span className="inline-flex items-center gap-1"><Star size={12} />{q.rating_count} đánh giá</span>
      </div>
    </div>
  )
}

export default function PracticePage() {
  const { id } = useParams()
  const q = useQuery({
    queryKey: ['practice', 'session', id],
    queryFn: () => practiceApi.questions(id!),
    enabled: !!id,
  })

  if (q.isPending) return <CardSkeleton />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />

  const s = q.data
  return (
    <>
      <div className="card">
        <h1 className="text-xl font-bold">{s.title || `Phiên #${s.session_id}`}</h1>
        <p className="text-sm text-textMuted">
          {s.subject_code} · {s.subject_name} · {s.total_questions} câu hỏi
        </p>
        {s.content && <p className="text-sm mt-1">{s.content}</p>}
      </div>

      {s.questions.length === 0 && <EmptyState>Phiên này chưa có câu hỏi nào được duyệt.</EmptyState>}
      {s.questions.map((question, i) => (
        <QuestionCard key={question.question_id} q={question} index={i} />
      ))}

      <p className="text-center text-xs text-textMuted pb-4">
        Chú thích độ khó: {Object.values(DIFF_LABEL).join(' / ')}
      </p>
    </>
  )
}
