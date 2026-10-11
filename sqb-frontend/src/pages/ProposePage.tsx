import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { sessionApi } from '@/api/endpoints'
import type { ProposeQuestion } from '@/api/types'
import { ErrorBox, Spinner } from '@/components/ui'

const KEYS = ['A', 'B', 'C', 'D']

function emptyQuestion(): ProposeQuestion {
  return {
    content: '',
    options: KEYS.map((key) => ({ key, text: '', is_correct: key === 'A' })),
    explanation: '',
    llm_generated: false,
    confidence: 2,
  }
}

export default function ProposePage() {
  const navigate = useNavigate()
  const subjects = useQuery({ queryKey: ['enrolled-subjects'], queryFn: sessionApi.enrolledSubjects })
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [questions, setQuestions] = useState<ProposeQuestion[]>([emptyQuestion()])
  const [error, setError] = useState<string | null>(null)

  const propose = useMutation({
    mutationFn: () =>
      sessionApi.propose({ title: title.trim(), content: content.trim() || undefined, subject_id: Number(subjectId), questions }),
    onSuccess: (d) => {
      const warn = d.duplicate_warnings?.length ? `\nCảnh báo trùng lặp: ${d.duplicate_warnings.length} câu.` : ''
      alert(`Đã gửi phiên #${d.session_id} (${d.questions_count} câu, trạng thái ${d.status}).${warn}`)
      navigate('/questions/my-submissions')
    },
    onError: (e: Error) => setError(e.message),
  })

  function updateQ(i: number, patch: Partial<ProposeQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))
  }

  function validate(): string | null {
    if (!title.trim()) return 'Vui lòng nhập tiêu đề phiên.'
    if (!subjectId) return 'Vui lòng chọn môn học.'
    for (const [i, q] of questions.entries()) {
      if (!q.content.trim()) return `Câu ${i + 1}: thiếu nội dung.`
      const filled = q.options.filter((o) => o.text.trim())
      if (filled.length < 2) return `Câu ${i + 1}: cần ít nhất 2 phương án.`
      if (!q.options.some((o) => o.is_correct && o.text.trim())) return `Câu ${i + 1}: chưa chọn đáp án đúng.`
      if (q.confidence !== undefined && (q.confidence < 0 || q.confidence > 4)) return `Câu ${i + 1}: confidence phải trong [0;4].`
    }
    return null
  }

  function submit() {
    const err = validate()
    if (err) return setError(err)
    setError(null)
    propose.mutate()
  }

  if (subjects.isPending) return <Spinner />
  if (subjects.isError) return <ErrorBox error={subjects.error} onRetry={() => subjects.refetch()} />

  return (
    <>
      <h1 className="text-xl font-bold">Đề xuất câu hỏi</h1>

      <div className="card space-y-3">
        <div>
          <label className="label">Môn học</label>
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value) || '')}>
            <option value="">-- Chọn môn --</option>
            {subjects.data.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tiêu đề phiên</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Ôn tập chương 3" />
        </div>
        <div>
          <label className="label">Mô tả (tuỳ chọn)</label>
          <textarea className="input" value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
      </div>

      {questions.map((q, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Câu {i + 1}</h3>
            {questions.length > 1 && (
              <button className="btn-ghost text-danger" onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}>
                Xoá
              </button>
            )}
          </div>
          <textarea
            className="input"
            placeholder="Nội dung câu hỏi"
            value={q.content}
            onChange={(e) => updateQ(i, { content: e.target.value })}
          />
          <div className="space-y-2">
            {q.options.map((o, oi) => (
              <div key={o.key} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${i}`}
                  checked={o.is_correct}
                  onChange={() =>
                    updateQ(i, { options: q.options.map((x, xi) => ({ ...x, is_correct: xi === oi })) })
                  }
                  title="Đáp án đúng"
                />
                <span className="w-5 font-semibold">{o.key}</span>
                <input
                  className="input"
                  placeholder={`Phương án ${o.key}`}
                  value={o.text}
                  onChange={(e) =>
                    updateQ(i, { options: q.options.map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })
                  }
                />
              </div>
            ))}
          </div>
          <textarea
            className="input"
            placeholder="Giải thích đáp án (tuỳ chọn)"
            value={q.explanation}
            onChange={(e) => updateQ(i, { explanation: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={q.llm_generated}
                onChange={(e) => updateQ(i, { llm_generated: e.target.checked })}
              />
              Câu hỏi do AI/LLM tạo
            </label>
            <label className="flex items-center gap-2">
              Độ tự tin
              <input
                type="range"
                min={0}
                max={4}
                step={0.5}
                value={q.confidence}
                onChange={(e) => updateQ(i, { confidence: Number(e.target.value) })}
              />
              <b>{q.confidence}</b>/4
            </label>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button className="btn-ghost" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
          + Thêm câu hỏi
        </button>
        <button className="btn-primary ml-auto" onClick={submit} disabled={propose.isPending}>
          {propose.isPending ? 'Đang gửi...' : 'Gửi đề xuất'}
        </button>
      </div>
      {error && <ErrorBox error={new Error(error)} />}
    </>
  )
}
