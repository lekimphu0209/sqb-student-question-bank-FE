import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { validateEmail, validatePassword } from '@/lib/validation'
import { MESSAGES } from '@/i18n/messages'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)
  const { deviceId, setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    // 1. Validate client trước
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    if (emailErr || passErr) {
      setErrors({ email: emailErr ?? undefined, password: passErr ?? undefined })
      return
    }
    // 2. Kiểm tra mạng
    if (!navigator.onLine) {
      setErrors({ form: MESSAGES.connectionError })
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const data = await authApi.login({
        email: email.trim(),
        password,
        device_id: deviceId,
        platform: 'WEB',
        device_name: navigator.userAgent.slice(0, 60),
        app_version: '0.1.0',
      })
      const { access_token, refresh_token, ...user } = data
      setAuth(user, access_token, refresh_token)
      navigate('/')
    } catch (err) {
      const msg = err instanceof ApiError && err.code === '9990' ? MESSAGES.loginFailed : (err as Error).message
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary">SQB</h1>
          <p className="text-textMuted text-sm mt-1">Mạng xã hội ngân hàng câu hỏi sinh viên</p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">
              Email trường
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              placeholder="ten.mssv@sis.hust.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          {errors.form && <p className="error-text">{errors.form}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
