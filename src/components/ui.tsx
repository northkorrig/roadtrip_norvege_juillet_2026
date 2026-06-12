import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

// ---------- Transitions de page ----------

export function PageTransition({ children }: { children: ReactNode }): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ---------- Chargement / vide / erreur ----------

export function Spinner({ className = 'h-6 w-6' }: { className?: string }): ReactNode {
  return (
    <span
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-glacier/30 border-t-glacier ${className}`}
    />
  )
}

export function LoadingScreen({ message = 'Chargement du voyage…' }: { message?: string }): ReactNode {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <Spinner className="h-9 w-9" />
      <p className="text-sm text-cream-dim">{message}</p>
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }): ReactNode {
  return (
    <div className="glass flex flex-wrap items-center gap-3 border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost px-3 py-1.5 text-xs">
          Réessayer
        </button>
      )}
    </div>
  )
}

export function EmptyState({ titre, detail }: { titre: string; detail?: string }): ReactNode {
  return (
    <div className="glass-soft flex flex-col items-center gap-1.5 px-6 py-10 text-center">
      <p className="font-display text-lg text-cream">{titre}</p>
      {detail && <p className="max-w-sm text-sm text-cream-dim">{detail}</p>}
    </div>
  )
}

// ---------- Compteur animé ----------

export function CountUp({ valeur, duree = 1.4 }: { valeur: number; duree?: number }): ReactNode {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number): void => {
      const p = Math.min(1, (t - t0) / (duree * 1000))
      setN(Math.round(valeur * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valeur, duree])
  return <>{n.toLocaleString('fr-FR')}</>
}

// ---------- Modal & Drawer ----------

interface OverlayProps {
  ouvert: boolean
  onFermer: () => void
  titre: string
  children: ReactNode
}

function useEchap(actif: boolean, onFermer: () => void): void {
  useEffect(() => {
    if (!actif) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actif, onFermer])
}

export function Modal({ ouvert, onFermer, titre, children }: OverlayProps): ReactNode {
  useEchap(ouvert, onFermer)
  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-night-deep/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onFermer()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label={titre}
            className="glass max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-2xl sm:p-6"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold">{titre}</h2>
              <button type="button" onClick={onFermer} aria-label="Fermer" className="btn-ghost p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Drawer({ ouvert, onFermer, titre, children }: OverlayProps): ReactNode {
  useEchap(ouvert, onFermer)
  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          className="fixed inset-0 z-[70] bg-night-deep/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onFermer()
          }}
        >
          <motion.aside
            role="dialog"
            aria-modal
            aria-label={titre}
            className="glass absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto rounded-none border-y-0 border-r-0 p-5 sm:p-6"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold">{titre}</h2>
              <button type="button" onClick={onFermer} aria-label="Fermer" className="btn-ghost p-2">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({
  ouvert,
  titre,
  message,
  onConfirmer,
  onAnnuler,
  labelConfirmer = 'Supprimer',
  variante = 'danger',
}: {
  ouvert: boolean
  titre: string
  message: string
  onConfirmer: () => void
  onAnnuler: () => void
  labelConfirmer?: string
  variante?: 'danger' | 'primaire'
}): ReactNode {
  return (
    <Modal ouvert={ouvert} onFermer={onAnnuler} titre={titre}>
      <p className="text-sm text-cream-dim">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="btn-ghost" onClick={onAnnuler}>
          Annuler
        </button>
        <button type="button" className={variante === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirmer}>
          {labelConfirmer}
        </button>
      </div>
    </Modal>
  )
}

// ---------- Toasts ----------

interface Toast {
  id: number
  message: string
  type: 'ok' | 'erreur'
}

const ToastContext = createContext<(message: string, type?: 'ok' | 'erreur') => void>(() => undefined)

export function ToastProvider({ children }: { children: ReactNode }): ReactNode {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const push = useCallback((message: string, type: 'ok' | 'erreur' = 'ok') => {
    const id = nextId.current++
    setToasts((prev) => [...prev.slice(-3), { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className={`glass pointer-events-auto px-4 py-2.5 text-sm font-medium ${
                t.type === 'erreur' ? 'border-red-400/40 text-red-200' : 'border-glacier/40 text-cream'
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): (message: string, type?: 'ok' | 'erreur') => void {
  return useContext(ToastContext)
}

/** Exécute une action async avec toast d'erreur automatique. */
export function useAction(): (action: () => Promise<void>, messageOk?: string) => Promise<void> {
  const toast = useToast()
  return useCallback(
    async (action, messageOk) => {
      try {
        await action()
        if (messageOk) toast(messageOk)
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Une erreur est survenue', 'erreur')
      }
    },
    [toast],
  )
}
