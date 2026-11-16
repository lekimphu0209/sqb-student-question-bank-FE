import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth'
import { MESSAGES } from '@/i18n/messages'

// Backend thực tế: snake_case, envelope { code, message, data }, success code = "1000"
export interface Envelope<T> {
  code: string
  message: string
  data: T
}

export class ApiError extends Error {
  code: string
  status?: number
  data?: unknown
  constructor(code: string, message: string, status?: number, data?: unknown) {
    super(message)
    this.code = code
    this.status = status
    this.data = data
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ---- Auto refresh token (single-flight) ----
// Rule: 401 / code 9998 (TOKEN_INVALID_OR_EXPIRED) -> gọi /auth/refresh 1 lần -> retry request.
// Refresh thất bại -> logout, điều hướng về /login.
let refreshing: Promise<string> | null = null

function doRefresh(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) throw new ApiError('9998', MESSAGES.sessionExpired)
      try {
        const res = await axios.post<Envelope<{ access_token: string; refresh_token: string }>>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 15000 },
        )
        const d = res.data
        if (!d || d.code !== '1000' || !d.data?.access_token) {
          throw new ApiError(d?.code ?? 'CLIENT_BAD_FORMAT', d?.message ?? MESSAGES.sessionExpired, res.status)
        }
        useAuthStore.getState().setTokens(d.data.access_token, d.data.refresh_token ?? refreshToken)
        return d.data.access_token
      } catch (e) {
        useAuthStore.getState().logout()
        if (e instanceof ApiError) throw e
        throw new ApiError('9998', MESSAGES.sessionExpired)
      }
    })().finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

type RetriedConfig = InternalAxiosRequestConfig & { _retried?: boolean }

api.interceptors.response.use(
  (res) => {
    const body = res.data as Envelope<unknown> | undefined
    if (!body || typeof body.code !== 'string') {
      throw new ApiError('CLIENT_BAD_FORMAT', MESSAGES.connectionError, res.status)
    }
    // 200 nhưng token hết hạn -> refresh + retry 1 lần
    if (body.code === '9998' && res.config && !(res.config as RetriedConfig)._retried) {
      const cfg = res.config as RetriedConfig
      cfg._retried = true
      return doRefresh().then((token) => {
        cfg.headers.Authorization = `Bearer ${token}`
        return api.request(cfg)
      })
    }
    if (body.code === '9998') useAuthStore.getState().logout()
    if (body.code !== '1000') {
      throw new ApiError(body.code, body.message, res.status, body.data)
    }
    return res
  },
  async (err: AxiosError<Envelope<unknown>>) => {
    const cfgNet = err.config as (InternalAxiosRequestConfig & { _netRetried?: boolean }) | undefined
    // Không có response (timeout/ECONNREFUSED/cold start): retry đúng 1 lần sau 1.5s
    if (!err.response && cfgNet && !cfgNet._netRetried) {
      cfgNet._netRetried = true
      await new Promise((r) => setTimeout(r, 1500))
      return api.request(cfgNet)
    }
    if (!err.response) throw new ApiError('CLIENT_NETWORK', MESSAGES.connectionError)
    const body = err.response.data
    const cfg = err.config as RetriedConfig | undefined
    const tokenExpired = body?.code === '9998' || err.response.status === 401
    // Không retry chính request refresh/login
    const isAuthCall = !!cfg?.url?.includes('/auth/')
    if (tokenExpired && cfg && !cfg._retried && !isAuthCall) {
      cfg._retried = true
      const token = await doRefresh()
      cfg.headers.Authorization = `Bearer ${token}`
      return api.request(cfg)
    }
    if (tokenExpired && !isAuthCall) useAuthStore.getState().logout()
    if (body && typeof body.code === 'string') {
      throw new ApiError(body.code, body.message, err.response.status, body.data)
    }
    throw new ApiError('CLIENT_BAD_FORMAT', MESSAGES.connectionError, err.response.status)
  },
)

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<Envelope<T>>(url, { params })
  return res.data.data
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<Envelope<T>>(url, body)
  return res.data.data
}
export async function put<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.put<Envelope<T>>(url, body)
  return res.data.data
}
export async function del<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.delete<Envelope<T>>(url, { data: body })
  return res.data.data
}
