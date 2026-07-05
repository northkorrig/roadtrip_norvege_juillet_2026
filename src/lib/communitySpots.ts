import { haversineKm, type SpotBivouac } from './overpass'

/** Forme renvoyée par la fonction serverless /api/spots. */
interface ApiSpot {
  id: string
  nom: string
  lat: number
  lng: number
  description: string | null
  website: string | null
}

/**
 * Récupère les "lieux remarquables" communautaires (Wikipédia) autour d'un
 * point via la fonction serverless /api/spots, et les normalise au format
 * SpotBivouac (sousType 'remarquable') pour s'afficher dans la même carte/liste.
 *
 * Tolérant aux pannes : en l'absence de la fonction (ex. `vite dev` sans
 * `vercel dev`) ou en cas d'erreur réseau, renvoie une liste vide.
 */
export async function chercherLieuxRemarquables(
  lat: number,
  lng: number,
  rayonKm: number,
  signal?: AbortSignal,
): Promise<SpotBivouac[]> {
  try {
    const res = await fetch(`/api/spots?lat=${lat}&lng=${lng}&radius=${rayonKm}`, { signal })
    if (!res.ok) return []
    const json = (await res.json()) as { spots?: ApiSpot[] }
    return (json.spots ?? []).map<SpotBivouac>((s) => ({
      osmId: s.id,
      nom: s.nom,
      sousType: 'remarquable',
      lat: s.lat,
      lng: s.lng,
      operateur: null,
      dnt: false,
      fee: null,
      eau: null,
      feu: null,
      toilettes: null,
      website: s.website,
      description: s.description,
      distanceKm: haversineKm(lat, lng, s.lat, s.lng),
      // Coordonnée d'article Wikipédia : pointe le sujet, pas toujours le spot exact
      approx: true,
    }))
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err
    return []
  }
}
