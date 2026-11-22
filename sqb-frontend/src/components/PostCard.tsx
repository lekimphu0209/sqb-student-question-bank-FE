import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Post } from '@/api/types'
import { postApi, reactApi } from '@/api/endpoints'
import { useAuthStore } from '@/store/auth'
import { countWords, LIMITS, validatePostContent } from '@/lib/validation'
import { Avatar, Modal, timeAgo } from './ui'
import ReportModal from './ReportModal'
import Lightbox from './Lightbox'
import { Flag, MessageCircle, MoreHorizontal, Pencil, ThumbsUp, Trash2 } from 'lucide-react'

const COLLAPSE_CHARS = 300

export default function PostCard({ post }: { post: Post }) {
  const me = useAuthStore((s) => s.user)
  const isOwner = me?.user_id === post.author?.user_id
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(post.reacted_by_me)
  const [count, setCount] = useState(post.react_count)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(post.content)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [editErr, setEditErr] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const invalidatePosts = () => {
    qc.invalidateQueries({ queryKey: ['feed'] })
    qc.invalidateQueries({ queryKey: ['my-posts'] })
    qc.invalidateQueries({ queryKey: ['post', post.post_id] })
  }

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

  const update = useMutation({
    mutationFn: () => postApi.update(post.post_id, { content: editText.trim() }),
    onSuccess: () => {
      setEditing(false)
      setEditErr(null)
      invalidatePosts()
    },
    onError: (e: Error) => setEditErr(e.message),
  })

  const remove = useMutation({
    mutationFn: () => postApi.remove(post.post_id),
    onSuccess: () => {
      setDeleteOpen(false)
      invalidatePosts()
    },
  })

  function saveEdit() {
    const err = validatePostContent(editText)
    if (err) return setEditErr(err)
    update.mutate()
  }

  const long = post.content.length > COLLAPSE_CHARS
  const text = long && !expanded ? post.content.slice(0, COLLAPSE_CHARS) + '…' : post.content

  return (
    <article className="card space-y-3">
      <header className="flex items-start gap-3">
        <Avatar src={post.author?.avatar_url} name={post.author?.full_name ?? '?'} />
        <div className="leading-tight flex-1">
          <Link to={`/users/${post.author?.user_id}`} className="font-semibold hover:underline">
            {post.author?.full_name}
          </Link>
          <div className="text-xs text-textMuted">
            {timeAgo(post.created_at)}
            {post.is_edited && ' · Đã chỉnh sửa'}
            {post.subject_name && ` · ${post.subject_name}`}
          </div>
        </div>

        {/* Menu ⋯ */}
        <div ref={menuRef} className="relative">
          <button className="btn-ghost px-2" onClick={() => setMenuOpen((o) => !o)} aria-label="Tuỳ chọn bài viết">
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 card !p-1 w-44 shadow-lg">
              {isOwner ? (
                <>
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-bg"
                    onClick={() => {
                      setMenuOpen(false)
                      setEditText(post.content)
                      setEditing(true)
                    }}
                  >
                    <Pencil size={15} className="inline mr-2 -mt-0.5" />Chỉnh sửa
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-bg text-danger"
                    onClick={() => {
                      setMenuOpen(false)
                      setDeleteOpen(true)
                    }}
                  >
                    <Trash2 size={15} className="inline mr-2 -mt-0.5" />Xoá bài viết
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-bg"
                  onClick={() => {
                    setMenuOpen(false)
                    setReportOpen(true)
                  }}
                >
                  <Flag size={15} className="inline mr-2 -mt-0.5" />Báo cáo bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {editing ? (
        <div className="space-y-2">
          <textarea
            className="input min-h-[90px] resize-y"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <span className={`text-xs ${countWords(editText) > LIMITS.postWords ? 'text-danger' : 'text-textMuted'}`}>
              {countWords(editText)}/{LIMITS.postWords} từ
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setEditing(false)}>Huỷ</button>
              <button className="btn-primary" onClick={saveEdit} disabled={update.isPending}>
                {update.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
          {editErr && <p className="error-text">{editErr}</p>}
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[15px]">
          {text}
          {long && !expanded && (
            <button className="text-textMuted font-medium ml-1 hover:underline" onClick={() => setExpanded(true)}>
              Xem thêm
            </button>
          )}
        </p>
      )}

      {post.media_urls?.length > 0 && (
        <div className={`grid gap-1 ${post.media_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media_urls.slice(0, 4).map((u, i) => (
            <img
              key={i}
              src={u}
              alt=""
              className="w-full aspect-square object-cover rounded-md bg-bg cursor-pointer hover:opacity-90"
              onClick={() => setLightbox(i)}
            />
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
            <ThumbsUp size={16} className={`mr-1.5 ${liked ? 'fill-current' : ''}`} />
            Thích
          </button>
          <Link to={`/posts/${post.post_id}`} className="btn-ghost">
            <MessageCircle size={16} className="mr-1.5" />
            {post.comment_count} bình luận
          </Link>
        </div>
      </footer>

      {/* Xác nhận xoá */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Xoá bài viết?">
        <p className="text-sm text-textMuted">Bài viết sẽ bị xoá vĩnh viễn, không thể khôi phục.</p>
        {remove.isError && <p className="error-text">{(remove.error as Error).message}</p>}
        <div className="flex gap-2">
          <button className="btn-ghost flex-1" onClick={() => setDeleteOpen(false)}>Huỷ</button>
          <button
            className="btn-primary flex-1 !bg-danger"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </Modal>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} targetType="POST" targetId={post.post_id} />
      {lightbox !== null && (
        <Lightbox images={post.media_urls} index={lightbox} onClose={() => setLightbox(null)} onNavigate={setLightbox} />
      )}
    </article>
  )
}
