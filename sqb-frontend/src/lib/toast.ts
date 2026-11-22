// Toast tối giản theo theme: toast('...', 'success' | 'error' | 'info')
// Mount <ToastHost/> một lần ở root (main.tsx).

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  type: ToastType
  text: string
}

type Listener = (t: Toast) => void
const listeners = new Set<Listener>()
let seq = 1

export function toast(text: string, type: ToastType = 'info') {
  const t: Toast = { id: seq++, type, text }
  listeners.forEach((l) => l(t))
}

export function onToast(l: Listener): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
