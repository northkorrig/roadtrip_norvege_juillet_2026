import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { LoadingScreen } from '../components/ui'

export default function LoginPage(): ReactNode {
  const { user, chargement } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  if (!isSupabaseConfigured) return <Navigate to="/" replace />
  if (chargement) return <LoadingScreen />
  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setErreur(null)
    setEnCours(true)
    try {
      const { error } = await getSupabase().auth.signInWithPassword({
        email: email.trim(),
        password: motDePasse,
      })
      if (error) {
        setErreur('Email ou mot de passe incorrect.')
      } else {
        navigate(from, { replace: true })
      }
    } catch {
      setErreur('Une erreur est survenue. Réessaie.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-night px-4">
      <div className="glass w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <svg viewBox="0 0 64 64" className="mx-auto mb-4 h-12 w-12 rounded-xl" aria-hidden>
            <rect width="64" height="64" rx="14" fill="#13263B" />
            <path d="M6 44 L20 22 L28 34 L36 18 L50 40 L58 30 V58 H6 Z" fill="#1E3650" />
            <path d="M33 24 L36 18 L40 24 Z" fill="#F0EDE6" />
            <path d="M6 58 H58 V50 C46 44 22 44 6 50 Z" fill="#5BBFBA" opacity="0.9" />
            <circle cx="14" cy="14" r="5" fill="#E8824A" />
          </svg>
          <h1 className="font-display text-2xl font-bold">Norvège 2026</h1>
          <p className="mt-1 text-sm text-cream-dim">Connecte-toi pour accéder au roadtrip</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-cream-dim">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-cream placeholder-cream-dim/50 outline-none focus:border-glacier/50 focus:ring-1 focus:ring-glacier/30"
              placeholder="ton@email.com"
            />
          </div>

          <div>
            <label htmlFor="mot-de-passe" className="mb-1.5 block text-sm font-medium text-cream-dim">
              Mot de passe
            </label>
            <input
              id="mot-de-passe"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-cream placeholder-cream-dim/50 outline-none focus:border-glacier/50 focus:ring-1 focus:ring-glacier/30"
              placeholder="••••••••"
            />
          </div>

          {erreur && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">{erreur}</p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="btn-glacier w-full justify-center py-2.5 disabled:opacity-60"
          >
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
