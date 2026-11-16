import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { blockApi, convApi, followApi, friendApi, postApi, userApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/auth'
import PostCard from '@/components/PostCard'
import ReportModal from '@/components/ReportModal'
import { Avatar, EmptyState, ErrorBox, Spinner } from '@/components/ui'

// Nút hành động quan hệ trên profile người khác (BF-07)
function RelationActions({ userId }: { userId: number }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [reportOpen, setReportOpen] = useState(false)

  const stats = useQuery({ queryKey: ['rel-stats', userId], queryFn: () => followApi.stats(userId) })
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['rel-stats', userId] })
    qc.invalidateQueries({ queryKey: ['profile'] })
  }

  const sendReq = useMutation({ mutationFn: () => friendApi.request(userId), onSuccess: invalidate })
  const acceptReq = useMutation({ mutationFn: () => friendApi.accept(userId), onSuccess: invalidate })
  const declineReq = useMutation({ mutationFn: () => friendApi.decline(userId), onSuccess: invalidate })
  const unfriend = useMutation({ mutationFn: () => friendApi.unfriend(userId), onSuccess: invalidate })
  const follow = useMutation({ mutationFn: () => followApi.follow(userId), onSuccess: invalidate })
  const unfollow = useMutation({ mutationFn: () => followApi.unfollow(userId), onSuccess: invalidate })
  const block = useMutation({ mutationFn: () => blockApi.block(userId), onSuccess: invalidate })
  const unblock = useMutation({ mutationFn: () => blockApi.unblock(userId), onSuccess: invalidate })
  const chat = useMutation({
    mutationFn: () => convApi.createDirect(userId),
    onSuccess: (c) => navigate(`/messages/${c.conversation_id}`),
  })
  if (stats.isPending) return <Spinner label="" />
  if (stats.isError) return null
  const r = stats.data.relationship_with_me
  const busy =
    sendReq.isPending || acceptReq.isPending || unfriend.isPending || follow.isPending ||
    unfollow.isPending || block.isPending || unblock.isPending || chat.isPending || declineReq.isPending

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {r.friend ? (
          <button className="btn-ghost" disabled={busy} onClick={() => unfriend.mutate()}>Huỷ kết bạn</button>
        ) : r.friend_request_status === 'PENDING' ? (
          <button className="btn-ghost" disabled={busy} onClick={() => declineReq.mutate()}>Huỷ lời mời</button>
        ) : r.friend_request_status === 'NONE' || r.friend_request_status === 'DECLINED' ? (
          <button className="btn-primary" disabled={busy} onClick={() => sendReq.mutate()}>+ Kết bạn</button>
        ) : (
          <button className="btn-primary" disabled={busy} onClick={() => acceptReq.mutate()}>Chấp nhận kết bạn</button>
        )}

        {r.following ? (
          <button className="btn-ghost" disabled={busy} onClick={() => unfollow.mutate()}>Bỏ theo dõi</button>
        ) : (
          <button className="btn-ghost" disabled={busy} onClick={() => follow.mutate()}>Theo dõi</button>
        )}

        <button className="btn-ghost" disabled={busy} onClick={() => chat.mutate()}>💬 Nhắn tin</button>

        {r.blocked ? (
          <button className="btn-ghost text-danger" disabled={busy} onClick={() => unblock.mutate()}>Bỏ chặn</button>
        ) : (
          <button className="btn-ghost text-danger" disabled={busy} onClick={() => block.mutate()}>Chặn</button>
        )}
        <button className="btn-ghost" onClick={() => setReportOpen(true)}>Báo cáo</button>
      </div>
      {chat.isError && <p className="error-text">{(chat.error as Error).message}</p>}
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="USER" targetId={userId} />
    </div>
  )
}

export default function ProfilePage() {
  const { userId } = useParams()
  const me = useAuthStore((s) => s.user)
  const isMe = !userId || Number(userId) === me?.user_id

  const profile = useQuery({
    queryKey: ['profile', isMe ? 'me' : userId],
    queryFn: () => (isMe ? userApi.me() : userApi.byId(userId!)),
  })

  const posts = useInfiniteQuery({
    queryKey: ['my-posts', isMe ? 'me' : userId],
    queryFn: ({ pageParam }) => (isMe ? postApi.mine(pageParam) : postApi.ofUser(userId!, pageParam)),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })

  if (profile.isPending) return <Spinner />
  if (profile.isError) return <ErrorBox error={profile.error} onRetry={() => profile.refetch()} />
  const p = profile.data
  const items = posts.data?.pages.flatMap((pg) => pg.items) ?? []

  const stats: [string, number | string][] = [
    ['Bạn bè', p.friends_count],
    ['Người theo dõi', p.followers_count],
    ['Đang theo dõi', p.following_count],
    ['Câu hỏi đề xuất', p.total_proposed_questions],
    ['Điểm', p.gamification_points],
    ['Huy hiệu', p.badges_count],
  ]

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="h-32 bg-primary/20" style={p.cover_url ? { backgroundImage: `url(${p.cover_url})`, backgroundSize: 'cover' } : {}} />
        <div className="px-4 pb-4">
          <div className="-mt-10 mb-2">
            <Avatar src={p.avatar_url} name={p.full_name} size={80} />
          </div>
          <h1 className="text-xl font-bold">{p.full_name}</h1>
          <p className="text-sm text-textMuted">
            {p.role} · {p.student_lecturer_code}
            {p.email && ` · ${p.email}`}
          </p>
          {p.bio && <p className="mt-2 text-sm">{p.bio}</p>}
          {!isMe && <RelationActions userId={Number(userId)} />}
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {stats.map(([label, val]) => (
              <div key={label} className="bg-bg rounded-md py-2">
                <div className="font-semibold">{val}</div>
                <div className="text-xs text-textMuted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="font-semibold">Bài viết</h2>
      {posts.isPending && <Spinner />}
      {posts.isError && <ErrorBox error={posts.error} onRetry={() => posts.refetch()} />}
      {posts.isSuccess && items.length === 0 && <EmptyState>Chưa có bài viết nào.</EmptyState>}
      {items.map((post) => (
        <PostCard key={post.post_id} post={post} />
      ))}
      {posts.hasNextPage && (
        <button className="btn-ghost w-full" onClick={() => posts.fetchNextPage()}>
          Tải thêm
        </button>
      )}
    </>
  )
}
