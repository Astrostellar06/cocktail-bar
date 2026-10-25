import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { STUCK_WRITE_EVENT } from '../lib/db'

type ShowToast = (message: string, options?: { duration?: number; tone?: 'info' | 'warning' }) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'info' | 'warning' } | null>(null)
  const timer = useRef<number>(undefined)

  const show = useCallback<ShowToast>((message, { duration = 2200, tone = 'info' } = {}) => {
    setToast({ id: Date.now(), message, tone })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => {
    const onStuck = () =>
      show("Enregistrement bloqué : Mon Bar est sans doute ouvert ailleurs (onglet Chrome). Ferme-le, puis réessaie.", {
        duration: 8000,
        tone: 'warning',
      })
    window.addEventListener(STUCK_WRITE_EVENT, onStuck)
    return () => window.removeEventListener(STUCK_WRITE_EVENT, onStuck)
  }, [show])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className={`toast ${toast.tone}`} role={toast.tone === 'warning' ? 'alert' : 'status'} key={toast.id}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
