import { MarkerClusterer, type Cluster } from '@googlemaps/markerclusterer'
import { useEffect } from 'react'
import { POI_CATEGORIES } from '../../config/constants'
import type { Etape, LatLng, Poi, PoiCategorie } from '../../types/db'

export function etapeIcon(selectionne: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: selectionne ? 13 : 10.5,
    fillColor: '#E8824A',
    fillOpacity: 1,
    strokeColor: selectionne ? '#F0EDE6' : '#0D1B2A',
    strokeWeight: 2.5,
  }
}

export function poiIcon(categorie: PoiCategorie, selectionne: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: selectionne ? 9 : 6.5,
    fillColor: POI_CATEGORIES[categorie].couleur,
    fillOpacity: 0.95,
    strokeColor: '#0D1B2A',
    strokeWeight: 2,
  }
}

const clusterRenderer = {
  render(cluster: Cluster): google.maps.Marker {
    const count = cluster.count
    return new google.maps.Marker({
      position: cluster.position,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 13 + Math.min(count, 10),
        fillColor: '#5BBFBA',
        fillOpacity: 0.85,
        strokeColor: '#0D1B2A',
        strokeWeight: 2,
      },
      label: { text: String(count), color: '#0D1B2A', fontWeight: '800', fontSize: '12px' },
      zIndex: 200,
    })
  },
}

interface TripMarkersOptions {
  etapes?: Etape[]
  pois?: Poi[]
  etapeSelectionnee?: string | null
  poiSelectionne?: string | null
  onEtapeClick?: (etape: Etape) => void
  onPoiClick?: (poi: Poi) => void
  clusterPois?: boolean
}

/**
 * Pose les markers (étapes numérotées + POIs colorés par catégorie) sur la
 * carte, avec clustering optionnel. Les callbacks doivent être stabilisés
 * (useCallback) par l'appelant pour éviter les reconstructions inutiles.
 */
export function useTripMarkers(map: google.maps.Map | null, options: TripMarkersOptions): void {
  const {
    etapes = [],
    pois = [],
    etapeSelectionnee = null,
    poiSelectionne = null,
    onEtapeClick,
    onPoiClick,
    clusterPois = true,
  } = options

  useEffect(() => {
    if (!map) return

    const etapeMarkers = etapes
      .map((etape, index) => ({ etape, index }))
      .filter(({ etape }) => etape.lat !== null && etape.lng !== null)
      .map(({ etape, index }) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: etape.lat as number, lng: etape.lng as number },
          icon: etapeIcon(etape.id === etapeSelectionnee),
          label: {
            text: String(index + 1),
            color: '#0D1B2A',
            fontWeight: '800',
            fontSize: '11px',
          },
          title: etape.nom,
          zIndex: etape.id === etapeSelectionnee ? 1000 : 500,
        })
        if (onEtapeClick) marker.addListener('click', () => onEtapeClick(etape))
        return marker
      })

    const poiMarkers = pois.map((poi) => {
      const marker = new google.maps.Marker({
        position: { lat: poi.lat, lng: poi.lng },
        icon: poiIcon(poi.categorie, poi.id === poiSelectionne),
        title: poi.nom,
        zIndex: poi.id === poiSelectionne ? 900 : 100,
      })
      if (onPoiClick) marker.addListener('click', () => onPoiClick(poi))
      return marker
    })

    let clusterer: MarkerClusterer | null = null
    if (clusterPois && poiMarkers.length > 10) {
      clusterer = new MarkerClusterer({ map, markers: poiMarkers, renderer: clusterRenderer })
    } else {
      poiMarkers.forEach((m) => m.setMap(map))
    }

    return () => {
      clusterer?.clearMarkers()
      clusterer?.setMap(null)
      for (const m of [...etapeMarkers, ...poiMarkers]) {
        google.maps.event.clearInstanceListeners(m)
        m.setMap(null)
      }
    }
  }, [map, etapes, pois, etapeSelectionnee, poiSelectionne, onEtapeClick, onPoiClick, clusterPois])
}

/** Trace turquoise (halo + ligne fléchée), avec dessin progressif optionnel. */
export function useRoutePolyline(
  map: google.maps.Map | null,
  path: LatLng[] | null,
  anime = false,
): void {
  useEffect(() => {
    if (!map || !path || path.length < 2) return

    const fleches: google.maps.IconSequence = {
      icon: {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
        scale: 2.1,
        strokeColor: '#8AD4D0',
        strokeWeight: 1.6,
      },
      repeat: '90px',
      offset: '45px',
    }
    const halo = new google.maps.Polyline({
      map,
      path: anime ? [] : path,
      strokeColor: '#5BBFBA',
      strokeOpacity: 0.18,
      strokeWeight: 9,
      zIndex: 40,
    })
    const ligne = new google.maps.Polyline({
      map,
      path: anime ? [] : path,
      strokeColor: '#5BBFBA',
      strokeOpacity: 0.95,
      strokeWeight: 3.5,
      icons: [fleches],
      zIndex: 50,
    })

    let raf = 0
    if (anime) {
      const debut = performance.now()
      const DUREE_MS = 2600
      const tick = (t: number): void => {
        const p = Math.min(1, (t - debut) / DUREE_MS)
        const eased = 1 - Math.pow(1 - p, 2)
        const n = Math.max(2, Math.floor(path.length * eased))
        ligne.setPath(path.slice(0, n))
        halo.setPath(path.slice(0, n))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(raf)
      ligne.setMap(null)
      halo.setMap(null)
    }
  }, [map, path, anime])
}

export function fitToPoints(map: google.maps.Map, points: LatLng[], padding = 64): void {
  if (points.length === 0) return
  const bounds = new google.maps.LatLngBounds()
  points.forEach((p) => bounds.extend(p))
  map.fitBounds(bounds, padding)
}

/**
 * Survol caméra de la route, étape par étape (animation d'entrée du hero).
 * Annulé dès que l'utilisateur touche la carte. Retourne une fonction cancel.
 */
export function flyOver(map: google.maps.Map, stops: LatLng[], onDone?: () => void): () => void {
  if (stops.length === 0) return () => undefined
  let i = 0
  let timer = 0
  let annule = false

  // `onDone` est garanti d'être appelé exactement une fois, y compris quand le
  // vol est annulé (drag utilisateur, bouton stop, démontage) : les appelants
  // s'en servent pour restaurer l'état de la carte (type de fond, habillage).
  const terminer = (): void => {
    if (annule) return
    annule = true
    window.clearTimeout(timer)
    listener.remove()
    onDone?.()
  }

  const listener = map.addListener('dragstart', terminer)

  const step = (): void => {
    if (annule) return
    if (i >= stops.length) {
      fitToPoints(map, stops, 72)
      terminer()
      return
    }
    map.panTo(stops[i])
    if (map.getZoom() !== 8) map.setZoom(8)
    i += 1
    timer = window.setTimeout(step, 1500)
  }

  map.panTo(stops[0])
  map.setZoom(7)
  timer = window.setTimeout(step, 900)
  return terminer
}
