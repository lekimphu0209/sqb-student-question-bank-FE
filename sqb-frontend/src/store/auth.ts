import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  logout: () => void
}

function makeDeviceId() {
  return `web-${crypto.randomUUID()}`
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      deviceId: makeDeviceId(),
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'sqb-auth' },
  ),
)
