import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Send, Trash2, X } from 'lucide-react'
import { commentApi } from '@/api/endpoints'
import type { Comment } from '@/api/types'
import { useAuthStore } from '@/store/auth'
import { applyEmotes } from '@/lib/emote'
import { uploadImages, validateImages } from '@/lib/upload'
import { Avatar, ErrorBox, Spinner, timeAgo } from '@/components/ui'

function CommentRow({
  c,
  mine,
  busy,
  onDelete,
}: {
  c: Comment
  mine: boolean
  busy: boolean
  onDelete: () => void
}) {
  return (
    <div className="flex gap-2">
      <Avatar src={c.author?.avatar_url} name={c.author?.full_name ?? ''} size={26} />
      <div className="flex-1 min-w-0">
        <div className="text-xs">
          <span className="font-semibold">{c.author?.full_name ?? 'Người dùng'}</span>
          <span className="text-textMuted ml-2">{timeAgo(c.created_at)}</span>
        </div>
        <div className="text-sm">
          {c.hidden || !c.content ? <i className="text-textMuted">Bình luận đã bị ẩn</i> : c.content}
        </div>
        {c.media_url && <img src={c.media_url} alt="" className="mt-1 max-h-40 rounded" />}
      </div>
      {mine && (
        <button
          className="btn-ghost !p-1 text-danger self-start"
          onClick={onDelete}
          disabled={busy}
          aria-label="Xoá bình luận"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

// Thread bình luận dùng chung cho QUESTION / SESSION (GET/POST/DELETE /comments)
export default function CommentThread({
  targetType,
  targetId,
}: {
  targetType: 'QUESTION' | 'SESSION'
  targetId: number
}) {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const list = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: () => commentApi.list(targetType, targetId),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['comments', targetType, targetId] })
  const add = useMutation({
    mutationFn: async () => {
      const media_urls = file ? await uploadImages([file], 'COMMENT') : undefined
      return commentApi.create({
        target_type: targetType,
        target_id: targetId,
        content: applyEmotes(text.trim()),
        media_urls,
      })
    },
    onSuccess: () => {
      setText('')
      setFile(null)
      setErr(null)
      invalidate()
    },
    onError: (e: Error) => setErr(e.message),
  })
  const del = useMutation({ mutationFn: (id: number) => commentApi.remove(id), onSuccess: invalidate })
  const items = list.data?.items ?? []

  return (
    <div className="border-t border-border pt-3 space-y-2">
      {list.isPending && <Spinner label="" />}
      {list.isError && <ErrorBox error={list.error} onRetry={() => list.refetch()} />}
      {list.isSuccess && items.length === 0 && <p className="text-xs text-textMuted">Chưa có bình luận nào.</p>}
      {items.map((c) => (
        <div key={c.comment_id} className="space-y-2">
          <CommentRow
            c={c}
            mine={c.author?.user_id === me?.user_id}
            busy={del.isPending}
            onDelete={() => del.mutate(c.comment_id)}
          />
          {c.replies?.map((r) => (
            <div key={r.comment_id} className="ml-8">
              <CommentRow
                c={r}
                mine={r.author?.user_id === me?.user_id}
                busy={del.isPending}
                onDelete={() => del.mutate(r.comment_id)}
              />
            </div>
          ))}
        </div>
      ))}
      {file && (
        <div className="relative inline-block">
          <img src={URL.createObjectURL(file)} alt="" className="h-16 rounded" />
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
            if (msg) setErr(msg)
            else setFile(f)
          }}
        />
        <button className="btn-ghost !p-2 text-textMuted" onClick={() => fileRef.current?.click()} aria-label="Đính kèm ảnh">
          <ImagePlus size={17} />
        </button>
        <input
          className="input !py-1.5 text-sm"
          placeholder="Viết bình luận..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && text.trim() && add.mutate()}
        />
        <button
          className="btn-primary !px-3"
          disabled={!text.trim() || add.isPending}
          onClick={() => add.mutate()}
          aria-label="Gửi"
        >
          <Send size={15} />
        </button>
      </div>
      {err && <p className="error-text">{err}</p>}
    </div>
  )
}
