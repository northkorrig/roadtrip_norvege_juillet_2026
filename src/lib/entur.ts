import { haversineKm } from './overpass'

export interface DepartFerry {
  /** ISO datetime du départ attendu (temps réel si dispo, sinon horaire prévu). */
  heure: string
  destination: string
  ligne: string
  realtime: boolean
}

export interface QuaiFerry {
  id: string
  nom: string
  lat: number
  lng: number
  distanceKm: number
  departs: DepartFerry[]
}

/** Entur — planificateur national norvégien. API GraphQL publique, sans clé :
 *  seul l'en-tête ET-Client-Name (identifiant courtois) est requis.
 *  Couvre tous les ferries voiture (mode "water"). */
const ENDPOINT = 'https://api.entur.io/journey-planner/v3/graphql'

const QUERY = `query Ferries($lat: Float!, $lng: Float!, $dist: Int!) {
  nearest(
    latitude: $lat
    longitude: $lng
    maximumDistance: $dist
    maximumResults: 15
    filterByPlaceTypes: [stopPlace]
    filterByModes: [water]
  ) {
    edges {
      node {
        distance
        place {
          __typename
          ... on StopPlace {
            id
            name
            latitude
            longitude
            estimatedCalls(numberOfDepartures: 4, timeRange: 86400) {
              expectedDepartureTime
              aimedDepartureTime
              realtime
              destinationDisplay { frontText }
              serviceJourney { line { publicCode name transportMode } }
            }
          }
        }
      }
    }
  }
}`

interface EnturCall {
  expectedDepartureTime: string | null
  aimedDepartureTime: string | null
  realtime: boolean
  destinationDisplay?: { frontText?: string }
  serviceJourney?: { line?: { publicCode?: string; name?: string; transportMode?: string } }
}

interface EnturStopPlace {
  __typename: string
  id: string
  name: string
  latitude: number
  longitude: number
  estimatedCalls?: EnturCall[]
}

export async function chercherFerries(
  lat: number,
  lng: number,
  rayonKm: number,
  signal?: AbortSignal,
): Promise<QuaiFerry[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ET-Client-Name': 'roadtrip-norvege-app' },
    body: JSON.stringify({ query: QUERY, variables: { lat, lng, dist: Math.round(rayonKm * 1000) } }),
    signal,
  })
  if (!res.ok) throw new Error(`Entur API : erreur ${res.status}`)

  const json = (await res.json()) as {
    data?: { nearest?: { edges?: { node?: { place?: EnturStopPlace } }[] } }
    errors?: { message: string }[]
  }
  if (json.errors?.length) throw new Error(`Entur : ${json.errors[0].message}`)

  const edges = json.data?.nearest?.edges ?? []
  const quais: QuaiFerry[] = []

  for (const edge of edges) {
    const place = edge.node?.place
    if (!place || place.__typename !== 'StopPlace') continue

    const departs: DepartFerry[] = (place.estimatedCalls ?? [])
      .filter((c) => {
        const mode = c.serviceJourney?.line?.transportMode
        return mode == null || mode === 'water'
      })
      .map((c) => {
        const ligne = c.serviceJourney?.line
        return {
          heure: c.expectedDepartureTime ?? c.aimedDepartureTime ?? '',
          destination: c.destinationDisplay?.frontText ?? '—',
          ligne: ligne?.publicCode ?? ligne?.name ?? 'Ferry',
          realtime: c.realtime,
        }
      })
      .filter((d) => d.heure !== '')

    quais.push({
      id: place.id,
      nom: place.name,
      lat: place.latitude,
      lng: place.longitude,
      distanceKm: haversineKm(lat, lng, place.latitude, place.longitude),
      departs,
    })
  }

  return quais.sort((a, b) => a.distanceKm - b.distanceKm)
}
