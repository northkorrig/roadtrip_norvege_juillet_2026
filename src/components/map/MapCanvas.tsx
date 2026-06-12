import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CENTRE_NORVEGE } from '../../config/constants'
import { baseMapOptions, useGoogleMapsReady } from '../../lib/googleMaps'
import type { LatLng } from '../../types/db'
import MapFallback from './MapFallback'

interface MapCanvasProps {
  className?: string
  options?: google.maps.MapOptions
  onReady?: (map: google.maps.Map) => void
  onMapClick?: (position: LatLng) => void
  fallbackMessage?: boolean
}

/**
 * Conteneur Google Maps thème nuit. Si la clé API manque ou échoue,
 * affiche le décor MapFallback à la place (l'app reste fonctionnelle).
 */
export default function MapCanvas({
  className = '',
  options,
  onReady,
  onMapClick,
  fallbackMessage = true,
}: MapCanvasProps): ReactNode {
  const status = useGoogleMapsReady()
  const divRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const optionsRef = useRef(options)

  useEffect(() => {
    if (status !== 'pret' || !divRef.current || map) return
    const instance = new google.maps.Map(divRef.current, {
      center: CENTRE_NORVEGE,
      zoom: 6,
      ...baseMapOptions(),
      ...optionsRef.current,
    })
    setMap(instance)
  }, [status, map])

  useEffect(() => {
    if (map && onReady) onReady(map)
  }, [map, onReady])

  useEffect(() => {
    if (!map || !onMapClick) return
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })
    })
    return () => listener.remove()
  }, [map, onMapClick])

  if (status === 'absent' || status === 'erreur') {
    return <MapFallback status={status} className={className} message={fallbackMessage} />
  }

  return (
    <div className={`relative overflow-hidden bg-night-deep ${className}`}>
      <div ref={divRef} className="absolute inset-0" />
      {status === 'chargement' && (
        <div className="absolute inset-0 flex items-center justify-center bg-night-deep">
          <div className="flex items-center gap-3 text-sm text-cream-dim">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-glacier/30 border-t-glacier" />
            Chargement de la carte…
          </div>
        </div>
      )}
    </div>
  )
}
