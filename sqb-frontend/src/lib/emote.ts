// Emote kiểu FB-lite: nhập ký tự đặc biệt (:code: hoặc mặt cười ASCII) -> emoji khi gửi.
// Dùng trong bài viết, bình luận, tin nhắn chat theo đúng spec.

export const EMOTES: { code: string; emoji: string }[] = [
  { code: ':smile:', emoji: '😊' },
  { code: ':joy:', emoji: '😂' },
  { code: ':wink:', emoji: '😉' },
  { code: ':love:', emoji: '😍' },
  { code: ':think:', emoji: '🤔' },
  { code: ':sad:', emoji: '😢' },
  { code: ':cry:', emoji: '😭' },
  { code: ':angry:', emoji: '😠' },
  { code: ':wow:', emoji: '😮' },
  { code: ':like:', emoji: '👍' },
  { code: ':heart:', emoji: '❤️' },
  { code: ':fire:', emoji: '🔥' },
  { code: ':clap:', emoji: '👏' },
  { code: ':party:', emoji: '🎉' },
  { code: ':book:', emoji: '📚' },
  { code: ':star:', emoji: '⭐' },
  { code: ':check:', emoji: '✅' },
  { code: ':x:', emoji: '❌' },
  { code: ':question:', emoji: '❓' },
  { code: ':ok:', emoji: '👌' },
  { code: ':pray:', emoji: '🙏' },
  { code: ':muscle:', emoji: '💪' },
  { code: ':sweat:', emoji: '😅' },
  { code: ':zzz:', emoji: '😴' },
]

const SHORTCUTS: [RegExp, string][] = [
  [/:\)/g, '😊'],
  [/:-\)/g, '😊'],
  [/:\(/g, '😢'],
  [/:-\(/g, '😢'],
  [/:D/g, '😄'],
  [/;-?\)/g, '😉'],
  [/<3/g, '❤️'],
  [/:o\b/gi, '😮'],
]

// Áp dụng khi gửi nội dung: thay :code: + ASCII shortcuts -> emoji
export function applyEmotes(text: string): string {
  let out = text
  for (const { code, emoji } of EMOTES) {
    out = out.split(code).join(emoji)
  }
  for (const [re, emoji] of SHORTCUTS) {
    out = out.replace(re, emoji)
  }
  return out
}

// Chèn emoji vào vị trí con trỏ của textarea, trả về text mới
export function insertAtCursor(el: HTMLTextAreaElement | HTMLInputElement | null, current: string, insert: string): string {
  if (!el) return current + insert
  const start = el.selectionStart ?? current.length
  const end = el.selectionEnd ?? start
  return current.slice(0, start) + insert + current.slice(end)
}
