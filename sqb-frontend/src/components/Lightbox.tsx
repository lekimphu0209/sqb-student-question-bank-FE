import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

// Lightbox xem ảnh kiểu FB: overlay tối, ảnh giữa màn hình, mũi tên chuyển ảnh, ✕/ESC đóng.
export default function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: string[]
  index: number
  onClose: () => void
  onNavigate: (i: number) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNavigate(Math.min(index + 1, images.length - 1))
      if (e.key === 'ArrowLeft') onNavigate(Math.max(index - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, images.length, onClose, onNavigate])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button
        className="absolute top-4 right-4 text-white text-2xl w-10 h-10 rounded-full hover:bg-white/10"
        onClick={onClose}
        aria-label="Đóng"
      >
        <X size={22} className="mx-auto" />
      </button>
      {index > 0 && (
        <button
          className="absolute left-4 text-white text-3xl w-12 h-12 rounded-full hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index - 1)
          }}
          aria-label="Ảnh trước"
        >
          <ChevronLeft size={30} className="mx-auto" />
        </button>
      )}
      <img
        src={images[index]}
        alt=""
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {index < images.length - 1 && (
        <button
          className="absolute right-4 text-white text-3xl w-12 h-12 rounded-full hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation()
            onNavigate(index + 1)
          }}
          aria-label="Ảnh sau"
        >
          <ChevronRight size={30} className="mx-auto" />
        </button>
      )}
      <span className="absolute bottom-4 text-white/70 text-sm">
        {index + 1} / {images.length}
      </span>
    </div>
  )
}
