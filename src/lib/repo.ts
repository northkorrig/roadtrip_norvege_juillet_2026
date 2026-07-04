import type {
  Depense,
  DepenseInput,
  Etape,
  EtapeInput,
  Note,
  NoteInput,
  Poi,
  PoiInput,
  PokedexObservation,
  PokedexObservationInput,
  TableName,
  Tache,
  TacheInput,
} from '../types/db'
import { isSupabaseConfigured } from './supabaseClient'
import { createSupabaseRepo } from './supabaseRepo'
import { createLocalRepo } from './localRepo'

/**
 * Couche d'accès aux données. Deux implémentations interchangeables :
 *  - Supabase (PostgreSQL + Realtime) quand les variables d'env sont présentes
 *  - localStorage pré-rempli avec les données seed sinon (mode démo/hors-ligne)
 */
export interface TripRepo {
  mode: 'supabase' | 'local'

  listEtapes(): Promise<Etape[]>
  createEtape(input: EtapeInput): Promise<Etape>
  updateEtape(id: string, patch: Partial<EtapeInput>): Promise<Etape>
  deleteEtape(id: string): Promise<void>

  listPois(): Promise<Poi[]>
  createPoi(input: PoiInput): Promise<Poi>
  createPois(inputs: PoiInput[]): Promise<Poi[]>
  updatePoi(id: string, patch: Partial<PoiInput>): Promise<Poi>
  deletePoi(id: string): Promise<void>

  listNotes(): Promise<Note[]>
  createNote(input: NoteInput): Promise<Note>
  updateNote(id: string, patch: Partial<NoteInput>): Promise<Note>
  deleteNote(id: string): Promise<void>

  listTaches(): Promise<Tache[]>
  createTache(input: TacheInput): Promise<Tache>
  updateTache(id: string, patch: Partial<TacheInput>): Promise<Tache>
  deleteTache(id: string): Promise<void>

  listDepenses(): Promise<Depense[]>
  createDepense(input: DepenseInput): Promise<Depense>
  updateDepense(id: string, patch: Partial<DepenseInput>): Promise<Depense>
  deleteDepense(id: string): Promise<void>

  listPokedex(): Promise<PokedexObservation[]>
  /** Crée ou met à jour l'observation d'une espèce (clé = animal_id). */
  upsertPokedex(input: PokedexObservationInput): Promise<PokedexObservation>
  deletePokedex(animalId: string): Promise<void>

  /** Réécrit la colonne `ordre` (0..n) en suivant l'ordre des ids fournis. */
  setOrdres(table: 'etapes' | 'pois' | 'taches', ids: string[]): Promise<void>

  /** Notifie quand une table change (Realtime côté Supabase, autre onglet côté local). */
  subscribe(onChange: (table: TableName) => void): () => void
}

export const repo: TripRepo = isSupabaseConfigured ? createSupabaseRepo() : createLocalRepo()
