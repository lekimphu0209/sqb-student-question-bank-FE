import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/endpoints'

const NAV = [
  { to: '/', label: 'Trang chủ' },
  { to: '/questions/propose', label: 'Đề xuất câu hỏi' },
  { to: '/questions/my-submissions', label: 'Câu hỏi của tôi' },
  { to: '/me', label: 'Trang cá nhân' },
]

export default function Layout() {
  const { user, refreshToken, deviceId, logout } = useAuthStore()
  const navigate = useNavigate()

  async function onLogout() {
    try {
      await authApi.logout(refreshToken, deviceId)
    } catch {
      // vẫn đăng xuất phía client
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <NavLink to="/" className="text-primary font-bold text-xl">
            SQB
          </NavLink>
          <nav className="flex gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-textMuted hover:bg-bg'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-textMuted hidden sm:inline">{user?.username}</span>
            <button className="btn-ghost" onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <Outlet />
      </main>
    </div>
  )
}
