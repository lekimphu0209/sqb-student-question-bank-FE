import { useParams } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { postApi, userApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/auth'
import PostCard from '@/components/PostCard'
import { Avatar, EmptyState, ErrorBox, Spinner } from '@/components/ui'

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
