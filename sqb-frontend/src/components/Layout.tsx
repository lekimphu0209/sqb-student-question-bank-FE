import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { authApi, notiApi, gameApi } from '@/api/endpoints'
import { getTheme, toggleTheme } from '@/lib/theme'
import { Avatar } from './ui'

// Điều hướng sidebar trái — hiển thị theo role
const NAV_COMMON = [
  { to: '/', label: 'Trang chủ', icon: '🏠' },
  { to: '/search', label: 'Tìm kiếm', icon: '🔍' },
  { to: '/friends', label: 'Bạn bè', icon: '👥' },
  { to: '/messages', label: 'Tin nhắn', icon: '💬' },
  { to: '/videos', label: 'Video bài giảng', icon: '🎬' },
  { to: '/questions/propose', label: 'Đề xuất câu hỏi', icon: '✍️' },
  { to: '/questions/my-submissions', label: 'Phiên của tôi', icon: '📚' },
  { to: '/games', label: 'Minigame & BXH', icon: '🎮' },
]
const NAV_LECTURER = [
  { to: '/lecturer/review', label: 'Duyệt câu hỏi', icon: '✅' },
  { to: '/lecturer/exams', label: 'Đề thi', icon: '📝' },
]
const NAV_SETTINGS = [
  { to: '/settings/blocked', label: 'Đã chặn', icon: '🚫' },
  { to: '/settings/push', label: 'Thông báo đẩy', icon: '🔔' },
  { to: '/settings/devices', label: 'Thiết bị', icon: '📱' },
]
// Mục chính trên thanh nav mobile (phần còn lại nằm trong drawer "Menu")
const NAV_MOBILE = [
  { to: '/', label: 'Trang chủ', icon: '🏠' },
  { to: '/search', label: 'Tìm kiếm', icon: '🔍' },
  { to: '/friends', label: 'Bạn bè', icon: '👥' },
  { to: '/messages', label: 'Tin nhắn', icon: '💬' },
]

function LeaderboardWidget() {
  const q = useQuery({ queryKey: ['leaderboard', 'SEMESTER'], queryFn: () => gameApi.leaderboard('SEMESTER', undefined, null, 5) })
  if (q.isPending) return <div className="card text-sm text-textMuted">Đang tải BXH...</div>
  if (q.isError || !q.data) return null
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Bảng xếp hạng</h3>
        <Link to="/games" className="text-xs text-primary hover:underline">Xem tất cả</Link>
      </div>
      {q.data.entries.slice(0, 5).map((e) => (
        <Link
          to={`/users/${e.user_id}`}
          key={e.user_id}
          className={`flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-bg ${e.is_current_user ? 'bg-primary/10' : ''}`}
        >
          <span className="w-5 text-center text-xs font-bold text-textMuted">{e.rank}</span>
          <Avatar src={e.avatar_url} name={e.full_name} size={28} />
          <span className="flex-1 truncate text-sm">{e.full_name}</span>
          <span className="text-xs font-semibold text-primary">{e.total_points}</span>
        </Link>
      ))}
    </div>
  )
}

function CheckInWidget() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['checkin'], queryFn: gameApi.checkInStatus })
  const checkIn = useMutation({
    mutationFn: gameApi.checkIn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkin'] }),
  })
  if (q.isPending || q.isError || !q.data) return null
  return (
    <div className="card space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Điểm danh</h3>
        <span className="text-xs text-textMuted">Chuỗi {q.data.current_streak} ngày</span>
      </div>
      {q.data.has_checked_in_today ? (
        <p className="text-success text-sm">✓ Đã điểm danh hôm nay</p>
      ) : (
        <button className="btn-primary w-full" onClick={() => checkIn.mutate()} disabled={checkIn.isPending}>
          {checkIn.isPending ? 'Đang điểm danh...' : 'Điểm danh nhận xu'}
        </button>
      )}
      {checkIn.isSuccess && <p className="text-xs text-success">+{checkIn.data.coin_earned} xu</p>}
    </div>
  )
}

export default function Layout() {
  const { user, refreshToken, deviceId, logout } = useAuthStore()
  const navigate = useNavigate()
  const [kw, setKw] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(getTheme() === 'dark')

  // Badge thông báo chưa đọc (poll 30s)
  const noti = useQuery({
    queryKey: ['noti-unread'],
    queryFn: () => notiApi.list(null, 1),
    refetchInterval: 30_000,
  })
  const unread = noti.data?.unread_count ?? 0

  const navItems = [...NAV_COMMON, ...(user?.role === 'LECTURER' ? NAV_LECTURER : []), ...NAV_SETTINGS]

  async function onLogout() {
    try {
      await authApi.logout(refreshToken, deviceId)
    } catch {
      // vẫn đăng xuất phía client
    }
    logout()
    navigate('/login')
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = kw.trim()
    if (q) navigate(`/search?query=${encodeURIComponent(q)}`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
          <NavLink to="/" className="text-primary font-bold text-xl shrink-0">
            SQB
          </NavLink>
          <form onSubmit={onSearch} className="hidden sm:block w-64">
            <input
              className="input !rounded-full !py-1.5"
              placeholder="Tìm kiếm bài viết, người dùng, câu hỏi..."
              value={kw}
              onChange={(e) => setKw(e.target.value)}
            />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="btn-ghost"
              aria-label="Chuyển chế độ sáng/tối"
              title={dark ? 'Chế độ sáng' : 'Chế độ tối'}
              onClick={() => setDark(toggleTheme() === 'dark')}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <Link to="/messages" className="btn-ghost relative" aria-label="Tin nhắn">
              💬
            </Link>
            <Link to="/notifications" className="btn-ghost relative" aria-label="Thông báo">
              🔔
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <Link to="/me" className="ml-1" aria-label="Trang cá nhân">
              <Avatar src={user?.avatar_url} name={user?.username ?? '?'} size={36} />
            </Link>
            <button className="btn-ghost text-sm" onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Layout 3 cột */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[240px_1fr_300px] gap-6">
        {/* Sidebar trái */}
        <aside className="hidden lg:block">
          <nav className="sticky top-20 space-y-1">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-bg'
                  }`
                }
              >
                <span className="w-6 text-center">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Nội dung chính */}
        <main className="mx-auto w-full max-w-2xl space-y-4 min-w-0">
          <Outlet />
        </main>

        {/* Cột phải */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-4">
            <CheckInWidget />
            <LeaderboardWidget />
          </div>
        </aside>
      </div>

      {/* Bottom nav mobile (<lg) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-surface border-t border-border flex">
        {NAV_MOBILE.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-1.5 text-[10px] ${isActive ? 'text-primary' : 'text-textMuted'}`
            }
          >
            <span className="text-lg leading-tight">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <button
          className="flex-1 flex flex-col items-center py-1.5 text-[10px] text-textMuted"
          onClick={() => setMenuOpen(true)}
        >
          <span className="text-lg leading-tight">☰</span>
          Menu
        </button>
      </nav>

      {/* Drawer menu mobile chứa các mục còn lại */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-surface p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">Menu</span>
              <button className="btn-ghost px-2" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <nav className="space-y-1" onClick={() => setMenuOpen(false)}>
              {navItems.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-bg'
                    }`
                  }
                >
                  <span className="w-6 text-center">{n.icon}</span>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

