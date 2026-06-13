import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useToast } from '../ui'

/**
 * Événement `beforeinstallprompt` (non typé par lib.dom) : permet de déclencher
 * l'invite d'installation native depuis un bouton maison.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Rend la PWA visible :
 *  - toast « Disponible hors-ligne ✓ » quand le service worker a fini de
 *    précacher le shell applicatif (premier chargement) ;
 *  - bandeau d'installation maison piloté par l'événement `beforeinstallprompt`.
 *
 * Doit être monté à l'intérieur du ToastProvider.
 */
export default function PwaManager(): ReactNode {
  const toast = useToast()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [masque, setMasque] = useState(false)

  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW()

  // App prête hors-ligne : on prévient l'utilisateur une seule fois.
  useEffect(() => {
    if (!offlineReady) return
    toast('Disponible hors-ligne ✓')
    setOfflineReady(false)
  }, [offlineReady, setOfflineReady, toast])

  // Capture l'invite d'installation pour la rejouer depuis notre bouton.
  useEffect(() => {
    const onPrompt = (e: Event): void => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setMasque(false)
    }
    const onInstalled = (): void => setInstallEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const installer = async (): Promise<void> => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    setInstallEvent(null)
    if (outcome === 'accepted') toast('Installation en cours…')
  }

  const visible = installEvent !== null && !masque

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="no-print pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex justify-center px-4 md:bottom-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          <div className="glass pointer-events-auto flex items-center gap-3 border-glacier/40 px-4 py-2.5">
            <Download className="h-4 w-4 shrink-0 text-glacier" />
            <span className="text-sm text-cream">Installer l’app sur l’écran d’accueil</span>
            <button type="button" className="btn-glacier px-3 py-1.5 text-xs" onClick={() => void installer()}>
              Installer
            </button>
            <button
              type="button"
              aria-label="Ignorer"
              className="btn-ghost p-1.5"
              onClick={() => setMasque(true)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
