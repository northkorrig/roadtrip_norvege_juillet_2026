import {
  Activity,
  BedDouble,
  Bus,
  Caravan,
  Droplets,
  Fuel,
  Home,
  MapPin,
  Mountain,
  Package,
  PiggyBank,
  Ship,
  Snowflake,
  Telescope,
  Tent,
  TreePine,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { DepenseCategorie, NuitType, PoiCategorie, TacheCategorie } from '../types/db'

export const TRIP_META = {
  nom: 'Norvège — Road Trip Fjords & Montagnes',
  sousTitre: 'Oslo → fjords de l’Ouest → Jotunheimen → Oslo, en van aménagé',
  debut: '2026-07-14',
  fin: '2026-07-26',
  nbJours: 13,
  vehicule: 'Arctic Campers — VW Transporter 4Motion',
  voyageurs: ['Voyageur 1', 'Voyageur 2'],
  distanceEstimeeKm: 1500,
  budgetDefautEur: 6000,
  estimationInitialeEur: 3917,
} as const

/** Les 13 jours du voyage, générés côté client (pas de table itinerary_days). */
export const TRIP_DAYS: string[] = Array.from({ length: 13 }, (_, i) => {
  const d = new Date('2026-07-14')
  d.setDate(d.getDate() + i)
  return d.toISOString().split('T')[0]
})

export const PALETTE = {
  night: '#0D1B2A',
  glacier: '#5BBFBA',
  cream: '#F0EDE6',
  ember: '#E8824A',
} as const

interface CategorieMeta {
  label: string
  couleur: string
  Icon: LucideIcon
}

export const POI_CATEGORIES: Record<PoiCategorie, CategorieMeta> = {
  randonnee: { label: 'Randonnée', couleur: '#E8824A', Icon: Mountain },
  vue_panoramique: { label: 'Vue panoramique', couleur: '#9B8CFF', Icon: Telescope },
  cascade: { label: 'Cascade', couleur: '#5BBFBA', Icon: Droplets },
  glacier: { label: 'Glacier', couleur: '#A8DCFF', Icon: Snowflake },
  village: { label: 'Village', couleur: '#F0C04A', Icon: Home },
  ferry: { label: 'Ferry', couleur: '#6FA8FF', Icon: Ship },
  bivouac: { label: 'Bivouac', couleur: '#7FD08C', Icon: Tent },
  activite: { label: 'Activité', couleur: '#FF7FA0', Icon: Ticket },
}

export const POI_CATEGORIE_LIST = Object.keys(POI_CATEGORIES) as PoiCategorie[]

export const NUIT_TYPES: Record<NuitType, { label: string; Icon: LucideIcon }> = {
  camping: { label: 'Camping', Icon: Tent },
  bivouac: { label: 'Bivouac', Icon: TreePine },
  parking: { label: 'Parking / van', Icon: Caravan },
  hotel: { label: 'Hôtel', Icon: BedDouble },
  autre: { label: 'Autre', Icon: MapPin },
}

export const DEPENSE_CATEGORIES: Record<DepenseCategorie, CategorieMeta> = {
  transport: { label: 'Transport', couleur: '#6FA8FF', Icon: Bus },
  van: { label: 'Van', couleur: '#E8824A', Icon: Caravan },
  carburant: { label: 'Carburant', couleur: '#F0C04A', Icon: Fuel },
  activites: { label: 'Activités', couleur: '#FF7FA0', Icon: Activity },
  nourriture: { label: 'Nourriture', couleur: '#7FD08C', Icon: UtensilsCrossed },
  hebergement: { label: 'Hébergement', couleur: '#9B8CFF', Icon: BedDouble },
  divers: { label: 'Divers', couleur: '#8CA3B8', Icon: PiggyBank },
}

export const DEPENSE_CATEGORIE_LIST = Object.keys(DEPENSE_CATEGORIES) as DepenseCategorie[]

export const TACHE_CATEGORIES: Record<TacheCategorie, { label: string; Icon: LucideIcon }> = {
  packing: { label: 'Packing', Icon: Package },
  avant_depart: { label: 'Avant le départ', Icon: Ticket },
}

/** Taux de change fixe par défaut (modifiable dans l'app, persisté en localStorage). */
export const NOK_PAR_EUR_DEFAUT = 11.5

/** Clés localStorage — `total_budget` est imposée par la spec. */
export const LS_KEYS = {
  budget: 'total_budget',
  nokRate: 'nok_par_eur',
  shareCode: 'share_code',
  reservations: 'reservations',
  pokedex: 'pokedex_observations_v1',
  localDb: 'nrt_local_db_v1',
  routeCache: 'nrt_route_cache_v1',
} as const

export const CENTRE_NORVEGE: google.maps.LatLngLiteral = { lat: 60.7, lng: 8.2 }
