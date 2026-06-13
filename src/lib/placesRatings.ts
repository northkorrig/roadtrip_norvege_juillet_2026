import { haversineKm, type SpotBivouac } from './overpass'

/** Note Google attachée à un spot OSM (croisement par proximité géographique). */
export interface NoteGoogle {
  rating: number
  total: number
  placeId: string
}

interface PlaceBrut {
  lat: number
  lng: number
  note: NoteGoogle
}

/** Distance max pour considérer qu'un lieu Google et un spot OSM sont le même endroit. */
const SEUIL_MATCH_KM = 0.3

/** Lien vers la fiche Google Maps (notes + avis utilisateurs). */
export function lienAvisGoogle(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`
}

/**
 * Types Google Places interrogés. On ne se limite plus aux campings : les
 * "spots remarquables" (points de vue, plages, aires de pique-nique) sont
 * référencés sous tourist_attraction / natural_feature et portent eux aussi
 * des avis de la communauté.
 */
const TYPES_PLACES = ['campground', 'tourist_attraction', 'natural_feature'] as const

/** Une passe de nearbySearch (jusqu'à 60 résultats, 3 pages). */
function nearbyNotes(
  service: google.maps.places.PlacesService,
  lat: number,
  lng: number,
  rayonKm: number,
  type: string,
): Promise<PlaceBrut[]> {
  return new Promise((resolve) => {
    const places: PlaceBrut[] = []
    let pages = 0
    service.nearbySearch(
      { location: { lat, lng }, radius: Math.min(rayonKm, 50) * 1000, type },
      (results, status, pagination) => {
        if (status === 'OK' && results) {
          for (const r of results) {
            const loc = r.geometry?.location
            if (!loc || r.rating == null || !r.place_id) continue
            places.push({
              lat: loc.lat(),
              lng: loc.lng(),
              note: { rating: r.rating, total: r.user_ratings_total ?? 0, placeId: r.place_id },
            })
          }
          pages += 1
          // Google impose ~2 s entre les pages, et nextPage() rappelle ce callback.
          if (pagination?.hasNextPage && pages < 3) {
            pagination.nextPage()
            return
          }
        }
        resolve(places)
      },
    )
  })
}

/**
 * Récupère les lieux notés sur Google Places autour d'un point (campings et
 * spots remarquables), puis les associe aux spots OSM par proximité (< 300 m,
 * le plus proche gagne). Retourne un index osmId → note. Vide si l'API Places
 * n'est pas dispo.
 */
export async function chercherNotesGoogle(
  lat: number,
  lng: number,
  rayonKm: number,
  spots: SpotBivouac[],
): Promise<Record<string, NoteGoogle>> {
  if (typeof google === 'undefined' || !google.maps?.places) return {}
  if (spots.length === 0) return {}

  const service = new google.maps.places.PlacesService(document.createElement('div'))
  const lots = await Promise.all(TYPES_PLACES.map((t) => nearbyNotes(service, lat, lng, rayonKm, t)))
  const places: PlaceBrut[] = lots.flat()

  const out: Record<string, NoteGoogle> = {}
  for (const spot of spots) {
    let meilleure: { d: number; note: NoteGoogle } | null = null
    for (const p of places) {
      const d = haversineKm(spot.lat, spot.lng, p.lat, p.lng)
      if (d <= SEUIL_MATCH_KM && (!meilleure || d < meilleure.d)) {
        meilleure = { d, note: p.note }
      }
    }
    if (meilleure) out[spot.osmId] = meilleure.note
  }
  return out
}
