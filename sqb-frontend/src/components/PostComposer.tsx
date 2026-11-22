import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '@/api/endpoints'
import { countWords, LIMITS, validatePostContent } from '@/lib/validation'
import { uploadImages, validateImages } from '@/lib/upload'
import { applyEmotes, insertAtCursor } from '@/lib/emote'
import EmoteButton from './EmoteButton'
import { ImagePlus, X } from 'lucide-react'

export default function PostComposer() {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: async () => {
      // Upload ảnh trước (presign -> PUT R2 -> verify), fallback /medias/upload
      const media_urls = files.length ? await uploadImages(files, 'POST') : undefined
      return postApi.create({ content: applyEmotes(content.trim()), media_urls, visibility: 'PUBLIC', post_type: 'SOCIAL_POST' })
    },
    onSuccess: () => {
      setContent('')
      setFiles([])
      setError(null)
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['my-posts'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  function onPickImages(list: FileList | null) {
    if (!list) return
    const next = [...files, ...Array.from(list)].slice(0, LIMITS.maxImages)
    const err = validateImages(next)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setFiles(next)
  }

  function submit() {
    const err = validatePostContent(content)
    if (err) return setError(err)
    create.mutate()
  }

  const words = countWords(content)

  return (
    <div className="card space-y-2">
      <textarea
        ref={textRef}
        className="input min-h-[90px] resize-y"
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-1">
          {files.map((f, i) => (
            <div key={i} className="relative group">
              <img
                src={URL.createObjectURL(f)}
                alt={f.name}
                className="aspect-square w-full rounded-md object-cover bg-bg"
              />
              <button
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100"
                onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))}
                aria-label="Xoá ảnh"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-textMuted">
        <div className="flex items-center gap-3">
          <span className={words > LIMITS.postWords ? 'text-danger' : ''}>
            {words}/{LIMITS.postWords} từ
          </span>
          <button className="btn-ghost px-2" onClick={() => fileRef.current?.click()} disabled={files.length >= LIMITS.maxImages}>
            <ImagePlus size={16} className="mr-1" />Ảnh ({files.length}/{LIMITS.maxImages})
          </button>
          <EmoteButton onPick={(emoji) => { setContent((t) => insertAtCursor(textRef.current, t, emoji)); textRef.current?.focus() }} />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              onPickImages(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
        <button className="btn-primary" onClick={submit} disabled={create.isPending || !content.trim()}>
          {create.isPending ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
