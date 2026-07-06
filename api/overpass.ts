// Fonction serverless (Vercel Edge) — proxy vers l'API Overpass (OpenStreetMap).
//
// Pourquoi un proxy ? Appelé directement depuis le navigateur, Overpass échoue
// chez certains utilisateurs (miroirs qui refusent le CORS, réseaux mobiles qui
// filtrent, miroirs saturés) — alors que les mêmes appareils joignent sans
// souci nos fonctions /api/*. On relaie donc la requête côté serveur : plus de
// CORS, choix du miroir maîtrisé, timeout net. Même schéma que /api/spots.
//
// Le client POST la requête Overpass QL brute dans le corps ; on la transmet au
// premier miroir qui répond et on renvoie le JSON tel quel.

export const config = { runtime: 'edge' }

const MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
] as const

const TIMEOUT_MS = 25_000
const MAX_QUERY_LEN = 4000

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST attendu' }), {
      status: 405,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  const query = (await req.text()).trim()
  if (!query || query.length > MAX_QUERY_LEN) {
    return new Response(JSON.stringify({ error: 'Requête invalide' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    })
  }

  let dernierStatut = 502
  for (const mirror of MIRRORS) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) {
        dernierStatut = res.status
        continue
      }
      const body = await res.text()
      return new Response(body, {
        status: 200,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          // Cache CDN Vercel par requête : 1 h frais, 1 j en revalidation. Les
          // campings/refuges bougent peu, ça soulage les miroirs et accélère.
          'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      })
    } catch {
      clearTimeout(timer)
      // timeout / réseau : on tente le miroir suivant
    }
  }

  return new Response(JSON.stringify({ error: 'Overpass indisponible', elements: [] }), {
    status: 502,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}
