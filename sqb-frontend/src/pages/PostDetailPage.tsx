import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentApi, postApi } from '@/api/endpoints'
import type { Comment } from '@/api/types'
import PostCard from '@/components/PostCard'
import { Avatar, EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'
import { validateComment } from '@/lib/validation'

function CommentItem({ c }: { c: Comment }) {
  if (c.hidden || !c.author) {
    return <div className="text-xs text-textMuted italic pl-12">Bình luận đã bị ẩn</div>
  }
  return (
    <div className="flex gap-2">
      <Avatar src={c.author.avatar_url} name={c.author.full_name} size={32} />
      <div className="flex-1">
        <div className="bg-bg rounded-2xl px-3 py-2 inline-block">
          <div className="text-sm font-semibold">{c.author.full_name}</div>
          <div className="text-sm whitespace-pre-wrap">{c.content}</div>
          {c.media_url && <img src={c.media_url} alt="" className="mt-1 max-h-48 rounded" />}
        </div>
        <div className="text-xs text-textMuted pl-3 mt-0.5">{timeAgo(c.created_at)}</div>
        {c.replies?.length ? (
          <div className="mt-2 space-y-2 pl-4 border-l border-border">
            {c.replies.map((r) => (
              <CommentItem key={r.comment_id} c={r} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function PostDetailPage() {
  const { id = '' } = useParams()
  const postId = Number(id)
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const post = useQuery({ queryKey: ['post', postId], queryFn: () => postApi.byId(postId) })
  const comments = useQuery({
    queryKey: ['comments', 'POST', postId],
    queryFn: () => commentApi.list('POST', postId),
  })

  const add = useMutation({
    mutationFn: () => commentApi.create({ target_type: 'POST', target_id: postId, content: text.trim() }),
    onSuccess: () => {
      setText('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['comments', 'POST', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: (e: Error) => setError(e.message),
  })

  function submit() {
    const err = validateComment(text)
    if (err) return setError(err)
    add.mutate()
  }

  if (post.isPending) return <Spinner />
  if (post.isError) return <ErrorBox error={post.error} onRetry={() => post.refetch()} />

  return (
    <>
      <PostCard post={post.data} />

      <div className="card space-y-4">
        <h2 className="font-semibold">Bình luận</h2>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Viết bình luận..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn-primary" onClick={submit} disabled={add.isPending || !text.trim()}>
            Gửi
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}

        {comments.isPending && <Spinner />}
        {comments.isError && <ErrorBox error={comments.error} onRetry={() => comments.refetch()} />}
        {comments.isSuccess && comments.data.items.length === 0 && <EmptyState>Chưa có bình luận nào.</EmptyState>}
        <div className="space-y-3">
          {comments.data?.items.map((c) => (
            <CommentItem key={c.comment_id} c={c} />
          ))}
        </div>
      </div>
    </>
  )
}
