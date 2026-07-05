// Types alignés EXACTEMENT sur le schéma Supabase (noms de colonnes en français).
// Voir supabase_setup.sql — toute évolution doit être répercutée des deux côtés.

export type NuitType = 'camping' | 'bivouac' | 'parking' | 'hotel' | 'autre'

export type PoiCategorie =
  | 'randonnee'
  | 'vue_panoramique'
  | 'cascade'
  | 'glacier'
  | 'village'
  | 'ferry'
  | 'bivouac'
  | 'activite'
  | 'drone'

export type DepenseCategorie =
  | 'transport'
  | 'van'
  | 'carburant'
  | 'activites'
  | 'nourriture'
  | 'hebergement'
  | 'divers'

export type TacheCategorie = 'packing' | 'avant_depart'

export interface Etape {
  id: string
  nom: string
  date: string | null
  ordre: number
  lat: number | null
  lng: number | null
  km_depuis_precedent: number | null
  duree_min: number | null
  nuit_type: NuitType | null
  note: string | null
  created_at: string
}

export interface Poi {
  id: string
  nom: string
  categorie: PoiCategorie
  lat: number
  lng: number
  note: string | null
  ordre: number
  jour: string | null
  etape_id: string | null
  created_at: string
}

export interface Note {
  id: string
  titre: string
  contenu: string
  date: string | null
  poi_id: string | null
  created_at: string
  updated_at: string
}

export interface Tache {
  id: string
  texte: string
  categorie: TacheCategorie
  completee: boolean
  ordre: number
  created_at: string
}

export interface Depense {
  id: string
  label: string
  montant: number
  categorie: DepenseCategorie
  date: string | null
  personne: string | null
  note: string | null
  created_at: string
}

/** Observation du pokédex faune — une ligne par espèce, partagée entre les voyageurs. */
export interface PokedexObservation {
  animal_id: string
  vu: boolean
  date: string | null
  lieu: string
  note: string
  created_at: string
}

export type EtapeInput = Omit<Etape, 'id' | 'created_at'>
export type PoiInput = Omit<Poi, 'id' | 'created_at'>
export type NoteInput = Omit<Note, 'id' | 'created_at' | 'updated_at'>
export type TacheInput = Omit<Tache, 'id' | 'created_at'>
export type DepenseInput = Omit<Depense, 'id' | 'created_at'>
export type PokedexObservationInput = Omit<PokedexObservation, 'created_at'>

export type TableName = 'etapes' | 'pois' | 'notes' | 'taches' | 'depenses' | 'pokedex_observations'

/** Réservations — persistées en localStorage (pas de table dédiée dans le schéma). */
export type ReservationStatut = 'a_faire' | 'en_cours' | 'confirme'

export interface Reservation {
  id: string
  label: string
  statut: ReservationStatut
  url: string | null
  echeance: string | null
  note: string | null
}

export interface LatLng {
  lat: number
  lng: number
}

export type RoleProfil = 'admin' | 'invite'

export interface Profil {
  id: string
  role: RoleProfil
}
