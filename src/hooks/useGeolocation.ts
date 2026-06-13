import { useCallback, useState } from 'react'
import type { LatLng } from '../types/db'

interface GeolocEtat {
  position: LatLng | null
  chargement: boolean
  erreur: string | null
}

/** Récupère la position GPS de l'appareil (pour "Autour de moi" sur la route). */
export function useGeolocation(): GeolocEtat & { localiser: () => Promise<LatLng | null> } {
  const [etat, setEtat] = useState<GeolocEtat>({ position: null, chargement: false, erreur: null })

  const localiser = useCallback((): Promise<LatLng | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setEtat({ position: null, chargement: false, erreur: 'Géolocalisation indisponible sur cet appareil' })
      return Promise.resolve(null)
    }
    setEtat((s) => ({ ...s, chargement: true, erreur: null }))
    return new Promise<LatLng | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setEtat({ position: p, chargement: false, erreur: null })
          resolve(p)
        },
        (err) => {
          const erreur =
            err.code === err.PERMISSION_DENIED
              ? 'Accès à la position refusé — autorise la localisation dans ton navigateur'
              : err.code === err.TIMEOUT
                ? 'Localisation trop longue, réessaie'
                : 'Position introuvable'
          setEtat({ position: null, chargement: false, erreur })
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
      )
    })
  }, [])

  return { ...etat, localiser }
}
