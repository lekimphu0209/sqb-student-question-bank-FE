import axios, { AxiosError } from 'axios'
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
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => {
    const body = res.data as Envelope<unknown> | undefined
    if (!body || typeof body.code !== 'string') {
      throw new ApiError('CLIENT_BAD_FORMAT', MESSAGES.connectionError, res.status)
    }
    if (body.code !== '1000') {
      throw new ApiError(body.code, body.message, res.status, body.data)
    }
    return res
  },
  (err: AxiosError<Envelope<unknown>>) => {
    if (!err.response) throw new ApiError('CLIENT_NETWORK', MESSAGES.connectionError)
    const body = err.response.data
    if (body?.code === '9998') useAuthStore.getState().logout()
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
