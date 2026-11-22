import { colors } from './src/theme/colors.js'

// hex '#RRGGBB' -> 'R G B' để nhúng làm fallback trong rgb(var(--sqb-*, fallback))
const rgbTriplet = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
// Mỗi token -> CSS var --sqb-*; lib/theme.ts ghi đè var lúc runtime khi đổi theme
const themeColors = Object.fromEntries(
  Object.entries(colors).map(([name, hex]) => [
    name,
    `rgb(var(--sqb-${kebab(name)}, ${rgbTriplet(hex)}) / <alpha-value>)`,
  ]),
)

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: themeColors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
