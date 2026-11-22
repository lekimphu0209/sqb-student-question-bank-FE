import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { convApi } from '@/api/endpoints'
import { useInfiniteScroll } from '@/lib/infiniteScroll'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'

export default function MessagesPage() {
  const q = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) => convApi.list(pageParam, 20),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })
  const sentinel = useInfiniteScroll(q)

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <h1 className="text-xl font-bold">Tin nhắn</h1>
      {q.isPending && <CardSkeleton />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && (
        <EmptyState icon={<Mail size={32} />}>
          Chưa có cuộc trò chuyện nào. Vào trang cá nhân của bạn bè để bắt đầu nhắn tin.
        </EmptyState>
      )}

      <div className="space-y-1">
        {items.map((c) => (
          <Link
            key={c.conversation_id}
            to={`/messages/${c.conversation_id}`}
            className="card flex items-center gap-3 hover:bg-bg/60"
          >
            <Avatar src={c.display_avatar_url} name={c.display_name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate ${c.unread_count > 0 ? 'font-bold' : 'font-semibold'}`}>{c.display_name}</span>
                {c.last_message && (
                  <span className="text-xs text-textMuted shrink-0">{timeAgo(c.last_message.created_at)}</span>
                )}
              </div>
              <div className={`text-sm truncate ${c.unread_count > 0 ? 'text-text font-medium' : 'text-textMuted'}`}>
                {c.last_message?.content ?? 'Chưa có tin nhắn'}
              </div>
            </div>
            {c.unread_count > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {c.unread_count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div ref={sentinel} className="py-2 flex justify-center">
        {q.isFetchingNextPage && <Spinner label="" />}
      </div>
    </>
  )
}
