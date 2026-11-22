import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { badgeApi, gameApi, subjectApi } from '@/api/endpoints'
import { Avatar, Badge, CardSkeleton, EmptyState, ErrorBox, Tabs, timeAgo } from '@/components/ui'
import { CheckCircle2, Medal, PartyPopper } from 'lucide-react'

// Màu huy chương top 1-3 (vàng/bạc/đồng) — hex trung tính, không đụng token theme
const MEDAL_CLASS = ['text-yellow-500', 'text-slate-400', 'text-amber-600']

const TABS = [
  { key: 'leaderboard', label: 'Bảng xếp hạng' },
  { key: 'predictions', label: 'Dự đoán của tôi' },
  { key: 'badges', label: 'Huy hiệu' },
]

function LeaderboardTab() {
  const [period, setPeriod] = useState<'SEMESTER' | 'SUBJECT'>('SEMESTER')
  const [subjectId, setSubjectId] = useState<number | ''>('')
  const subjects = useQuery({ queryKey: ['subjects'], queryFn: subjectApi.all, enabled: period === 'SUBJECT' })
  const q = useQuery({
    queryKey: ['leaderboard', period, subjectId],
    queryFn: () => gameApi.leaderboard(period, subjectId || undefined, null, 50),
  })

  return (
    <>
      <div className="card flex flex-wrap items-center gap-3">
        <Tabs
          tabs={[
            { key: 'SEMESTER', label: 'Cả học kỳ' },
            { key: 'SUBJECT', label: 'Theo môn' },
          ]}
          active={period}
          onChange={(k) => setPeriod(k as 'SEMESTER' | 'SUBJECT')}
        />
        {period === 'SUBJECT' && (
          <select className="input w-auto" value={subjectId} onChange={(e) => setSubjectId(Number(e.target.value) || '')}>
            <option value="">-- Chọn môn --</option>
            {subjects.data?.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && (
        <>
          {q.data.my_rank && (
            <div className="card flex items-center gap-3 border-primary bg-primary/5">
              <span className="w-8 text-center font-bold text-primary">#{q.data.my_rank.rank}</span>
              <Avatar src={q.data.my_rank.avatar_url} name={q.data.my_rank.full_name} size={36} />
              <div className="flex-1">
                <div className="font-semibold text-sm">{q.data.my_rank.full_name} (bạn)</div>
                <div className="text-xs text-textMuted">Top {q.data.my_rank.top_percent}% · {q.data.my_rank.total_participants} người</div>
              </div>
              <span className="font-bold text-primary">{q.data.my_rank.total_points}đ</span>
            </div>
          )}
          <div className="card !p-0 divide-y divide-border">
            {q.data.entries.map((e) => (
              <Link
                key={e.user_id}
                to={`/users/${e.user_id}`}
                className={`flex items-center gap-3 px-4 py-2.5 hover:bg-bg/60 ${e.is_current_user ? 'bg-primary/5' : ''}`}
              >
                <span className={`w-8 flex justify-center font-bold ${e.rank <= 3 ? MEDAL_CLASS[e.rank - 1] : 'text-textMuted'}`}>
                  {e.rank <= 3 ? <Medal size={20} /> : `#${e.rank}`}
                </span>
                <Avatar src={e.avatar_url} name={e.full_name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{e.full_name}</div>
                  <div className="text-xs text-textMuted">{e.user_code}</div>
                </div>
                <span className="font-bold text-primary">{e.total_points}đ</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function PredictionsTab() {
  const q = useQuery({ queryKey: ['my-predictions'], queryFn: () => gameApi.myPredictions(null, 50) })
  if (q.isPending) return <CardSkeleton />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />
  const list = q.data.contents ?? []
  if (list.length === 0) return <EmptyState>Bạn chưa có lượt dự đoán nào.</EmptyState>
  return (
    <>
      {list.map((p) => (
        <div key={p.prediction_id} className="card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-sm">{p.game_type.replace(/_/g, ' ')}</div>
            <div className="text-xs text-textMuted">
              {p.target_type} #{p.target_id} · {timeAgo(p.created_at)}
            </div>
          </div>
          <Badge tone={p.status === 'PENDING' ? 'muted' : p.is_correct ? 'success' : 'danger'}>
            {p.status === 'PENDING' ? 'Chờ kết quả' : p.is_correct ? 'Đúng' : 'Sai'}
          </Badge>
        </div>
      ))}
    </>
  )
}

function BadgesTab() {
  const q = useQuery({ queryKey: ['my-badges'], queryFn: badgeApi.me })
  if (q.isPending) return <CardSkeleton />
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />
  if (q.data.length === 0) return <EmptyState>Bạn chưa có huy hiệu nào. Hãy đề xuất câu hỏi để nhận huy hiệu đầu tiên!</EmptyState>
  const TIER_TONE = { BRONZE: 'muted', SILVER: 'muted', GOLD: 'primary', PLATINUM: 'primary' } as const
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {q.data.map((b) => (
        <div key={b.badge_id} className="card text-center space-y-1">
          {b.icon_url ? <img src={b.icon_url} alt="" className="w-14 h-14 mx-auto" /> : <Medal size={56} className="mx-auto text-primary" />}
          <div className="font-semibold text-sm">{b.name}</div>
          <Badge tone={TIER_TONE[b.badge_tier] ?? 'muted'}>{b.badge_tier}</Badge>
          <div className="text-xs text-textMuted">{b.description}</div>
        </div>
      ))}
    </div>
  )
}

export default function GamesPage() {
  const [tab, setTab] = useState('leaderboard')
  const qc = useQueryClient()
  const checkInStatus = useQuery({ queryKey: ['checkin'], queryFn: gameApi.checkInStatus })
  const checkIn = useMutation({
    mutationFn: gameApi.checkIn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkin'] }),
  })

  return (
    <>
      <h1 className="text-xl font-bold">Minigame & Bảng xếp hạng</h1>

      {checkInStatus.isSuccess && (
        <div className="card flex items-center justify-between">
          <div className="text-sm">
            <b>Điểm danh hằng ngày</b>
            <div className="text-xs text-textMuted">Chuỗi hiện tại: {checkInStatus.data.current_streak} ngày</div>
          </div>
          {checkInStatus.data.has_checked_in_today ? (
            <span className="text-success text-sm flex items-center gap-1"><CheckCircle2 size={16} /> Đã điểm danh</span>
          ) : (
            <button className="btn-primary" onClick={() => checkIn.mutate()} disabled={checkIn.isPending}>
              {checkIn.isPending ? '...' : 'Điểm danh'}
            </button>
          )}
        </div>
      )}
      {checkIn.isSuccess && (
        <div className="card text-sm text-success flex items-center gap-2">
          <PartyPopper size={16} className="shrink-0" />
          {checkIn.data.message || `+${checkIn.data.coin_earned} xu`} — số dư {checkIn.data.current_coin_balance} xu
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'predictions' && <PredictionsTab />}
      {tab === 'badges' && <BadgesTab />}
    </>
  )
}
