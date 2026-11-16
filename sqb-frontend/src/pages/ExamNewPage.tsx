import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { classApi, examApi, subjectApi } from '@/api/endpoints'
import { CardSkeleton, ErrorBox } from '@/components/ui'

export default function ExamNewPage() {
  const navigate = useNavigate()
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: subjectApi.all })
  const classes = useQuery({ queryKey: ['my-classes'], queryFn: classApi.myClasses })

  const [subjectId, setSubjectId] = useState<number | ''>('')
  const [title, setTitle] = useState('')
  const [count, setCount] = useState(20)
  const [easy, setEasy] = useState(0.4)
  const [medium, setMedium] = useState(0.4)
  const [hard, setHard] = useState(0.2)
  const [shuffle, setShuffle] = useState(true)
  const [answerKey, setAnswerKey] = useState(true)
  const [classIds, setClassIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const generate = useMutation({
    mutationFn: () =>
      examApi.generate({
        subject_id: Number(subjectId),
        title: title.trim() || undefined,
        question_count: count,
        difficulty_distribution: { easy, medium, hard, unclassified: Math.max(0, 1 - easy - medium - hard) },
        shuffle_options: shuffle,
        include_answer_key: answerKey,
        class_ids: [...classIds],
      }),
    onSuccess: () => navigate('/lecturer/exams'),
    onError: (e: Error) => setError(e.message),
  })

  const distSum = easy + medium + hard
  const classForSubject = classes.data?.filter((c) => c.subject_id === subjectId) ?? []

  function toggleClass(id: number) {
    setClassIds((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function submit() {
    if (!subjectId) return setError('Vui lòng chọn môn học.')
    if (classIds.size === 0) return setError('Vui lòng chọn ít nhất 1 lớp.')
    if (count < 1) return setError('Số câu hỏi phải ≥ 1.')
    if (distSum > 1) return setError('Tổng tỉ lệ độ khó không được vượt quá 1.')
    setError(null)
    generate.mutate()
  }

  if (subjects.isPending || classes.isPending) return <CardSkeleton />
  if (subjects.isError) return <ErrorBox error={subjects.error} onRetry={() => subjects.refetch()} />

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tạo đề thi</h1>
        <Link to="/lecturer/exams" className="text-sm text-textMuted hover:text-primary">← Danh sách đề</Link>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Môn học *</label>
          <select className="input" value={subjectId} onChange={(e) => { setSubjectId(Number(e.target.value) || ''); setClassIds(new Set()) }}>
            <option value="">-- Chọn môn --</option>
            {subjects.data?.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>{s.code} - {s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Tiêu đề đề thi</label>
          <input className="input" placeholder="VD: Giữa kỳ 2025.1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="label">Số câu hỏi *</label>
          <input className="input w-32" type="number" min={1} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>

        <div>
          <label className="label">Phân bố độ khó (tổng ≤ 1)</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['Dễ', easy, setEasy],
              ['TB', medium, setMedium],
              ['Khó', hard, setHard],
            ] as const).map(([label, val, set]) => (
              <div key={label}>
                <span className="text-xs text-textMuted">{label}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={val}
                  onChange={(e) => set(Number(e.target.value))}
                />
              </div>
            ))}
          </div>
          <p className={`text-xs mt-1 ${distSum > 1 ? 'text-danger' : 'text-textMuted'}`}>
            Tổng: {distSum.toFixed(2)} (phần còn lại tính chưa phân loại)
          </p>
        </div>

        <div>
          <label className="label">Lớp áp dụng *</label>
          {subjectId === '' && <p className="text-xs text-textMuted">Chọn môn học trước.</p>}
          {subjectId !== '' && classForSubject.length === 0 && (
            <p className="text-xs text-textMuted">Bạn không phụ trách lớp nào của môn này.</p>
          )}
          <div className="space-y-1">
            {classForSubject.map((c) => (
              <label key={c.course_class_id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={classIds.has(c.course_class_id)} onChange={() => toggleClass(c.course_class_id)} />
                {c.class_code} · {c.semester_name} · {c.total_students} SV
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            Xáo trộn đáp án
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={answerKey} onChange={(e) => setAnswerKey(e.target.checked)} />
            Kèm đáp án
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary w-full" onClick={submit} disabled={generate.isPending}>
          {generate.isPending ? 'Đang tạo đề...' : 'Tạo đề thi'}
        </button>
      </div>
    </>
  )
}
