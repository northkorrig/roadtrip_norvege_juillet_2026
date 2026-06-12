import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { Profil } from '../types/db'

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
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [chargement, setChargement] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = getSupabase()
    let actif = true

    // Initialisation : on garantit que `chargement` repasse à false quoi qu'il
    // arrive (session illisible, réseau coupé, profil introuvable), sinon l'app
    // resterait bloquée sur l'écran « Chargement du voyage… ».
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!actif) return
        setUser(session?.user ?? null)
        if (session?.user) {
          const profil = await fetchProfil(session.user.id).catch(() => null)
          if (actif) setProfil(profil)
        }
      } catch {
        // Session illisible → on poursuit en non-authentifié (redirige vers /login)
      } finally {
        if (actif) setChargement(false)
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfil(await fetchProfil(session.user.id).catch(() => null))
      } else {
        setProfil(null)
      }
    })

    return () => {
      actif = false
      subscription.unsubscribe()
    }
  }, [])

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
