export type SousTypeBivouac = 'camp_site' | 'caravan_site' | 'wilderness_hut' | 'shelter'

export interface SpotBivouac {
  osmId: string
  nom: string
  sousType: SousTypeBivouac
  lat: number
  lng: number
  operateur: string | null
  fee: boolean | null
  website: string | null
  distanceKm: number
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function detecterSousType(tags: Record<string, string>): SousTypeBivouac {
  if (tags.tourism === 'wilderness_hut') return 'wilderness_hut'
  if (tags.tourism === 'caravan_site') return 'caravan_site'
  if (tags.amenity === 'shelter') return 'shelter'
  return 'camp_site'
}

/** Miroirs Overpass essayés dans l'ordre — tous publics, certains bloquent
 *  parfois le CORS ou saturent ; on bascule sur le suivant en cas d'échec. */
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
] as const

async function requeteOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassElement[] }> {
  let derniereErreur: Error | null = null
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal,
      })
      if (!res.ok) throw new Error(`Overpass API : erreur ${res.status}`)
      return (await res.json()) as { elements: OverpassElement[] }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      derniereErreur = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw derniereErreur ?? new Error('Tous les serveurs Overpass sont indisponibles')
}

export async function chercherBivouacs(
  lat: number,
  lng: number,
  rayonKm: number,
  signal?: AbortSignal,
): Promise<SpotBivouac[]> {
  const r = rayonKm * 1000
  const q =
    `[out:json][timeout:30];` +
    `(` +
    `node["tourism"~"^(camp_site|caravan_site|wilderness_hut)$"](around:${r},${lat},${lng});` +
    `node["amenity"="shelter"](around:${r},${lat},${lng});` +
    `way["tourism"~"^(camp_site|caravan_site|wilderness_hut)$"](around:${r},${lat},${lng});` +
    `way["amenity"="shelter"](around:${r},${lat},${lng});` +
    `);` +
    `out center tags;`

  const json = await requeteOverpass(q, signal)
  const seen = new Set<number>()
  const results: SpotBivouac[] = []

  for (const el of json.elements) {
    if (seen.has(el.id)) continue
    seen.add(el.id)

    const elLat = el.type === 'node' ? el.lat : el.center?.lat
    const elLng = el.type === 'node' ? el.lon : el.center?.lon
    if (elLat == null || elLng == null) continue

    const tags = el.tags ?? {}
    const nom = tags.name ?? tags['name:en'] ?? tags['name:no'] ?? 'Spot sans nom'

    results.push({
      osmId: `${el.type}/${el.id}`,
      nom,
      sousType: detecterSousType(tags),
      lat: elLat,
      lng: elLng,
      operateur: tags.operator ?? tags.brand ?? null,
      fee: tags.fee === 'yes' ? true : tags.fee === 'no' ? false : null,
      website: tags.website ?? tags.url ?? null,
      distanceKm: haversineKm(lat, lng, elLat, elLng),
    })
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm)
}
