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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfil(await fetchProfil(session.user.id))
      }
      setChargement(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setProfil(await fetchProfil(session.user.id))
      } else {
        setProfil(null)
      }
    })

    return () => subscription.unsubscribe()
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
