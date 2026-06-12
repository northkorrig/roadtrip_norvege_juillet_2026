import type {
  Depense,
  DepenseInput,
  Etape,
  EtapeInput,
  Note,
  NoteInput,
  Poi,
  PoiInput,
  TableName,
  Tache,
  TacheInput,
} from '../types/db'
import { getSupabase } from './supabaseClient'
import type { TripRepo } from './repo'

const TABLES: TableName[] = ['etapes', 'pois', 'notes', 'taches', 'depenses']

function fail(operation: string, table: string, message: string): never {
  throw new Error(`Supabase — ${operation} ${table} : ${message}`)
}

async function listAll<T>(table: TableName, orderBy: string): Promise<T[]> {
  const { data, error } = await getSupabase().from(table).select('*').order(orderBy, { ascending: true })
  if (error) fail('lecture', table, error.message)
  return (data ?? []) as T[]
}

async function insertOne<T>(table: TableName, input: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().from(table).insert(input).select().single()
  if (error) fail('création', table, error.message)
  return data as T
}

async function insertMany<T>(table: TableName, inputs: Record<string, unknown>[]): Promise<T[]> {
  const { data, error } = await getSupabase().from(table).insert(inputs).select()
  if (error) fail('import', table, error.message)
  return (data ?? []) as T[]
}

async function updateOne<T>(table: TableName, id: string, patch: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().from(table).update(patch).eq('id', id).select().single()
  if (error) fail('mise à jour', table, error.message)
  return data as T
}

async function deleteOne(table: TableName, id: string): Promise<void> {
  const { error } = await getSupabase().from(table).delete().eq('id', id)
  if (error) fail('suppression', table, error.message)
}

export function createSupabaseRepo(): TripRepo {
  return {
    mode: 'supabase',

    listEtapes: () => listAll<Etape>('etapes', 'ordre'),
    createEtape: (input: EtapeInput) => insertOne<Etape>('etapes', input),
    updateEtape: (id, patch) => updateOne<Etape>('etapes', id, patch),
    deleteEtape: (id) => deleteOne('etapes', id),

    listPois: () => listAll<Poi>('pois', 'ordre'),
    createPoi: (input: PoiInput) => insertOne<Poi>('pois', input),
    createPois: (inputs: PoiInput[]) => insertMany<Poi>('pois', inputs),
    updatePoi: (id, patch) => updateOne<Poi>('pois', id, patch),
    deletePoi: (id) => deleteOne('pois', id),

    listNotes: () => listAll<Note>('notes', 'created_at'),
    createNote: (input: NoteInput) => insertOne<Note>('notes', input),
    updateNote: (id, patch) => updateOne<Note>('notes', id, patch),
    deleteNote: (id) => deleteOne('notes', id),

    listTaches: () => listAll<Tache>('taches', 'ordre'),
    createTache: (input: TacheInput) => insertOne<Tache>('taches', input),
    updateTache: (id, patch) => updateOne<Tache>('taches', id, patch),
    deleteTache: (id) => deleteOne('taches', id),

    listDepenses: () => listAll<Depense>('depenses', 'created_at'),
    createDepense: (input: DepenseInput) => insertOne<Depense>('depenses', input),
    updateDepense: (id, patch) => updateOne<Depense>('depenses', id, patch),
    deleteDepense: (id) => deleteOne('depenses', id),

    async setOrdres(table, ids) {
      const results = await Promise.all(
        ids.map((id, ordre) => getSupabase().from(table).update({ ordre }).eq('id', id)),
      )
      const firstError = results.find((r) => r.error)?.error
      if (firstError) fail('réordonnancement', table, firstError.message)
    },

    subscribe(onChange) {
      const channel = getSupabase().channel('trip-db-changes')
      for (const table of TABLES) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => onChange(table),
        )
      }
      channel.subscribe()
      return () => {
        void getSupabase().removeChannel(channel)
      }
    },
  }
}
