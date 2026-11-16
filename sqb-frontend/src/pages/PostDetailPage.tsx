import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { commentApi, postApi } from '@/api/endpoints'
import type { Comment } from '@/api/types'
import PostCard from '@/components/PostCard'
import EmoteButton from '@/components/EmoteButton'
import ReportModal from '@/components/ReportModal'
import { Avatar, EmptyState, ErrorBox, Spinner, timeAgo } from '@/components/ui'
import { validateComment } from '@/lib/validation'
import { applyEmotes, insertAtCursor } from '@/lib/emote'
import { useAuthStore } from '@/store/auth'

function CommentItem({
  c,
  onDelete,
  onReport,
}: {
  c: Comment
  onDelete: (id: number) => void
  onReport: (id: number) => void
}) {
  const me = useAuthStore((s) => s.user)
  if (c.hidden || !c.author) {
    return <div className="text-xs text-textMuted italic pl-12">Bình luận đã bị ẩn</div>
  }
  const mine = me?.user_id === c.author.user_id
  return (
    <div className="flex gap-2 group">
      <Avatar src={c.author.avatar_url} name={c.author.full_name} size={32} />
      <div className="flex-1">
        <div className="bg-bg rounded-2xl px-3 py-2 inline-block">
          <div className="text-sm font-semibold">{c.author.full_name}</div>
          <div className="text-sm whitespace-pre-wrap">{c.content}</div>
          {c.media_url && <img src={c.media_url} alt="" className="mt-1 max-h-48 rounded" />}
        </div>
        <div className="text-xs text-textMuted pl-3 mt-0.5 flex items-center gap-2">
          {timeAgo(c.created_at)}
          {mine ? (
            // Chủ bình luận được xoá comment của mình (chủ bài viết KHÔNG được xoá)
            <button className="hover:underline text-danger opacity-0 group-hover:opacity-100" onClick={() => onDelete(c.comment_id)}>
              Xoá
            </button>
          ) : (
            <button className="hover:underline opacity-0 group-hover:opacity-100" onClick={() => onReport(c.comment_id)}>
              Báo cáo
            </button>
          )}
        </div>
        {c.replies?.length ? (
          <div className="mt-2 space-y-2 pl-4 border-l border-border">
            {c.replies.map((r) => (
              <CommentItem key={r.comment_id} c={r} onDelete={onDelete} onReport={onReport} />
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
  const [reportId, setReportId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const post = useQuery({ queryKey: ['post', postId], queryFn: () => postApi.byId(postId) })
  const comments = useQuery({
    queryKey: ['comments', 'POST', postId],
    queryFn: () => commentApi.list('POST', postId),
  })

  const del = useMutation({
    mutationFn: (id: number) => commentApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', 'POST', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
    },
    onError: (e: Error) => setError(e.message),
  })

  const add = useMutation({
    mutationFn: () => commentApi.create({ target_type: 'POST', target_id: postId, content: applyEmotes(text.trim()) }),
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
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            className="input"
            placeholder="Viết bình luận... (gõ :) hoặc :smile: để chèn cảm xúc)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <EmoteButton onPick={(emoji) => { setText((t) => insertAtCursor(inputRef.current, t, emoji)); inputRef.current?.focus() }} />
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
            <CommentItem key={c.comment_id} c={c} onDelete={(id) => del.mutate(id)} onReport={setReportId} />
          ))}
        </div>
      </div>
      {reportId !== null && (
        <ReportModal open onClose={() => setReportId(null)} targetType="COMMENT" targetId={reportId} />
      )}
    </>
  )
}
