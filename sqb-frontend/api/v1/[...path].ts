// Vercel serverless proxy: /api/v1/* -> backend.
// Backend chặn Origin/Referer lạ (403) — rewrite về origin backend, giống nginx.conf / vite.config.ts.
// Lưu ý: WebSocket (chat /api/v1/ws) KHÔNG đi qua function — FE connect thẳng qua VITE_WS_URL.
// Kiểu tối thiểu cho Node req/res của Vercel (tránh phải thêm @types/node chỉ cho file này)
interface NodeRequest {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
}
interface NodeResponse {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: unknown): void
}

const BACKEND = 'https://snsqb.duckdns.org'

// Header hop-by-hop không forward qua proxy
const SKIP_REQ = new Set([
  'host', 'connection', 'content-length', 'transfer-encoding',
  'keep-alive', 'upgrade', 'expect',
])
const SKIP_RES = new Set(['connection', 'transfer-encoding', 'keep-alive', 'content-length'])

export default async function handler(req: NodeRequest, res: NodeResponse) {
  // req.url = path gốc kèm query, vd /api/v1/posts?after=... — filesystem routing giữ nguyên
  const raw = req.url || '/'
  const target = raw.startsWith('/api/')
    ? `${BACKEND}${raw}`
    : `${BACKEND}/api/v1${raw.startsWith('/') ? raw : `/${raw}`}`

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (!v || SKIP_REQ.has(k) || k.startsWith('x-vercel')) continue
    headers.set(k, Array.isArray(v) ? v.join(', ') : v)
  }
  headers.set('host', 'snsqb.duckdns.org')
  headers.set('origin', BACKEND)
  headers.set('referer', `${BACKEND}/`)

  try {
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
    const init = {
      method: req.method || 'GET',
      headers,
      ...(hasBody ? { body: req as unknown as BodyInit, duplex: 'half' } : {}),
    } as RequestInit

    const upstream = await fetch(target, init)

    res.statusCode = upstream.status
    upstream.headers.forEach((v, k) => {
      if (!SKIP_RES.has(k)) res.setHeader(k, v)
    })
    res.end(new Uint8Array(await upstream.arrayBuffer()))
  } catch (e) {
    res.statusCode = 502
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ code: '0502', message: `Proxy error: ${(e as Error).message}` }))
  }
}
