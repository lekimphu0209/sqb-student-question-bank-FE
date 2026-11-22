import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { subjectApi, videoApi } from '@/api/endpoints'
import type { VideoPostItem } from '@/api/types'
import { useInfiniteScroll } from '@/lib/infiniteScroll'
import { Avatar, CardSkeleton, EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'
import { Clock, MessageCircle, ThumbsUp, Video } from 'lucide-react'

function formatDuration(sec?: number): string | null {
  if (!sec) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoCard({ v }: { v: VideoPostItem }) {
  const video = v.media_urls.find((m) => m.type === 'VIDEO') ?? v.media_urls[0]
  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-2">
        <Avatar src={v.author?.avatar_url} name={v.author?.full_name ?? '?'} size={36} />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{v.author?.full_name}</div>
          <div className="text-xs text-textMuted">
            {timeAgo(v.created_at)}
            {v.subject_name && ` · ${v.subject_code ?? ''} ${v.subject_name}`}
          </div>
        </div>
      </div>

      <p className="text-sm whitespace-pre-wrap">{v.content}</p>

      {video && (
        <video
          src={video.url}
          poster={video.thumbnail_url}
          controls
          preload="metadata"
          className="w-full max-h-[420px] rounded-lg bg-black"
        />
      )}

      <div className="flex items-center justify-between text-xs text-textMuted">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1"><ThumbsUp size={13} />{v.react_count}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle size={13} />{v.comment_count}</span>
          {formatDuration(video?.duration) && (
            <span className="inline-flex items-center gap-1"><Clock size={13} />{formatDuration(video.duration)}</span>
          )}
        </span>
        <Link to={`/posts/${v.post_id}`} className="text-primary hover:underline">
          Xem chi tiết
        </Link>
      </div>
    </div>
  )
}

export default function VideosPage() {
  const [subjectId, setSubjectId] = useState<number | undefined>(undefined)

  const subjects = useQuery({ queryKey: ['subjects'], queryFn: subjectApi.all })

  const q = useInfiniteQuery({
    queryKey: ['video-posts', subjectId],
    queryFn: ({ pageParam }) => videoApi.list(subjectId, pageParam, 3),
    initialPageParam: null as string | number | null,
    getNextPageParam: (last) => (last.pagination.has_next ? last.pagination.after : undefined),
  })
  const sentinel = useInfiniteScroll(q)

  const items = q.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <>
      <div className="card flex items-center justify-between gap-3">
        <h1 className="font-semibold">Video bài giảng</h1>
        <select
          className="input !w-auto"
          value={subjectId ?? ''}
          onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Tất cả môn học</option>
          {subjects.data?.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {q.isPending && (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      )}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.isSuccess && items.length === 0 && <EmptyState icon={<Video size={32} />}>Chưa có video bài giảng nào.</EmptyState>}

      {items.map((v) => (
        <VideoCard key={v.post_id} v={v} />
      ))}

      <div ref={sentinel} className="py-2 flex justify-center">
        {q.isFetchingNextPage && <Spinner label="" />}
      </div>
    </>
  )
}
