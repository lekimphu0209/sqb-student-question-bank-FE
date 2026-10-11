/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string
  readonly VITE_API_BASE?: string
  readonly VITE_TEST_EMAIL?: string
  readonly VITE_TEST_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
