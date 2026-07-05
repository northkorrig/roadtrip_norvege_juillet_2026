export type SousTypeBivouac =
  | 'camp_site'
  | 'caravan_site'
  | 'wilderness_hut'
  | 'alpine_hut'
  | 'gapahuk'
  | 'shelter'
  | 'viewpoint'
  | 'picnic'
  | 'beach'
  | 'rest_area'
  /** Lieu remarquable documenté par la communauté (Wikipédia), via /api/spots. */
  | 'remarquable'
  /** Spot de nuit réputé, sélection éditoriale embarquée (voir curatedSpots.ts). */
  | 'selection'
  /** Station de vidange eaux grises / WC chimique (service van). */
  | 'sanitary_dump'
  /** Station-service. */
  | 'fuel'

export interface SpotBivouac {
  osmId: string
  /** null si le spot n'a pas de nom dans OSM (fréquent pour les abris, plages, points de vue). */
  nom: string | null
  sousType: SousTypeBivouac
  lat: number
  lng: number
  operateur: string | null
  /** Géré par le DNT / une turistforening locale (réseau du club alpin norvégien). */
  dnt: boolean
  fee: boolean | null
  /** Équipements (null = inconnu dans OSM). */
  eau: boolean | null
  feu: boolean | null
  toilettes: boolean | null
  website: string | null
  description: string | null
  distanceKm: number
  /** Position à vérifier (coordonnée d'article Wikipédia ou repère non recalé). */
  approx?: boolean
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function detecterSousType(tags: Record<string, string>): SousTypeBivouac {
  // Services van
  if (tags.amenity === 'sanitary_dump_station') return 'sanitary_dump'
  if (tags.amenity === 'fuel') return 'fuel'

  // Spots remarquables / nature en priorité : ce sont eux qui manquaient à l'appel
  // quand on ne cherchait que les campings et les refuges.
  if (tags.tourism === 'viewpoint') return 'viewpoint'
  if (tags.natural === 'beach') return 'beach'
  if (tags.highway === 'rest_area') return 'rest_area'
  if (tags.tourism === 'picnic_site' || tags.leisure === 'firepit') return 'picnic'

  if (tags.tourism === 'alpine_hut') return 'alpine_hut'
  if (tags.tourism === 'wilderness_hut') return 'wilderness_hut'
  if (tags.tourism === 'caravan_site') return 'caravan_site'
  if (tags.amenity === 'shelter') {
    // Les gapahuks norvégiens (abris ouverts en bois, parfaits pour bivouaquer)
    // sont tagués lean_to ; on les distingue des simples abris de pluie.
    return tags.shelter_type === 'lean_to' || tags.shelter_type === 'gapahuk' ? 'gapahuk' : 'shelter'
  }
  // tourism=camp_site et tourism=camp_pitch (emplacements informels)
  return 'camp_site'
}

function bool3(v: string | undefined): boolean | null {
  if (v === undefined || v === '') return null
  return v !== 'no' && v !== 'none'
}

/** DNT et turistforeninger locales (Den Norske Turistforening — données issues
 *  de la Nasjonal Turbase, importées dans OSM). */
function estDnt(tags: Record<string, string>): boolean {
  const op = `${tags.operator ?? ''} ${tags.brand ?? ''} ${tags.network ?? ''}`.toLowerCase()
  return /\bdnt\b|turistforening|turlag/.test(op)
}


/** Miroirs Overpass essayés dans l'ordre — tous publics, certains bloquent
 *  parfois le CORS ou saturent ; on bascule sur le suivant en cas d'échec. */
const OVERPASS_ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
] as const

/** Délai serveur demandé à Overpass (l'API coupe elle-même la requête au-delà
 *  et répond proprement). DOIT rester inférieur au délai client ci-dessous,
 *  sinon on tue des requêtes lourdes qui allaient aboutir. */
const OVERPASS_TIMEOUT_SERVEUR_S = 25

/** Délai max côté client par miroir : un fetch navigateur sans timeout peut
 *  rester suspendu plusieurs minutes si le serveur accepte la connexion sans
 *  jamais répondre — c'est ce qui figeait la recherche avec un spinner infini.
 *  Marge de 5 s au-delà du délai serveur (réseau + file d'attente). */
