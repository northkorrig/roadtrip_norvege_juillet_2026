import { Loader } from '@googlemaps/js-api-loader'
import { useEffect, useState } from 'react'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export const hasMapsKey: boolean = Boolean(apiKey)

let loadPromise: Promise<typeof google> | null = null

/** Charge l'API Google Maps une seule fois pour toute l'app (singleton). */
export function loadGoogleMaps(): Promise<typeof google> {
  if (!apiKey) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY manquante dans .env.local'))
  }
  loadPromise ??= new Loader({
    apiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
    language: 'fr',
    region: 'NO',
  }).load()
  return loadPromise
}

export type MapsStatus = 'absent' | 'chargement' | 'pret' | 'erreur'

export function useGoogleMapsReady(): MapsStatus {
  const [status, setStatus] = useState<MapsStatus>(hasMapsKey ? 'chargement' : 'absent')
  useEffect(() => {
    if (!hasMapsKey) return
    let mounted = true
    loadGoogleMaps()
      .then(() => {
        if (mounted) setStatus('pret')
      })
      .catch(() => {
        if (mounted) setStatus('erreur')
      })
    return () => {
      mounted = false
    }
  }, [])
  return status
}

/** Style "nuit norvégienne" aligné sur la palette de l'app. */
export function mapStyles(avecPoiGoogle: boolean): google.maps.MapTypeStyle[] {
  return [
    { elementType: 'geometry', stylers: [{ color: '#0f1f30' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8aa3b8' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1E3650' }] },
    { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#a9bccd' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#112233' }] },
    { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#142b3d' }] },
    { featureType: 'poi', stylers: [{ visibility: avecPoiGoogle ? 'simplified' : 'off' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f8ba1' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#122c34' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#22394f' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7d95aa' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2d4a66' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1521' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3f6f7d' }] },
  ]
}

export function baseMapOptions(): google.maps.MapOptions {
  return {
    styles: mapStyles(false),
    disableDefaultUI: true,
    zoomControl: true,
    fullscreenControl: false,
    gestureHandling: 'greedy',
    backgroundColor: '#0D1B2A',
    clickableIcons: false,
    minZoom: 4,
  }
}

/** Liens externes de navigation. */
export function lienGoogleMaps(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
}

export function lienWaze(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

export function lienStreetView(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
}
