import { useEffect, useRef } from 'react'

// Sentinel đáy danh sách: tự fetch trang kế khi scroll tới (thay nút "Tải thêm").
// Dùng: const sentinel = useInfiniteScroll(q) -> <div ref={sentinel} />
export function useInfiniteScroll<T extends { hasNextPage?: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown }>(
  query: T,
) {
  const ref = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '300px' },
    )
    ob.observe(el)
    return () => ob.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  return ref
}