const OVERPASS_TIMEOUT_MS = (OVERPASS_TIMEOUT_SERVEUR_S + 5) * 1000

/**
 * Combine un signal d'annulation externe avec un timeout : la requête est
 * abandonnée si l'un OU l'autre se déclenche.
 */
export function signalAvecTimeout(ms: number, externe?: AbortSignal): AbortSignal {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(new DOMException('Délai dépassé', 'TimeoutError')), ms)
  if (externe) {
    const relayer = (): void => {
      clearTimeout(timer)
      ctrl.abort(externe.reason as Error | undefined)
    }
    if (externe.aborted) relayer()
    else externe.addEventListener('abort', relayer, { once: true })
  }
  return ctrl.signal
}

async function requeteOverpass(query: string, signal?: AbortSignal): Promise<{ elements: OverpassElement[] }> {
  let derniereErreur: Error | null = null
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        signal: signalAvecTimeout(OVERPASS_TIMEOUT_MS, signal),
      })
      if (!res.ok) throw new Error(`Overpass API : erreur ${res.status}`)
      return (await res.json()) as { elements: OverpassElement[] }
    } catch (err) {
      // Annulation demandée par l'appelant (nouvelle recherche) : on remonte.
      // Un timeout de miroir, lui, bascule simplement sur le miroir suivant.
      if (signal?.aborted) throw err instanceof Error ? err : new Error(String(err))
      derniereErreur =
        err instanceof Error && err.name === 'AbortError'
          ? new Error('Overpass : délai dépassé')
          : err instanceof Error
            ? err
            : new Error(String(err))
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
  const a = `(around:${r},${lat},${lng})`
  // On ratisse large : hébergements (campings, refuges, abris), emplacements
  // informels (camp_pitch), aires de repos pour van, et surtout les "spots
  // remarquables" repérés par la communauté OSM — points de vue, plages,
  // aires de pique-nique et foyers de bivouac.
  const q =
    `[out:json][timeout:${OVERPASS_TIMEOUT_SERVEUR_S}];` +
    `(` +
    `node["tourism"~"^(camp_site|caravan_site|wilderness_hut|alpine_hut|camp_pitch|picnic_site|viewpoint)$"]${a};` +
    `way["tourism"~"^(camp_site|caravan_site|wilderness_hut|alpine_hut|camp_pitch|picnic_site)$"]${a};` +
    `node["amenity"="shelter"]${a};` +
    `way["amenity"="shelter"]${a};` +
    `node["leisure"="firepit"]${a};` +
    `node["highway"="rest_area"]${a};` +
    `way["highway"="rest_area"]${a};` +
    // Services van : vidange eaux grises / WC chimique + carburant
    `node["amenity"="sanitary_dump_station"]${a};` +
    `way["amenity"="sanitary_dump_station"]${a};` +
    `node["amenity"="fuel"]${a};` +
    `way["amenity"="fuel"]${a};` +
    `node["natural"="beach"]${a};` +
    `way["natural"="beach"]${a};` +
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
    const nom = tags.name ?? tags['name:en'] ?? tags['name:no'] ?? null

    results.push({
      osmId: `${el.type}/${el.id}`,
      nom,
      sousType: detecterSousType(tags),
      lat: elLat,
      lng: elLng,
      operateur: tags.operator ?? tags.brand ?? null,
      dnt: estDnt(tags),
      fee: tags.fee === 'yes' ? true : tags.fee === 'no' ? false : null,
      eau: bool3(tags.drinking_water ?? tags.water),
      feu: bool3(tags.openfire ?? tags.fireplace ?? (tags.leisure === 'firepit' ? 'yes' : undefined)),
      toilettes: bool3(tags.toilets),
      website: tags.website ?? tags.url ?? null,
      description: tags.description ?? tags['description:no'] ?? null,
      distanceKm: haversineKm(lat, lng, elLat, elLng),
    })
  }

  return results.sort((a, b) => a.distanceKm - b.distanceKm)
}
