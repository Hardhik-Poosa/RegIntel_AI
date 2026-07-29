import { createContext, useContext, useState, useCallback, useRef } from 'react'

// ── Context ───────────────────────────────────────────
const ToastContext = createContext(null)

let _id = 0

/**
 * Global toast provider.
 * Usage: const { toast } = useToast()
 *        toast.success('Saved!')
 *        toast.error('Something went wrong')
 *        toast.info('FYI…')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++_id
    setToasts((prev) => [...prev, { id, type, message }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const toast = {
    success: (msg, ms) => addToast('success', msg, ms),
    error:   (msg, ms) => addToast('error',   msg, ms),
    info:    (msg, ms) => addToast('info',     msg, ms),
    warning: (msg, ms) => addToast('warning',  msg, ms),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Toast UI ──────────────────────────────────────────
const CONFIG = {
  success: { icon: 'bi-check-circle-fill', color: '#3fb950', bg: 'rgba(63,185,80,0.12)',   border: 'rgba(63,185,80,0.3)'   },
  error:   { icon: 'bi-x-circle-fill',     color: '#f85149', bg: 'rgba(248,81,73,0.12)',   border: 'rgba(248,81,73,0.3)'   },
  info:    { icon: 'bi-info-circle-fill',   color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)',  border: 'rgba(79,142,247,0.3)'  },
  warning: { icon: 'bi-exclamation-circle-fill', color: '#d29922', bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.3)' },
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: '360px',
        width: '100%',
      }}
    >
      {toasts.map((t) => {
        const cfg = CONFIG[t.type] ?? CONFIG.info
        return (
          <div
            key={t.id}
            style={{
              background: '#161b22',
              border: `1px solid ${cfg.border}`,
              borderLeft: `4px solid ${cfg.color}`,
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              animation: 'rg-toast-in 0.25s ease',
              color: '#e6edf3',
              fontSize: '0.87rem',
            }}
            role="alert"
          >
            <i
              className={`bi ${cfg.icon}`}
              style={{ color: cfg.color, fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}
            />
            <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'none', border: 'none', color: '#484f58',
                cursor: 'pointer', padding: '0', flexShrink: 0,
                fontSize: '0.9rem', lineHeight: 1,
              }}
            >
              <i className="bi bi-x" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
