// Vercel serverless proxy: /api/* (rewrite) -> backend.
// Backend chặn Origin/Referer lạ (403) — rewrite về origin backend, giống nginx.conf / vite.config.ts.
// Lưu ý: WebSocket (chat /api/v1/ws) KHÔNG đi qua function — FE connect thẳng qua VITE_WS_URL.
// vercel.json rewrite: /api/v1/:path* -> /api/proxy (path lấy lại từ req.url gốc / header x-vercel).

// Kiểu tối thiểu cho Node req/res của Vercel (tránh phải thêm @types/node chỉ cho file này)
interface NodeRequest {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
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
  const raw = req.url || '/'

  const u = new URL(raw, 'http://x')

  // Path gốc: ưu tiên query param __t (do rewrite inject), fallback lấy từ req.url nếu nó giữ /api/v1/*
  let apiPath = '/api/v1'
  let qs = ''
  const injected = u.searchParams.get('__t')
  if (injected) {
    apiPath = injected.startsWith('/') ? injected : `/${injected}`
    // Bỏ tham số inject: __t (của mình), path (Vercel wildcard param), __debug
    u.searchParams.delete('__t')
    u.searchParams.delete('__debug')
    u.searchParams.delete('path')
    qs = u.search
  } else if (raw.startsWith('/api/')) {
    const i = raw.indexOf('?')
    apiPath = i >= 0 ? raw.slice(0, i) : raw
    qs = i >= 0 ? raw.slice(i) : ''
  }
  const target = `${BACKEND}${apiPath}${qs}`

  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (!v || SKIP_REQ.has(k)) continue
    // Bỏ header do Vercel/proxy inject — backend WAF có thể check x-forwarded-host/forwarded
    if (k.startsWith('x-vercel') || k.startsWith('x-forwarded') || k === 'forwarded' || k.startsWith('cf-')) continue
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
