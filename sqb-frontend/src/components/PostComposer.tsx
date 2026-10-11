import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postApi } from '@/api/endpoints'
import { countWords, LIMITS, validatePostContent } from '@/lib/validation'

export default function PostComposer() {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: () => postApi.create({ content: content.trim(), visibility: 'PUBLIC', post_type: 'SOCIAL_POST' }),
    onSuccess: () => {
      setContent('')
      setError(null)
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['my-posts'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  function submit() {
    const err = validatePostContent(content)
    if (err) return setError(err)
    create.mutate()
  }

  const words = countWords(content)

  return (
    <div className="card space-y-2">
      <textarea
        className="input min-h-[90px] resize-y"
        placeholder="Bạn đang nghĩ gì?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center justify-between text-xs text-textMuted">
        <span className={words > LIMITS.postWords ? 'text-danger' : ''}>
          {words}/{LIMITS.postWords} từ
        </span>
        <button className="btn-primary" onClick={submit} disabled={create.isPending || !content.trim()}>
          {create.isPending ? 'Đang đăng...' : 'Đăng'}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
