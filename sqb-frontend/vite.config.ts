import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL || 'https://snsqb.duckdns.org'
  return {
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backend,
        changeOrigin: true,
        secure: true,
        ws: true,
        // Backend chặn request có Origin/Referer lạ (403) — rewrite về cùng origin backend
        headers: { Origin: backend, Referer: `${backend}/` },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('origin', backend)
            proxyReq.setHeader('referer', `${backend}/`)
          })
        },
      },
    },
  },
  }
})
