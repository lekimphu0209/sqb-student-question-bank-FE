import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { reportApi } from '@/api/endpoints'
import type { ReportBody } from '@/api/types'
import { Modal } from './ui'

// Modal báo cáo dùng chung cho POST / COMMENT / USER
export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean
  onClose: () => void
  targetType: ReportBody['target_type']
  targetId: number
}) {
  const [type, setType] = useState<ReportBody['violation_type']>('HARASSMENT')
  const [desc, setDesc] = useState('')
  const [done, setDone] = useState(false)

  const report = useMutation({
    mutationFn: () =>
      reportApi.create({ violation_type: type, description: desc.trim() || undefined, target_type: targetType, target_id: targetId }),
    onSuccess: () => setDone(true),
  })

  function close() {
    setDone(false)
    setDesc('')
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Báo cáo">
      {done ? (
        <p className="text-sm text-success">Đã gửi báo cáo. Cảm ơn bạn đã đóng góp giữ cộng đồng an toàn!</p>
      ) : (
        <>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ReportBody['violation_type'])}>
            <option value="HARASSMENT">Quấy rối</option>
            <option value="HATE_STATEMENT">Phát ngôn thù hận</option>
            <option value="SPAM">Spam</option>
            <option value="OTHER">Khác</option>
          </select>
          <textarea
            className="input min-h-[80px]"
            placeholder="Mô tả vi phạm..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          {report.isError && <p className="error-text">{(report.error as Error).message}</p>}
          <button className="btn-primary w-full" disabled={report.isPending} onClick={() => report.mutate()}>
            {report.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </>
      )}
    </Modal>
  )
}
