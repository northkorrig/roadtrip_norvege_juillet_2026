import { List, Map as MapIcon, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import MapCanvas from '../components/map/MapCanvas'
import { fitToPoints, useRoutePolyline, useTripMarkers } from '../components/map/mapLayers'
import EtapeEditor from '../components/itinerary/EtapeEditor'
import Timeline from '../components/itinerary/Timeline'
import { ConfirmDialog, ErrorBanner, LoadingScreen, PageTransition, useAction, useToast } from '../components/ui'
import { fetchDrivingRoute, optimizeWaypointOrder } from '../lib/directions'
import { fmtDateCourte } from '../lib/format'
import { useGoogleMapsReady } from '../lib/googleMaps'
import { useReadonly, useTripData } from '../state/TripDataContext'
import type { Etape, LatLng, Poi } from '../types/db'

export default function ItineraryPage(): ReactNode {
  const { etapes, pois, chargement, erreur, recharger, reordonnerEtapes, modifierEtape } = useTripData()
  const readonly = useReadonly()
  const mapsStatus = useGoogleMapsReady()
  const toast = useToast()
  const executer = useAction()

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [path, setPath] = useState<LatLng[] | null>(null)
  const [selection, setSelection] = useState<string | null>(null)
  const [poiBulle, setPoiBulle] = useState<Poi | null>(null)
  const [editorOuvert, setEditorOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState<Etape | null>(null)
  const [vueMobile, setVueMobile] = useState<'liste' | 'carte'>('liste')
  const [confirmerOptim, setConfirmerOptim] = useState(false)
  const [travail, setTravail] = useState<'recalcul' | 'optimisation' | null>(null)

  const etapesGeo = useMemo(() => etapes.filter((e) => e.lat !== null && e.lng !== null), [etapes])
  const stops = useMemo<LatLng[]>(
    () => etapesGeo.map((e) => ({ lat: e.lat as number, lng: e.lng as number })),
    [etapesGeo],
  )

  const onMapReady = useCallback((m: google.maps.Map) => setMap(m), [])

  useEffect(() => {
    if (!map || stops.length < 2) return
    let actif = true
    fitToPoints(map, stops)
    fetchDrivingRoute(stops)
      .then((r) => {
        if (actif) setPath(r.path)
      })
      .catch(() => {
        if (actif) setPath(stops)
      })
    return () => {
      actif = false
    }
  }, [map, stops])

  const selectionnerEtape = useCallback(
    (etape: Etape, depuisCarte: boolean) => {
      setSelection(etape.id)
      setPoiBulle(null)
      if (depuisCarte) {
        document.getElementById(`etape-card-${etape.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else if (map && etape.lat !== null && etape.lng !== null) {
        map.panTo({ lat: etape.lat, lng: etape.lng })
        const zoom = map.getZoom() ?? 6
        if (zoom < 9) map.setZoom(9)
      }
    },
    [map],
  )

  const onEtapeMarker = useCallback((e: Etape) => selectionnerEtape(e, true), [selectionnerEtape])
  const onPoiMarker = useCallback((p: Poi) => setPoiBulle(p), [])

  useRoutePolyline(map, path)
  useTripMarkers(map, {
    etapes,
    pois,
    etapeSelectionnee: selection,
    poiSelectionne: poiBulle?.id ?? null,
    onEtapeClick: onEtapeMarker,
    onPoiClick: onPoiMarker,
  })

  const recalculer = async (): Promise<void> => {
    if (stops.length < 2) return
    setTravail('recalcul')
    await executer(async () => {
      const r = await fetchDrivingRoute(stops, true)
      // legs[i] relie etapesGeo[i] → etapesGeo[i+1]
      await Promise.all(
        r.legs.map((leg, i) =>
          modifierEtape(etapesGeo[i + 1].id, { km_depuis_precedent: leg.km, duree_min: leg.min }),
        ),
      )
      const totalKm = Math.round(r.legs.reduce((s, l) => s + l.km, 0))
      toast(`Distances recalculées via Google Directions — ${totalKm.toLocaleString('fr-FR')} km au total`)
    })
    setTravail(null)
  }

  const optimiser = async (): Promise<void> => {
    setConfirmerOptim(false)
    if (etapesGeo.length !== etapes.length) {
      toast('Toutes les étapes doivent être géolocalisées pour optimiser', 'erreur')
      return
    }
    setTravail('optimisation')
    await executer(async () => {
      const ordre = await optimizeWaypointOrder(stops)
      const ids = [
        etapesGeo[0].id,
        ...ordre.map((i) => etapesGeo[i + 1].id),
        etapesGeo[etapesGeo.length - 1].id,
      ]
      await reordonnerEtapes(ids)
      toast('Ordre des étapes optimisé (départ et arrivée fixes)')
    })
    setTravail(null)
  }

  const ouvrirCreation = (): void => {
    setEnEdition(null)
    setEditorOuvert(true)
  }
  const ouvrirEdition = (etape: Etape): void => {
    setEnEdition(etape)
    setEditorOuvert(true)
  }

  if (chargement) return <LoadingScreen />

  const mapsPret = mapsStatus === 'pret'
  const etapeSelectionnee = etapes.find((e) => e.id === selection) ?? null

  const carte = (
    <div className="relative h-full overflow-hidden md:rounded-2xl md:border md:border-white/10">
      <MapCanvas className="h-full" onReady={onMapReady} />
      {(poiBulle ?? etapeSelectionnee) && (
        <div className="glass absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-sm px-4 py-3">
          {poiBulle ? (
            <>
              <p className="text-sm font-semibold text-cream">{poiBulle.nom}</p>
              {poiBulle.note && <p className="mt-0.5 line-clamp-2 text-xs text-cream-dim">{poiBulle.note}</p>}
            </>
          ) : (
            etapeSelectionnee && (
              <>
                <p className="text-[11px] uppercase tracking-wider text-glacier">
                  J{etapes.indexOf(etapeSelectionnee) + 1} · {fmtDateCourte(etapeSelectionnee.date)}
                </p>
                <p className="text-sm font-semibold text-cream">{etapeSelectionnee.nom}</p>
              </>
            )
          )}
        </div>
      )}
    </div>
  )

  return (
    <PageTransition>
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-7xl flex-col px-3 pb-[4.5rem] pt-[4.75rem] sm:px-4 md:pb-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Itinéraire</h1>
            <p className="text-xs text-cream-dim">
              {etapes.length} étapes · glisser-déposer pour réordonner
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Bascule liste/carte (mobile) */}
            <div className="flex gap-1 rounded-xl bg-white/[0.06] p-1 md:hidden">
              <button type="button" onClick={() => setVueMobile('liste')} className={`chip ${vueMobile === 'liste' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}>
                <List className="h-3.5 w-3.5" /> Liste
              </button>
              <button type="button" onClick={() => setVueMobile('carte')} className={`chip ${vueMobile === 'carte' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}>
                <MapIcon className="h-3.5 w-3.5" /> Carte
              </button>
            </div>
            {!readonly && (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => void recalculer()}
                  disabled={!mapsPret || travail !== null}
                  title={mapsPret ? 'Recalcule km et durées via Google Directions' : 'Nécessite la clé Google Maps'}
                >
                  <RefreshCw className={`h-4 w-4 ${travail === 'recalcul' ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Recalculer</span>
                </button>
                <button
                  type="button"
                  className="btn-glacier"
                  onClick={() => setConfirmerOptim(true)}
                  disabled={!mapsPret || travail !== null}
                  title={mapsPret ? 'Réordonne les étapes intermédiaires pour minimiser la route' : 'Nécessite la clé Google Maps'}
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Optimiser le trajet</span>
                </button>
                <button type="button" className="btn-primary" onClick={ouvrirCreation}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Étape</span>
                </button>
              </>
            )}
          </div>
        </div>

        {erreur && (
          <div className="mb-3">
            <ErrorBanner message={erreur} onRetry={() => void recharger()} />
          </div>
        )}

        {/* Split : timeline à gauche, carte à droite */}
        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(380px,30rem)_1fr]">
          <div className={`min-h-0 overflow-y-auto pr-1 ${vueMobile === 'carte' ? 'hidden md:block' : ''}`}>
            <Timeline
              etapes={etapes}
              pois={pois}
              selectionneeId={selection}
              onSelect={(e) => selectionnerEtape(e, false)}
              onEdit={ouvrirEdition}
              onReorder={(ids) => void executer(() => reordonnerEtapes(ids), 'Itinéraire réordonné')}
            />
          </div>
          <div className={`min-h-0 ${vueMobile === 'liste' ? 'hidden md:block' : ''}`}>{carte}</div>
        </div>
      </div>

      <EtapeEditor ouvert={editorOuvert} etape={enEdition} onFermer={() => setEditorOuvert(false)} />

      <ConfirmDialog
        ouvert={confirmerOptim}
        titre="Optimiser le trajet ?"
        message="Google Directions va réordonner les étapes intermédiaires pour minimiser la distance totale. Le départ et l'arrivée (Oslo) restent fixes. Les dates ne sont pas modifiées."
        onConfirmer={() => void optimiser()}
        onAnnuler={() => setConfirmerOptim(false)}
        labelConfirmer="Optimiser"
        variante="primaire"
      />
    </PageTransition>
  )
}
