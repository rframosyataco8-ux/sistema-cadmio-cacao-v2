import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info', ms = 3200) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms)
  }, [])

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-up ${
              t.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : t.type === 'error'
                ? 'bg-red-50/95 border-red-200 text-red-900'
                : 'bg-white/95 border-surface-200 text-gray-900'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />}
            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-black/5"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            >
              <X className="w-4 h-4 opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) return { success: () => {}, error: () => {}, info: () => {} }
  return ctx
}
