import {
  Home,
  LogOut,
  MapPin,
  NotebookPen,
  Printer,
  Route,
  Share2,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { LS_KEYS } from '../../config/constants'
import { useAuth } from '../../context/AuthContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useTripData } from '../../state/TripDataContext'
import { useToast } from '../ui'

const LIENS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: '/', label: 'Accueil', Icon: Home },
  { to: '/itineraire', label: 'Itinéraire', Icon: Route },
  { to: '/pois', label: 'POIs', Icon: MapPin },
  { to: '/budget', label: 'Budget', Icon: Wallet },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
]

function classeLien(actif: boolean): string {
  return `chip ${actif ? 'bg-glacier/20 text-glacier' : 'text-cream-dim hover:bg-white/[0.07] hover:text-cream'}`
}

export default function NavBar(): ReactNode {
  const { mode } = useTripData()
  const { user, seDeconnecter } = useAuth()
  const toast = useToast()
  const [code, setCode] = useLocalStorage(LS_KEYS.shareCode, '')

  const partager = async (): Promise<void> => {
    let c = code
    if (!c) {
      c = Math.random().toString(36).slice(2, 8)
      setCode(c)
    }
    const url = `${window.location.origin}/trip/${c}`
    try {
      await navigator.clipboard.writeText(url)
      toast('Lien de partage copié dans le presse-papier')
    } catch {
      window.prompt('Copie ce lien de partage :', url)
    }
  }

  return (
    <>
      {/* Barre supérieure */}
      <header className="no-print fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-night/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0 rounded-lg" aria-hidden>
              <rect width="64" height="64" rx="14" fill="#13263B" />
              <path d="M6 44 L20 22 L28 34 L36 18 L50 40 L58 30 V58 H6 Z" fill="#1E3650" />
              <path d="M33 24 L36 18 L40 24 Z" fill="#F0EDE6" />
              <path d="M6 58 H58 V50 C46 44 22 44 6 50 Z" fill="#5BBFBA" opacity="0.9" />
              <circle cx="14" cy="14" r="5" fill="#E8824A" />
            </svg>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-base font-bold">Norvège 2026</p>
              <p className="hidden text-[11px] text-cream-dim sm:block">Fjords & Montagnes · 14 → 26 juillet</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Navigation principale">
            {LIENS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => classeLien(isActive)}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span
              title={
                mode === 'supabase'
                  ? 'Connecté à Supabase — données synchronisées en temps réel'
                  : 'Mode démo : données seed en localStorage (configure Supabase dans .env.local)'
              }
              className={`chip hidden sm:inline-flex ${
                mode === 'supabase' ? 'bg-glacier/15 text-glacier' : 'bg-ember/15 text-ember-soft'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${mode === 'supabase' ? 'bg-glacier' : 'bg-ember'}`} />
              {mode === 'supabase' ? 'Sync' : 'Démo locale'}
            </span>
            <Link to="/roadbook" className="btn-ghost p-2.5" title="Roadbook imprimable (PDF)">
              <Printer className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => void partager()} className="btn-glacier p-2.5" title="Partager en lecture seule">
              <Share2 className="h-4 w-4" />
            </button>
            {user && (
              <button
                type="button"
                onClick={() => void seDeconnecter()}
                className="btn-ghost p-2.5"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Barre d'onglets mobile */}
      <nav
        aria-label="Navigation mobile"
        className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-night/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="grid grid-cols-5">
          {LIENS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${
                  isActive ? 'text-glacier' : 'text-cream-dim'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
