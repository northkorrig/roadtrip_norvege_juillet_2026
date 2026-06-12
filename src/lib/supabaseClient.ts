import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase est optionnel : sans credentials, l'app bascule en mode local
 * (localStorage + données seed) pour rester utilisable hors configuration.
 */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase non configuré : renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY')
  }
  client ??= createClient(url as string, anonKey as string, {
    auth: { persistSession: true },
  })
  return client
}
