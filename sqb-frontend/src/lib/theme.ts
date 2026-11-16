// Quản lý theme light/dark: đọc palette từ theme/colors.js (nguồn mã màu duy nhất),
// gán CSS vars --sqb-* lên :root lúc runtime + persist localStorage.
import { themes } from '@/theme/colors.js'

const KEY = 'sqb-theme'
export type ThemeMode = 'light' | 'dark'

function hexToRgbTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
}

export function getTheme(): ThemeMode {
  const saved = localStorage.getItem(KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode) {
  const palette = themes[mode]
  const root = document.documentElement
  for (const [name, hex] of Object.entries(palette)) {
    root.style.setProperty(`--sqb-${kebab(name)}`, hexToRgbTriplet(hex))
  }
  root.classList.toggle('dark', mode === 'dark')
  localStorage.setItem(KEY, mode)
}

export function toggleTheme(): ThemeMode {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

// Gọi 1 lần trước render để tránh flash màu sai
export function initTheme() {
  applyTheme(getTheme())
}
