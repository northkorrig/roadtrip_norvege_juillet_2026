// Fonction serverless (Vercel Edge) — agrège des "lieux remarquables" documentés
// par la communauté autour d'un point, pour enrichir la recherche de spots.
//
// Source actuelle : GeoSearch de Wikipédia (fr + en). Libre, sans clé, bonne
// couverture de la Norvège. On l'appelle côté serveur pour mutualiser le cache
// CDN et éviter les soucis de CORS / multi-requêtes côté navigateur.
//
// Pourquoi pas iOverlander / park4night ? Leur export pays est désormais réservé
// aux abonnés (livré par e-mail) et leurs API d'app sont privées/non documentées
// (usage contraire à leurs CGU). On garde donc une source réellement ouverte ;
// le format de réponse ci-dessous est générique pour pouvoir en brancher d'autres.

export const config = { runtime: 'edge' }

const LANGS = ['fr', 'en'] as const
const TILE_RADIUS_KM = 10 // gsradius est plafonné à 10 km côté MediaWiki
const TILE_STEP_KM = 14 // espacement des tuiles (cercles de 10 km qui se chevauchent)
const MAX_TILES = 9 // borne le nombre d'appels Wikipédia (politesse + latence)
const WIKI_RADIUS_CAP_KM = 25 // au-delà, on garde la recherche rapide
const MAX_RESULTS = 120
const UA = 'NorwayRoadtripPlanner/1.0 (https://github.com/northkorrig/roadtrip_norvege_juillet_2026)'

interface Spot {
  id: string
  nom: string
  lat: number
  lng: number
  description: string | null
  website: string | null
  source: 'wikipedia'
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

/** Tuiles couvrant un disque de rayon `radiusKm` avec des cercles de 10 km. */
function tuiles(lat: number, lng: number, radiusKm: number): { lat: number; lng: number }[] {
  if (radiusKm <= TILE_RADIUS_KM) return [{ lat, lng }]
  const kmPerLng = 111 * Math.cos((lat * Math.PI) / 180)
  const out: { lat: number; lng: number }[] = []
  for (let dy = -radiusKm; dy <= radiusKm; dy += TILE_STEP_KM) {
    for (let dx = -radiusKm; dx <= radiusKm; dx += TILE_STEP_KM) {
      if (Math.hypot(dx, dy) > radiusKm + TILE_RADIUS_KM) continue
      out.push({ lat: lat + dy / 111, lng: lng + dx / kmPerLng })
    }
  }
  return out.slice(0, MAX_TILES)
}

async function chercherTuile(lang: string, lat: number, lng: number, radiusM: number): Promise<Spot[]> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'geosearch',
    ggscoord: `${lat}|${lng}`,
    ggsradius: String(radiusM),
    ggslimit: '50',
    prop: 'coordinates|info|extracts',
    inprop: 'url',
    explaintext: '1',
    exsentences: '2',
    exlimit: 'max',
  }).toString()

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': UA, 'Api-User-Agent': UA },
  })
  if (!res.ok) return []
  const json = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          pageid: number
          title: string
          fullurl?: string
          extract?: string
          coordinates?: { lat: number; lon: number }[]
        }
      >
    }
  }
  const pages = json.query?.pages ?? {}
  const out: Spot[] = []
  for (const p of Object.values(pages)) {
    const coord = p.coordinates?.[0]
    if (!coord) continue
    const extract = typeof p.extract === 'string' ? p.extract.trim() : ''
    out.push({
      id: `wiki/${lang}/${p.pageid}`,
      nom: p.title,
      lat: coord.lat,
      lng: coord.lon,
      description: extract.length > 0 ? extract : null,
      website: p.fullurl ?? `https://${lang}.wikipedia.org/?curid=${p.pageid}`,
      source: 'wikipedia',
    })
  }
  return out
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  const radiusRaw = Number(searchParams.get('radius'))

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return new Response(JSON.stringify({ error: 'Paramètres lat/lng invalides' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const radius = Math.min(50, Math.max(1, Number.isFinite(radiusRaw) ? radiusRaw : 20))
  const wikiRadius = Math.min(radius, WIKI_RADIUS_CAP_KM)
  const tileM = Math.round(Math.min(wikiRadius, TILE_RADIUS_KM) * 1000)

  const jobs: Promise<Spot[]>[] = []
  for (const lang of LANGS) {
    for (const pt of tuiles(lat, lng, wikiRadius)) {
      jobs.push(chercherTuile(lang, pt.lat, pt.lng, tileM))
    }
  }

  const lots = await Promise.allSettled(jobs)
  // Dédup par proximité (~110 m). On itère fr d'abord (priorité à la fiche
  // française), puis on remplace si une autre langue offre une description plus riche.
  const parCle = new Map<string, Spot & { distanceKm: number }>()
  for (const lot of lots) {
    if (lot.status !== 'fulfilled') continue
    for (const s of lot.value) {
      const d = haversineKm(lat, lng, s.lat, s.lng)
      if (d > radius) continue
      const cle = `${s.lat.toFixed(3)},${s.lng.toFixed(3)}`
      const existant = parCle.get(cle)
      if (!existant || (s.description?.length ?? 0) > (existant.description?.length ?? 0)) {
        parCle.set(cle, { ...s, distanceKm: d })
      }
    }
  }

  const spots = [...parCle.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_RESULTS)

  return new Response(JSON.stringify({ spots }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Cache CDN Vercel par URL (lat/lng/radius) : 1 j frais, 7 j en revalidation.
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
