import { LS_KEYS } from '../config/constants'
import type { LatLng } from '../types/db'

export interface RouteLeg {
  km: number
  min: number
}

export interface RouteResult {
  path: LatLng[]
  legs: RouteLeg[]
}

function cacheKey(stops: LatLng[]): string {
  const s = stops.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|')
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return `${LS_KEYS.routeCache}:${h}`
}

function readCache(key: string): RouteResult | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as RouteResult) : null
  } catch {
    return null
  }
}

function writeCache(key: string, value: RouteResult): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota localStorage atteint : on vit sans cache
  }
}

/**
 * Route réelle (par la route, pas à vol d'oiseau) via Directions API.
 * Résultat mis en cache en localStorage pour économiser le quota.
 */
export async function fetchDrivingRoute(stops: LatLng[], forcer = false): Promise<RouteResult> {
  if (stops.length < 2) throw new Error('Itinéraire : il faut au moins 2 étapes géolocalisées')
  if (stops.length > 25) throw new Error('Directions API : 25 points maximum par requête')

  const key = cacheKey(stops)
  if (!forcer) {
    const cached = readCache(key)
    if (cached) return cached
  }

  const service = new google.maps.DirectionsService()
  const result = await service.route({
    origin: stops[0],
    destination: stops[stops.length - 1],
    waypoints: stops.slice(1, -1).map((location) => ({ location, stopover: true })),
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'NO',
  })

  const route = result.routes[0]
  if (!route) throw new Error('Directions API : aucune route trouvée')

  const path = route.overview_path.map((p) => ({
    lat: Number(p.lat().toFixed(5)),
    lng: Number(p.lng().toFixed(5)),
  }))
  const legs = route.legs.map((leg) => ({
    km: Math.round(((leg.distance?.value ?? 0) / 1000) * 10) / 10,
    min: Math.round((leg.duration?.value ?? 0) / 60),
  }))

  const value = { path, legs }
  writeCache(key, value)
  return value
}

/**
 * Optimisation de l'ordre des étapes intermédiaires (premier et dernier fixes).
 * Retourne les index des étapes intermédiaires dans leur nouvel ordre.
 */
export async function optimizeWaypointOrder(stops: LatLng[]): Promise<number[]> {
  if (stops.length < 4) return stops.slice(1, -1).map((_, i) => i)
  const service = new google.maps.DirectionsService()
  const result = await service.route({
    origin: stops[0],
    destination: stops[stops.length - 1],
    waypoints: stops.slice(1, -1).map((location) => ({ location, stopover: true })),
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode.DRIVING,
    region: 'NO',
  })
  const route = result.routes[0]
  if (!route) throw new Error('Directions API : aucune route trouvée')
  return route.waypoint_order
}

/** Trace de secours : segments droits entre étapes (sans Directions API). */
export function straightPath(stops: LatLng[]): RouteResult {
  return { path: stops, legs: [] }
}
