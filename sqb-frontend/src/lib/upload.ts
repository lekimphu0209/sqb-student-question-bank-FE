import { mediaApi } from '@/api/endpoints'
import type { MediaPurpose } from '@/api/types'
import { MESSAGES } from '@/i18n/messages'
import { LIMITS } from './validation'

// Validate file ảnh phía client TRƯỚC khi upload (rule: ≤4 ảnh, ≤4MB, không gif)
export function validateImages(files: File[], max = LIMITS.maxImages): string | null {
  if (files.length > max) return MESSAGES.tooManyImages
  for (const f of files) {
    if (!f.type.startsWith('image/')) return MESSAGES.imageOnly
    if (f.type === 'image/gif') return MESSAGES.gifNotAllowed
    if (f.size > LIMITS.maxImageBytes) return MESSAGES.imageTooLarge
  }
  return null
}

// Flow backend thực tế: POST /medias/presign -> PUT từng file lên R2 -> POST /medias/verify
// Fallback: POST /medias/upload trực tiếp qua backend khi presign lỗi.
export async function uploadImages(files: File[], purpose: MediaPurpose = 'POST'): Promise<string[]> {
  if (files.length === 0) return []
  try {
    const { presigned_urls } = await mediaApi.presign(
      files.map((f) => ({ file_name: f.name, file_size: f.size, content_type: f.type, purpose })),
    )
    const publicUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const p = presigned_urls[i]
      const r = await fetch(p.upload_url, {
        method: 'PUT',
        body: files[i],
        headers: { 'Content-Type': files[i].type },
      })
      if (!r.ok) throw new Error(MESSAGES.uploadFailed)
      publicUrls.push(p.public_url)
    }
    const v = await mediaApi.verify(publicUrls)
    if (v.missing_urls?.length) throw new Error(MESSAGES.uploadFailed)
    return publicUrls
  } catch (e) {
    // Fallback: upload trực tiếp qua backend
    try {
      const urls: string[] = []
      for (const f of files) {
        const r = await mediaApi.uploadDirect(f, purpose)
        urls.push(r.url)
      }
      return urls
    } catch {
      throw e instanceof Error ? e : new Error(MESSAGES.uploadFailed)
    }
  }
}
