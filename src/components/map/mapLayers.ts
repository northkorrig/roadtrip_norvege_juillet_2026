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
 * Survol de la route, étape par étape, en s'arrêtant à chaque étape le temps
 * que les tuiles s'affichent VRAIMENT.
 *
 * ⚠️ Leçon apprise : une caméra qui bouge en continu (interpolation frame par
 * frame) empêche Google Maps de terminer le chargement des tuiles — chaque
 * micro-déplacement annule la requête précédente, et l'écran reste sur la
 * couleur de fond (bleu nuit) sans jamais afficher l'imagerie. On procède donc
 * par paliers : on se pose sur une étape, on ATTEND `tilesloaded` (tuiles
 * visibles), on laisse respirer un instant, puis on passe à la suivante.
 *
 * Annulé dès que l'utilisateur touche la carte. Retourne une fonction cancel.
 */
export function flyOver(map: google.maps.Map, stops: LatLng[], onDone?: () => void): () => void {
  if (stops.length === 0) return () => undefined
  let annule = false
  let etape = 0
  let timer = 0
  let attenteTuiles: google.maps.MapsEventListener | null = null

  const DWELL_MS = 1100 // pause sur chaque étape une fois les tuiles affichées
  const TIMEOUT_TUILES_MS = 4500 // si les tuiles tardent, on avance quand même

  // `onDone` est garanti d'être appelé exactement une fois (fin, annulation,
  // drag, démontage) : les appelants restaurent l'état de la carte dedans.
  const terminer = (): void => {
    if (annule) return
    annule = true
    window.clearTimeout(timer)
    attenteTuiles?.remove()
    drag.remove()
    onDone?.()
  }

  const drag = map.addListener('dragstart', terminer)

  const suivante = (): void => {
    if (annule) return
    etape += 1
    poser()
  }

  const poser = (): void => {
    if (annule) return
    if (etape >= stops.length) {
      // Vue d'ensemble finale sur toute la route, puis on rend la main.
      fitToPoints(map, stops, 72)
      timer = window.setTimeout(terminer, 1400)
      return
    }

    map.setZoom(etape === 0 ? 7 : 8)
    map.panTo(stops[etape])

    // On attend que les tuiles de CETTE vue soient chargées avant de temporiser
    // puis d'enchaîner — avec un plan B si elles tardent (réseau lent).
    let avance = false
    const avancer = (): void => {
      if (avance || annule) return
      avance = true
      attenteTuiles?.remove()
      attenteTuiles = null
      window.clearTimeout(timer)
      timer = window.setTimeout(suivante, DWELL_MS)
    }
    attenteTuiles?.remove()
    attenteTuiles = google.maps.event.addListenerOnce(map, 'tilesloaded', avancer)
    timer = window.setTimeout(avancer, TIMEOUT_TUILES_MS)
  }

  // Petit délai initial pour laisser la première vue (satellite) s'initialiser.
  timer = window.setTimeout(poser, 350)
  return terminer
}
