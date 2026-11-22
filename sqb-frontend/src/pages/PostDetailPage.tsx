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
import { uploadImages, validateImages } from '@/lib/upload'
import { useAuthStore } from '@/store/auth'
import { ImagePlus, X } from 'lucide-react'

function CommentItem({
  c,
  onDelete,
  onReport,
  onEdit,
  onReply,
}: {
  c: Comment
  onDelete: (id: number) => void
  onReport: (id: number) => void
  onEdit: (id: number, content: string) => void
  onReply: (id: number, content: string) => void
}) {
  const me = useAuthStore((s) => s.user)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(c.content ?? '')
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')

  if (c.hidden || !c.author) {
    return <div className="text-xs text-textMuted italic pl-12">Bình luận đã bị ẩn</div>
  }
  const mine = me?.user_id === c.author.user_id

  function saveEdit() {
    const content = applyEmotes(editText.trim())
    if (!content) return
    onEdit(c.comment_id, content)
    setEditing(false)
  }

  function sendReply() {
    const content = applyEmotes(replyText.trim())
    if (!content) return
    onReply(c.comment_id, content)
    setReplyText('')
    setReplyOpen(false)
  }

  return (
    <div className="flex gap-2 group">
      <Avatar src={c.author.avatar_url} name={c.author.full_name} size={32} />
      <div className="flex-1">
        <div className="bg-bg rounded-2xl px-3 py-2 inline-block">
          <div className="text-sm font-semibold">{c.author.full_name}</div>
          {editing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                className="input !py-1 text-sm"
                value={editText}
                autoFocus
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit()
                  if (e.key === 'Escape') setEditing(false)
                }}
              />
              <button className="btn-primary !py-1 !px-2 text-xs" onClick={saveEdit}>Lưu</button>
              <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => setEditing(false)}>Huỷ</button>
            </div>
          ) : (
            <div className="text-sm whitespace-pre-wrap">{c.content}</div>
          )}
          {c.media_url && <img src={c.media_url} alt="" className="mt-1 max-h-48 rounded" />}
        </div>
        <div className="text-xs text-textMuted pl-3 mt-0.5 flex items-center gap-2">
          {timeAgo(c.created_at)}
          <button className="hover:underline opacity-0 group-hover:opacity-100" onClick={() => setReplyOpen((o) => !o)}>
            Trả lời
          </button>
          {mine ? (
            <>
              <button className="hover:underline opacity-0 group-hover:opacity-100" onClick={() => { setEditing(true); setEditText(c.content ?? '') }}>
                Sửa
              </button>
              {/* Chủ bình luận được xoá comment của mình (chủ bài viết KHÔNG được xoá) */}
              <button className="hover:underline text-danger opacity-0 group-hover:opacity-100" onClick={() => onDelete(c.comment_id)}>
                Xoá
              </button>
            </>
          ) : (
            <button className="hover:underline opacity-0 group-hover:opacity-100" onClick={() => onReport(c.comment_id)}>
              Báo cáo
            </button>
          )}
        </div>
        {replyOpen && (
          <div className="flex gap-2 mt-2">
            <input
              className="input !py-1 text-sm"
              placeholder={`Trả lời ${c.author.full_name}...`}
              value={replyText}
              autoFocus
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendReply()
                if (e.key === 'Escape') setReplyOpen(false)
              }}
            />
            <button className="btn-primary !py-1 !px-3 text-xs" onClick={sendReply} disabled={!replyText.trim()}>
              Gửi
            </button>
          </div>
        )}
        {c.replies?.length ? (
          <div className="mt-2 space-y-2 pl-4 border-l border-border">
            {c.replies.map((r) => (
              <CommentItem key={r.comment_id} c={r} onDelete={onDelete} onReport={onReport} onEdit={onEdit} onReply={onReply} />
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
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportId, setReportId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['comments', 'POST', postId] })
    qc.invalidateQueries({ queryKey: ['post', postId] })
  }

  const add = useMutation({
    mutationFn: async () => {
      const media_urls = file ? await uploadImages([file], 'COMMENT') : undefined
      return commentApi.create({
        target_type: 'POST',
        target_id: postId,
        content: applyEmotes(text.trim()),
        media_urls,
      })
    },
    onSuccess: () => {
      setText('')
      setFile(null)
      setError(null)
      invalidate()
    },
    onError: (e: Error) => setError(e.message),
  })

  const reply = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      commentApi.create({ target_type: 'POST', target_id: postId, content, parent_comment_id: id }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  })

  const edit = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => commentApi.update(id, { content }),
    onSuccess: invalidate,
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
        {file && (
          <div className="relative inline-block">
            <img src={URL.createObjectURL(file)} alt="" className="h-20 rounded" />
            <button
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface border border-border text-textMuted flex items-center justify-center"
              onClick={() => setFile(null)}
              aria-label="Bỏ ảnh"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const msg = validateImages([f], 1)
              if (msg) setError(msg)
              else setFile(f)
            }}
          />
          <button className="btn-ghost !p-2 text-textMuted" onClick={() => fileRef.current?.click()} aria-label="Đính kèm ảnh">
            <ImagePlus size={18} />
          </button>
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
            <CommentItem
              key={c.comment_id}
              c={c}
              onDelete={(id) => del.mutate(id)}
              onReport={setReportId}
              onEdit={(id, content) => edit.mutate({ id, content })}
              onReply={(id, content) => reply.mutate({ id, content })}
            />
          ))}
        </div>
      </div>
      {reportId !== null && (
        <ReportModal open onClose={() => setReportId(null)} targetType="COMMENT" targetId={reportId} />
      )}
    </>
  )
}
