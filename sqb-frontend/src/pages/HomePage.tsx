import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUp } from 'lucide-react'
import { feedApi } from '@/api/endpoints'
import type { FeedItem, Post } from '@/api/types'
import PostComposer from '@/components/PostComposer'
import PostCard from '@/components/PostCard'
import { CardSkeleton, EmptyState, ErrorBox } from '@/components/ui'
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

const FEED_CACHE_KEY = 'sqb-feed-cache'

function loadFeedCache(): FeedItem[] {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY)
    return raw ? (JSON.parse(raw) as FeedItem[]) : []
  } catch {
    return []
  }
}

export default function HomePage() {
  const qc = useQueryClient()
  const [since, setSince] = useState<number>(Date.now())
  const [cached] = useState<FeedItem[]>(loadFeedCache)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const q = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => feedApi.list(pageParam, 10),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })

  // Poll số bài mới mỗi 30s -> nút "N bài viết mới"
  const newCount = useQuery({
    queryKey: ['feed-new-count', since],
    queryFn: () => feedApi.newCount(since),
    refetchInterval: 30_000,
    enabled: q.isSuccess,
  })

  // Infinite scroll bằng IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage()
      },
      { rootMargin: '300px' },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage])

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  // NFR: cache 15 item đầu vào localStorage -> lần sau mở app thấy feed ngay, vẫn refetch nền
  useEffect(() => {
    if (q.isSuccess && q.data?.pages[0]?.items.length) {
      try {
        localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(q.data.pages[0].items.slice(0, 15)))
      } catch {
        // quota đầy -> bỏ qua
      }
    }
  }, [q.isSuccess, q.data])

  // Đang load mà có cache -> hiển thị cache trước
  const showCache = q.isPending && cached.length > 0
  const displayItems = showCache ? cached : items

  function onShowNewPosts() {
    setSince(Date.now())
    qc.invalidateQueries({ queryKey: ['feed'] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fresh = newCount.data?.total_new ?? 0

  return (
    <>
      {fresh > 0 && (
        <button className="btn-primary sticky top-16 z-10 w-full shadow-md" onClick={onShowNewPosts}>
          <ArrowUp size={15} className="inline -mt-0.5" /> {fresh} bài viết mới
        </button>
      )}

      <PostComposer />

      {q.isPending && cached.length === 0 && (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}
      {showCache && <p className="text-xs text-textMuted text-center">Đang cập nhật bảng tin...</p>}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}

      {q.isSuccess && items.length === 0 && (
        <EmptyState>Bảng tin trống. Hãy kết bạn hoặc đăng bài đầu tiên!</EmptyState>
      )}

      {displayItems.map((item, i) => {
        const post = feedItemToPost(item)
        if (post) return <PostCard key={`${item.target_type}-${item.target_id}-${i}`} post={post} />
        return (
          <div key={`${item.target_type}-${item.target_id}-${i}`} className="card text-sm text-textMuted">
            <b>{item.actor?.full_name}</b> · {item.action_type}
          </div>
        )
      })}

      <div ref={sentinelRef} />
      {q.isFetchingNextPage && <CardSkeleton />}
      {q.isSuccess && !q.hasNextPage && items.length > 0 && (
        <p className="text-center text-xs text-textMuted">{MESSAGES.noMoreData}</p>
      )}
    </>
  )
}

