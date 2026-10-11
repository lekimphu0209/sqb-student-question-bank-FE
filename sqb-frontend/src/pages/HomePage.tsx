import { useInfiniteQuery } from '@tanstack/react-query'
import { feedApi } from '@/api/endpoints'
import type { FeedItem, Post } from '@/api/types'
import PostComposer from '@/components/PostComposer'
import PostCard from '@/components/PostCard'
import { EmptyState, ErrorBox, Spinner } from '@/components/ui'
import { MESSAGES } from '@/i18n/messages'

function feedItemToPost(item: FeedItem): Post | null {
  if (item.target_type !== 'POST') return null
  const c = item.content as Record<string, any>
  return {
    post_id: Number(c.post_id ?? item.target_id),
    content: String(c.text ?? c.content ?? ''),
    media_urls: (c.media_urls as string[]) ?? [],
    author: item.actor,
    react_count: Number(c.like_count ?? c.react_count ?? 0),
    comment_count: Number(c.comment_count ?? 0),
    reacted_by_me: Boolean(c.reacted_by_me),
    created_at: item.created_at,
  }
}

export default function HomePage() {
  const q = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => feedApi.list(pageParam, 10),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <PostComposer />

      {q.isPending && <Spinner />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}

      {q.isSuccess && items.length === 0 && (
        <EmptyState>Bảng tin trống. Hãy kết bạn hoặc đăng bài đầu tiên!</EmptyState>
      )}

      {items.map((item) => {
        const post = feedItemToPost(item)
        if (post) return <PostCard key={`${item.target_type}-${item.target_id}`} post={post} />
        return (
          <div key={`${item.target_type}-${item.target_id}`} className="card text-sm text-textMuted">
            <b>{item.actor?.full_name}</b> · {item.action_type}
            <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(item.content, null, 2)}</pre>
          </div>
        )
      })}

      {q.hasNextPage && (
        <button className="btn-ghost w-full" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
          {q.isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}
      {q.isSuccess && !q.hasNextPage && items.length > 0 && (
        <p className="text-center text-xs text-textMuted">{MESSAGES.noMoreData}</p>
      )}
    </>
  )
}
