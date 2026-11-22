import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useMutation } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { examApi } from '@/api/endpoints'
import { Badge, CardSkeleton, EmptyState, ErrorBox, timeAgo } from '@/components/ui'

export default function ExamsPage() {
  const [exporting, setExporting] = useState<number | null>(null)
  const [exportErr, setExportErr] = useState<string | null>(null)

  const q = useInfiniteQuery({
    queryKey: ['my-exams'],
    queryFn: ({ pageParam }) => examApi.myExams(pageParam, 10),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })

  const exportBank = useMutation({
    mutationFn: () => examApi.exportBank(),
    onSuccess: (d) => window.open(d.download_url, '_blank'),
    onError: (e: Error) => setExportErr(e.message),
  })

  async function onExport(examId: number, format: 'PDF' | 'EXCEL') {
    setExportErr(null)
    setExporting(examId)
    try {
      const d = await examApi.export(examId, format, true)
      window.open(d.download_url, '_blank')
    } catch (e) {
      setExportErr((e as Error).message)
    } finally {
      setExporting(null)
    }
  }

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Đề thi của tôi</h1>
        <div className="flex gap-2">
          <button
            className="btn-ghost text-sm"
            disabled={exportBank.isPending}
            onClick={() => exportBank.mutate()}
            title="Xuất toàn bộ câu hỏi ngân hàng"
          >
            {exportBank.isPending ? '...' : (<><Download size={14} className="inline -mt-0.5" /> Xuất ngân hàng</>)}
          </button>
          <Link to="/lecturer/exams/new" className="btn-primary">+ Tạo đề thi</Link>
        </div>
      </div>

      {exportErr && <ErrorBox error={new Error(exportErr)} />}

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && <EmptyState icon={<FileText size={32} />}>Chưa có đề thi nào. Tạo đề đầu tiên!</EmptyState>}

      {items.map((e) => (
        <div key={e.exam_id} className="card space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold">{e.title || `Đề thi #${e.exam_id}`}</div>
            <Badge>{e.question_count} câu</Badge>
          </div>
          <div className="text-xs text-textMuted">
            {e.subject_name} · {timeAgo(e.created_at)}
            {e.statistic &&
              ` · Dễ ${e.statistic.easy_count} / TB ${e.statistic.medium_count} / Khó ${e.statistic.hard_count}`}
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn-ghost text-sm" disabled={exporting === e.exam_id} onClick={() => onExport(e.exam_id, 'PDF')}>
              {exporting === e.exam_id ? '...' : (<><Download size={14} className="inline -mt-0.5" /> PDF</>)}
            </button>
            <button className="btn-ghost text-sm" disabled={exporting === e.exam_id} onClick={() => onExport(e.exam_id, 'EXCEL')}>
              {exporting === e.exam_id ? '...' : (<><Download size={14} className="inline -mt-0.5" /> Excel</>)}
            </button>
            {e.download_url && (
              <a className="btn-ghost text-sm text-primary" href={e.download_url} target="_blank" rel="noreferrer">
                Link tải
              </a>
            )}
          </div>
        </div>
      ))}

      {q.hasNextPage && (
        <button className="btn-ghost w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}
    </>
  )
}
