import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post } from '@/api/types'
import { reactApi } from '@/api/endpoints'
import { Avatar, timeAgo } from './ui'

const COLLAPSE_CHARS = 300

export default function PostCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(post.reacted_by_me)
  const [count, setCount] = useState(post.react_count)
  const qc = useQueryClient()

  const like = useMutation({
    mutationFn: () => reactApi.toggle('POST', post.post_id, liked ? 'NONE' : 'LIKE'),
    onMutate: () => {
      setLiked(!liked)
      setCount((c) => c + (liked ? -1 : 1))
    },
    onError: () => {
      setLiked(liked)
      setCount(post.react_count)
    },
    onSuccess: (d) => {
      setCount(d.total_count)
      qc.invalidateQueries({ queryKey: ['post', post.post_id] })
    },
  })

  const long = post.content.length > COLLAPSE_CHARS
  const text = long && !expanded ? post.content.slice(0, COLLAPSE_CHARS) + '…' : post.content

  return (
    <article className="card space-y-3">
      <header className="flex items-center gap-3">
        <Avatar src={post.author?.avatar_url} name={post.author?.full_name ?? '?'} />
        <div className="leading-tight">
          <Link to={`/users/${post.author?.id}`} className="font-semibold hover:underline">
            {post.author?.full_name}
          </Link>
          <div className="text-xs text-textMuted">
            {timeAgo(post.created_at)}
            {post.is_edited && ' · Đã chỉnh sửa'}
            {post.subject_name && ` · ${post.subject_name}`}
          </div>
        </div>
      </header>

      <p className="whitespace-pre-wrap text-[15px]">
        {text}
        {long && !expanded && (
          <button className="text-textMuted font-medium ml-1 hover:underline" onClick={() => setExpanded(true)}>
            Xem thêm
          </button>
        )}
      </p>

      {post.media_urls?.length > 0 && (
        <div className={`grid gap-1 ${post.media_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media_urls.slice(0, 4).map((u, i) => (
            <img key={i} src={u} alt="" className="w-full aspect-square object-cover rounded-md bg-bg" />
          ))}
        </div>
      )}

      <footer className="flex items-center justify-between text-sm text-textMuted border-t border-border pt-2">
        <span>{count} lượt thích</span>
        <div className="flex gap-1">
          <button
            className={`btn-ghost ${liked ? 'text-like font-semibold' : ''}`}
            onClick={() => like.mutate()}
            disabled={like.isPending}
          >
            👍 Thích
          </button>
          <Link to={`/posts/${post.post_id}`} className="btn-ghost">
            💬 {post.comment_count} bình luận
          </Link>
        </div>
      </footer>
    </article>
  )
}
