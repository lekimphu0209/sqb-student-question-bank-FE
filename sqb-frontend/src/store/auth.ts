import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '@/lib/queryClient'

export interface AuthUser {
  user_id: number
  username: string
  role: 'ADMIN' | 'LECTURER' | 'STUDENT'
  avatar_url: string
  cover_url: string
  frame_url: string
  verified: boolean
  profile_completed: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  deviceId: string
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string | null) => void
  setTokens: (accessToken: string, refreshToken: string | null) => void
  logout: () => void
}

function makeDeviceId() {
  return `web-${crypto.randomUUID()}`
}

// Dọn cache theo phiên: TanStack Query + feed cache — tránh lộ data user trước khi đổi tài khoản
function clearSessionCaches() {
  queryClient.clear()
  try {
    localStorage.removeItem('sqb-feed-cache')
  } catch {
    // storage bị chặn -> bỏ qua
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      deviceId: makeDeviceId(),
      setAuth: (user, accessToken, refreshToken) => {
        if (get().user?.user_id !== user.user_id) clearSessionCaches()
        set({ user, accessToken, refreshToken })
      },
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => {
        clearSessionCaches()
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    { name: 'sqb-auth' },
  ),
)
