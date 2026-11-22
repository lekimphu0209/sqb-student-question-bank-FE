import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { EMOTES } from '@/lib/emote'

// Nút 😊 mở popover chọn emote; gọi onPick(emoji) — caller chèn vào vị trí con trỏ.
export default function EmoteButton({ onPick }: { onPick: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="btn-ghost px-2"
        aria-label="Chèn biểu cảm"
        title="Chèn biểu cảm (hoặc gõ :code:, :) ...)"
        onClick={() => setOpen((o) => !o)}
      >
        <Smile size={20} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-20 card !p-2 w-64 grid grid-cols-8 gap-0.5 shadow-lg">
          {EMOTES.map((e) => (
            <button
              key={e.code}
              type="button"
              title={e.code}
              className="text-lg rounded hover:bg-bg p-1"
              onClick={() => {
                onPick(e.emoji)
                setOpen(false)
              }}
            >
              {e.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
