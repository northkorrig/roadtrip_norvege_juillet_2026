import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { useToast } from '../components/ui'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { Profil } from '../types/db'

// Au-delà de ce délai sans réponse de Supabase (réseau lent/coupé en montagne),
// on cesse d'attendre getSession() et on rend la main à l'utilisateur.
const AUTH_TIMEOUT_MS = 6000

interface AuthValue {
  user: User | null
  profil: Profil | null
  chargement: boolean
  seDeconnecter: () => Promise<void>
}

export const AuthContext = createContext<AuthValue>({
  user: null,
  profil: null,
  chargement: false,
  seDeconnecter: async () => {},
})

async function fetchProfil(userId: string): Promise<Profil | null> {
  const { data } = await getSupabase()
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .single()
  return data as Profil | null
}

export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const toast = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = getSupabase()
    let actif = true
    let resolu = false

    // Filet de sécurité : si aucun événement d'auth n'arrive (getSession() figé
    // par un réseau lent/coupé), on débloque l'écran et on bascule en local.
    const minuterie = setTimeout(() => {
      if (!actif || resolu) return
      setChargement(false)
      toast('Hors-ligne — données locales')
    }, AUTH_TIMEOUT_MS)

    // L'événement INITIAL_SESSION couvre la restauration de session au
    // démarrage : pas besoin d'un getSession() séparé.
    //
    // ⚠️ Le callback DOIT rester synchrone : tout appel Supabase await-é ici
    // (fetchProfil → .from()) attend en interne getSession(), qui attend la fin
    // de initialize(), qui attend… la fin de ce callback. Ce deadlock ne se
    // produit que lorsqu'une session existe — l'app restait donc bloquée sur
    // « Chargement du voyage… » uniquement pour un utilisateur déjà connecté.
    // On diffère le chargement du profil hors du callback (setTimeout 0),
    // conformément à la recommandation de la doc Supabase.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!actif) return
      resolu = true
      clearTimeout(minuterie)
      setUser(session?.user ?? null)
      setChargement(false)
      if (!session?.user) {
        setProfil(null)
        return
      }
      const userId = session.user.id
      setTimeout(() => {
        if (!actif) return
        void fetchProfil(userId)
          .catch(() => null)
          .then((profil) => {
            if (actif) setProfil(profil)
          })
      }, 0)
    })

    return () => {
      actif = false
      clearTimeout(minuterie)
      subscription.unsubscribe()
    }
  }, [toast])

  const seDeconnecter = async (): Promise<void> => {
    if (!isSupabaseConfigured) return
    await getSupabase().auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profil, chargement, seDeconnecter }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthValue {
  return useContext(AuthContext)
}
