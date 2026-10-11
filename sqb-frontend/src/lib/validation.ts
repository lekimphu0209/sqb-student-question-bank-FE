import { MESSAGES } from '@/i18n/messages'

// Validate phía client TRƯỚC khi gọi API (yêu cầu phi chức năng)
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@(sis\.)?hust\.edu\.vn$/i
export const PASSWORD_REGEX = /^[A-Za-z0-9]+$/

export const LIMITS = {
  postWords: 500,
  commentWords: 500,
  maxImages: 4,
  maxImageBytes: 4 * 1024 * 1024,
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function validateEmail(email: string): string | null {
  return EMAIL_REGEX.test(email.trim()) ? null : MESSAGES.emailInvalid
}

export function validatePassword(password: string): string | null {
  if (!password) return MESSAGES.passwordRequired
  return PASSWORD_REGEX.test(password) ? null : MESSAGES.passwordInvalid
}

export function validatePostContent(content: string): string | null {
  if (!content.trim()) return MESSAGES.postEmpty
  if (countWords(content) > LIMITS.postWords) return MESSAGES.postTooLong
  return null
}

export function validateComment(content: string): string | null {
  if (!content.trim()) return MESSAGES.postEmpty
  if (countWords(content) > LIMITS.commentWords) return MESSAGES.commentTooLong
  return null
}
