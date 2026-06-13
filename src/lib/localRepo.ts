import { LS_KEYS } from '../config/constants'
import type {
  Depense,
  Etape,
  Note,
  Poi,
  TableName,
  Tache,
} from '../types/db'
import { SEED_DEPENSES, SEED_ETAPES, SEED_NOTES, SEED_POIS, SEED_TACHES } from './seedData'
import type { TripRepo } from './repo'

interface LocalDb {
  etapes: Etape[]
  pois: Poi[]
  notes: Note[]
  taches: Tache[]
  depenses: Depense[]
}

type RowOf = {
  etapes: Etape
  pois: Poi
  notes: Note
  taches: Tache
  depenses: Depense
}

const listeners = new Set<(table: TableName) => void>()

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(LS_KEYS.localDb)
    if (raw) return JSON.parse(raw) as LocalDb
  } catch {
    // stockage corrompu → on repart du seed
  }
  const db: LocalDb = {
    etapes: SEED_ETAPES,
    pois: SEED_POIS,
    notes: SEED_NOTES,
    taches: SEED_TACHES,
    depenses: SEED_DEPENSES,
  }
  persist(db)
  return db
}

function persist(db: LocalDb): void {
  localStorage.setItem(LS_KEYS.localDb, JSON.stringify(db))
}

function notify(table: TableName): void {
  listeners.forEach((cb) => cb(table))
}

function mutate<K extends TableName>(table: K, fn: (rows: RowOf[K][]) => RowOf[K][]): void {
  const db = loadDb()
  const next: LocalDb = { ...db, [table]: fn(db[table] as RowOf[K][]) }
  persist(next)
  notify(table)
}

function nowIso(): string {
  return new Date().toISOString()
}

function newId(): string {
  return crypto.randomUUID()
}

async function list<K extends TableName>(table: K): Promise<RowOf[K][]> {
  return [...(loadDb()[table] as RowOf[K][])]
}

async function create<K extends TableName>(table: K, row: RowOf[K]): Promise<RowOf[K]> {
  mutate(table, (rows) => [...rows, row])
  return row
}

async function update<K extends TableName>(
  table: K,
  id: string,
  patch: Partial<RowOf[K]>,
): Promise<RowOf[K]> {
  let updated: RowOf[K] | undefined
  mutate(table, (rows) =>
    rows.map((r) => {
      if ((r as { id: string }).id !== id) return r
      updated = { ...r, ...patch }
      return updated
    }),
  )
  if (!updated) throw new Error(`Local — ${table} : élément ${id} introuvable`)
  return updated
}

async function remove(table: TableName, id: string): Promise<void> {
  mutate(table, (rows) => rows.filter((r) => (r as { id: string }).id !== id))
}

export function createLocalRepo(): TripRepo {
  return {
    mode: 'local',

    listEtapes: () => list('etapes').then((r) => r.sort((a, b) => a.ordre - b.ordre)),
    createEtape: (input) => create('etapes', { ...input, id: newId(), created_at: nowIso() }),
    updateEtape: (id, patch) => update('etapes', id, patch),
    deleteEtape: async (id) => {
      // réplique les `on delete set null` des FK pois.etape_id et depenses.etape_id
      mutate('pois', (rows) => rows.map((p) => (p.etape_id === id ? { ...p, etape_id: null } : p)))
      mutate('depenses', (rows) => rows.map((d) => (d.etape_id === id ? { ...d, etape_id: null } : d)))
      await remove('etapes', id)
    },

    listPois: () => list('pois').then((r) => r.sort((a, b) => a.ordre - b.ordre)),
    createPoi: (input) => create('pois', { ...input, id: newId(), created_at: nowIso() }),
    createPois: async (inputs) => {
      const rows = inputs.map((input) => ({ ...input, id: newId(), created_at: nowIso() }))
      mutate('pois', (existing) => [...existing, ...rows])
      return rows
    },
    updatePoi: (id, patch) => update('pois', id, patch),
    deletePoi: async (id) => {
      mutate('notes', (rows) => rows.map((n) => (n.poi_id === id ? { ...n, poi_id: null } : n)))
      await remove('pois', id)
    },

    listNotes: () => list('notes'),
    createNote: (input) =>
      create('notes', { ...input, id: newId(), created_at: nowIso(), updated_at: nowIso() }),
    updateNote: (id, patch) => update('notes', id, { ...patch, updated_at: nowIso() }),
    deleteNote: (id) => remove('notes', id),

    listTaches: () => list('taches').then((r) => r.sort((a, b) => a.ordre - b.ordre)),
    createTache: (input) => create('taches', { ...input, id: newId(), created_at: nowIso() }),
    updateTache: (id, patch) => update('taches', id, patch),
    deleteTache: (id) => remove('taches', id),

    listDepenses: () => list('depenses'),
    createDepense: (input) => create('depenses', { ...input, id: newId(), created_at: nowIso() }),
    updateDepense: (id, patch) => update('depenses', id, patch),
    deleteDepense: (id) => remove('depenses', id),

    async setOrdres(table, ids) {
      const position = new Map(ids.map((id, i) => [id, i]))
      mutate(table, (rows) =>
        rows.map((r) => {
          const ordre = position.get((r as { id: string }).id)
          return ordre === undefined ? r : { ...r, ordre }
        }),
      )
    },

    subscribe(onChange) {
      listeners.add(onChange)
      // synchronisation entre onglets du même navigateur
      const onStorage = (e: StorageEvent): void => {
        if (e.key === LS_KEYS.localDb) onChange('etapes')
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listeners.delete(onChange)
        window.removeEventListener('storage', onStorage)
      }
    },
  }
}
