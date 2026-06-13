import {
  Caravan,
  ExternalLink,
  Home,
  List,
  Map as MapIcon,
  Plus,
  RotateCw,
  Search,
  Star,
  Tent,
  TreePine,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { chercherBivouacs, haversineKm, type SousTypeBivouac, type SpotBivouac } from '../../lib/overpass'
import { chercherNotesGoogle, lienAvisGoogle, type NoteGoogle } from '../../lib/placesRatings'
import { useTripData } from '../../state/TripDataContext'
import type { LatLng } from '../../types/db'
import { etapeIcon, fitToPoints } from '../map/mapLayers'
import MapCanvas from '../map/MapCanvas'
import { Drawer, Spinner } from '../ui'
import type { PoiPrefill } from './PoiForm'

const SOUS_TYPES: Record<SousTypeBivouac, { label: string; couleur: string; Icon: LucideIcon }> = {
  camp_site: { label: 'Camping', couleur: '#7FD08C', Icon: Tent },
  caravan_site: { label: 'Camping-car / van', couleur: '#F0C04A', Icon: Caravan },
  wilderness_hut: { label: 'Refuge / Hut', couleur: '#E8824A', Icon: Home },
  shelter: { label: 'Abri', couleur: '#9B8CFF', Icon: TreePine },
}

const RAYONS = [5, 10, 20, 50] as const

/** Libellé affiché — repli sur le type quand le spot n'a pas de nom dans OSM. */
function libelleSpot(spot: SpotBivouac): string {
  return spot.nom ?? SOUS_TYPES[spot.sousType].label
}

function NoteEtoiles({ note }: { note: NoteGoogle }): ReactNode {
  return (
    <a
      href={lienAvisGoogle(note.placeId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 font-medium text-amber-300 hover:underline"
      title={`${note.total} avis sur Google Maps — clique pour les lire`}
      onClick={(e) => e.stopPropagation()}
    >
      <Star className="h-3 w-3 fill-amber-300" />
      {note.rating.toFixed(1)}
      <span className="text-amber-300/70">({note.total})</span>
    </a>
  )
}

interface Props {
  ouvert: boolean
  onFermer: () => void
  onAjouter: (prefill: PoiPrefill) => void
}

export default function BivouacSearch({ ouvert, onFermer, onAjouter }: Props): ReactNode {
  const { etapes } = useTripData()
  const etapesAvecCoords = etapes.filter((e) => e.lat != null && e.lng != null)

  const [etapeId, setEtapeId] = useState<string>('')
  const [rayon, setRayon] = useState<number>(20)
  const [filtres, setFiltres] = useState<Set<SousTypeBivouac>>(
    new Set<SousTypeBivouac>(['camp_site', 'caravan_site', 'wilderness_hut', 'shelter']),
  )
  const [inclureSansNom, setInclureSansNom] = useState(false)
  const [vue, setVue] = useState<'liste' | 'carte'>('liste')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [spots, setSpots] = useState<SpotBivouac[] | null>(null)
  const [spotSel, setSpotSel] = useState<SpotBivouac | null>(null)
  const [notes, setNotes] = useState<Record<string, NoteGoogle>>({})
  const [notesChargement, setNotesChargement] = useState(false)
  const [zoneDispo, setZoneDispo] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const centreRef = useRef<LatLng | null>(null)
  const skipFitRef = useRef(false)

  useEffect(() => {
    if (ouvert && !etapeId && etapesAvecCoords.length > 0) {
      setEtapeId(etapesAvecCoords[0].id)
    }
  }, [ouvert, etapesAvecCoords, etapeId])

  const basculerFiltre = (t: SousTypeBivouac): void => {
    setFiltres((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const lancerRecherche = useCallback(async (lat: number, lng: number, rayonKm: number): Promise<void> => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    centreRef.current = { lat, lng }
    setZoneDispo(false)
    setChargement(true)
    setErreur(null)
    setSpots(null)
    setSpotSel(null)
    setNotes({})

    try {
      const resultats = await chercherBivouacs(lat, lng, rayonKm, ctrl.signal)
      if (ctrl.signal.aborted) return
      setSpots(resultats)
      // Enrichissement asynchrone : notes + nb d'avis via Google Places
      setNotesChargement(true)
      void chercherNotesGoogle(lat, lng, rayonKm, resultats)
        .then((n) => {
          if (!ctrl.signal.aborted) setNotes(n)
        })
        .catch(() => undefined)
        .finally(() => setNotesChargement(false))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }, [])

  const rechercher = (): void => {
    const etape = etapes.find((e) => e.id === etapeId)
    if (!etape?.lat || !etape?.lng) return
    skipFitRef.current = false
    void lancerRecherche(etape.lat, etape.lng, rayon)
  }

  /** Recherche centrée sur la vue actuelle de la carte (rayon déduit du viewport). */
  const rechercherZone = (): void => {
    if (!map) return
    const c = map.getCenter()
    const b = map.getBounds()
    if (!c || !b) return
    const ne = b.getNorthEast()
    const rayonVue = haversineKm(c.lat(), c.lng(), ne.lat(), ne.lng())
    const rayonKm = Math.min(50, Math.max(2, rayonVue * 0.8))
    skipFitRef.current = true
    void lancerRecherche(c.lat(), c.lng(), rayonKm)
  }

  const sansNomCount = useMemo(
    () => (spots ?? []).filter((s) => filtres.has(s.sousType) && !s.nom).length,
    [spots, filtres],
  )

  const spotsFiltres = useMemo(
    () =>
      spots === null
        ? null
        : spots.filter((s) => filtres.has(s.sousType) && (inclureSansNom || s.nom !== null)),
    [spots, filtres, inclureSansNom],
  )

  const handleAjouter = (spot: SpotBivouac): void => {
    onAjouter({ lat: spot.lat, lng: spot.lng, nom: libelleSpot(spot), categorie: 'bivouac' })
    onFermer()
  }

  const onMapReady = useCallback((m: google.maps.Map) => setMap(m), [])

  // Marqueurs : spots filtrés + centre de recherche (orange)
  useEffect(() => {
    if (!map || vue !== 'carte') return
    const markers: google.maps.Marker[] = []

    if (centreRef.current) {
      markers.push(
        new google.maps.Marker({
          map,
          position: centreRef.current,
          icon: etapeIcon(false),
          title: 'Centre de la recherche',
          zIndex: 100,
        }),
      )
    }

    for (const spot of spotsFiltres ?? []) {
      const meta = SOUS_TYPES[spot.sousType]
      const marker = new google.maps.Marker({
        map,
        position: { lat: spot.lat, lng: spot.lng },
        title: `${libelleSpot(spot)} · ${spot.distanceKm.toFixed(1)} km`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: spotSel?.osmId === spot.osmId ? 9 : 6.5,
          fillColor: meta.couleur,
          fillOpacity: 0.95,
          strokeColor: spotSel?.osmId === spot.osmId ? '#F0EDE6' : '#0D1B2A',
          strokeWeight: 2,
        },
      })
      marker.addListener('click', () => setSpotSel(spot))
      markers.push(marker)
    }

    markersRef.current = markers
    return () => {
      for (const m of markersRef.current) m.setMap(null)
      markersRef.current = []
    }
  }, [map, vue, spotsFiltres, spotSel])

  // Cadrage auto sur les résultats — sauf après "Rechercher dans cette zone"
  useEffect(() => {
    if (!map || vue !== 'carte' || !spotsFiltres || spotsFiltres.length === 0) return
    if (skipFitRef.current) {
      skipFitRef.current = false
      return
    }
    const points: LatLng[] = spotsFiltres.map((s) => ({ lat: s.lat, lng: s.lng }))
    if (centreRef.current) points.push(centreRef.current)
    fitToPoints(map, points, 48)
  }, [map, vue, spotsFiltres])

  // Affiche "Rechercher dans cette zone" quand la carte s'éloigne du dernier centre
  useEffect(() => {
    if (!map || vue !== 'carte') return
    const listener = map.addListener('idle', () => {
      const centre = centreRef.current
      const c = map.getCenter()
      const b = map.getBounds()
      if (!centre || !c || !b) return
      const ne = b.getNorthEast()
      const rayonVue = haversineKm(c.lat(), c.lng(), ne.lat(), ne.lng())
      const distance = haversineKm(centre.lat, centre.lng, c.lat(), c.lng())
      setZoneDispo(distance > rayonVue * 0.3)
    })
    return () => listener.remove()
  }, [map, vue])

  return (
    <Drawer ouvert={ouvert} onFermer={onFermer} titre="Bivouacs & Campings">
      <div className="space-y-4">
        <div>
          <label className="label">Autour de quelle étape ?</label>
          {etapesAvecCoords.length === 0 ? (
            <p className="text-sm text-amber-400">Aucune étape avec coordonnées GPS. Ajoute des coordonnées à tes étapes d'abord.</p>
          ) : (
            <select className="input" value={etapeId} onChange={(e) => setEtapeId(e.target.value)}>
              <option value="" disabled>
                — Choisir une étape —
              </option>
              {etapesAvecCoords.map((e) => (
                <option key={e.id} value={e.id}>
                  J{etapes.indexOf(e) + 1} — {e.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="label">Rayon de recherche</label>
          <div className="flex gap-2">
            {RAYONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRayon(r)}
                className={`chip flex-1 justify-center transition-all ${
                  rayon === r
                    ? 'bg-glacier/20 text-glacier ring-1 ring-glacier/40'
                    : 'text-cream-dim'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Types de spots</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SOUS_TYPES) as [SousTypeBivouac, (typeof SOUS_TYPES)[SousTypeBivouac]][]).map(
              ([t, meta]) => {
                const actif = filtres.has(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => basculerFiltre(t)}
                    className="chip transition-all"
                    style={
                      actif
                        ? { backgroundColor: `${meta.couleur}2e`, color: meta.couleur, boxShadow: `inset 0 0 0 1px ${meta.couleur}88` }
                        : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#B7C2CC' }
                    }
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </button>
                )
              },
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={inclureSansNom}
            onChange={(e) => setInclureSansNom(e.target.checked)}
            className="h-4 w-4 accent-[#5BBFBA]"
          />
          Inclure les spots sans nom
          {sansNomCount > 0 && !inclureSansNom && (
            <span className="text-xs text-cream-dim/60">({sansNomCount} masqué{sansNomCount > 1 ? 's' : ''})</span>
          )}
        </label>

        <button
          type="button"
          className="btn-primary w-full"
          onClick={rechercher}
          disabled={!etapeId || chargement || etapesAvecCoords.length === 0}
        >
          {chargement ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          {chargement ? 'Recherche en cours…' : 'Rechercher'}
        </button>
      </div>

      {erreur && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </div>
      )}

      {spotsFiltres !== null && !chargement && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs text-cream-dim">
              {spotsFiltres.length === 0
                ? 'Aucun spot trouvé — essaie un rayon plus grand ou active d’autres types'
                : `${spotsFiltres.length} spot${spotsFiltres.length > 1 ? 's' : ''} trouvé${spotsFiltres.length > 1 ? 's' : ''}`}
              {notesChargement && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-300/80">
                  <Spinner className="h-3 w-3" /> avis Google…
                </span>
              )}
            </p>
            {spotsFiltres.length > 0 && (
              <div className="flex shrink-0 gap-1 rounded-xl bg-white/[0.06] p-1">
                <button
                  type="button"
                  onClick={() => setVue('liste')}
                  className={`chip ${vue === 'liste' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
                >
                  <List className="h-3.5 w-3.5" /> Liste
                </button>
                <button
                  type="button"
                  onClick={() => setVue('carte')}
                  className={`chip ${vue === 'carte' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
                >
                  <MapIcon className="h-3.5 w-3.5" /> Carte
                </button>
              </div>
            )}
          </div>

          {vue === 'carte' && spotsFiltres.length > 0 ? (
            <div>
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <MapCanvas className="h-72" onReady={onMapReady} />
                {zoneDispo && (
                  <button
                    type="button"
                    onClick={rechercherZone}
                    className="glass absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-glacier transition-transform hover:scale-105"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Rechercher dans cette zone
                  </button>
                )}
              </div>
              {spotSel && (
                <div className="glass-soft mt-2 flex items-start gap-3 px-3 py-2.5">
                  {(() => {
                    const meta = SOUS_TYPES[spotSel.sousType]
                    return <meta.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.couleur }} />
                  })()}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cream">{libelleSpot(spotSel)}</p>
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-cream-dim">
                      {notes[spotSel.osmId] && <NoteEtoiles note={notes[spotSel.osmId]} />}
                      <span>
                        {SOUS_TYPES[spotSel.sousType].label}
                        {spotSel.operateur ? ` · ${spotSel.operateur}` : ''}
                        {spotSel.fee === true ? ' · Payant' : spotSel.fee === false ? ' · Gratuit' : ''}
                        {' · '}
                        <span className="tabular-nums">{spotSel.distanceKm.toFixed(1)} km</span>
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-glacier shrink-0 px-2 py-1.5 text-xs"
                    onClick={() => handleAjouter(spotSel)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>
              )}
              {!spotSel && (
                <p className="mt-2 text-center text-xs text-cream-dim/60">
                  Clique sur un marqueur pour voir le détail — déplace la carte pour chercher ailleurs
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {spotsFiltres.map((spot) => {
                const meta = SOUS_TYPES[spot.sousType]
                const note = notes[spot.osmId]
                return (
                  <div key={spot.osmId} className="glass-soft flex items-start gap-3 px-3 py-2.5">
                    <meta.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.couleur }} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-medium ${spot.nom ? 'text-cream' : 'italic text-cream-dim'}`}>
                        {libelleSpot(spot)}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-cream-dim">
                        {note && <NoteEtoiles note={note} />}
                        <span>
                          {meta.label}
                          {spot.operateur ? ` · ${spot.operateur}` : ''}
                          {spot.fee === true ? ' · Payant' : spot.fee === false ? ' · Gratuit' : ''}
                          {' · '}
                          <span className="tabular-nums">{spot.distanceKm.toFixed(1)} km</span>
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {spot.website && (
                        <a
                          href={spot.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost p-1.5"
                          title="Site web"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn-glacier px-2 py-1.5 text-xs"
                        onClick={() => handleAjouter(spot)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {spotsFiltres.length > 0 && (
            <p className="mt-4 text-center text-xs text-cream-dim/50">
              Données :{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                © contributeurs OpenStreetMap
              </a>
              {' · avis : Google Maps'}
            </p>
          )}
        </div>
      )}
    </Drawer>
  )
}
