import { QueryClient } from '@tanstack/react-query'

// Tách riêng để auth store import được (tránh vòng lặp import qua main.tsx)
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
})
