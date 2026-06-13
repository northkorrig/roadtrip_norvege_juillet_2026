import {
  Caravan,
  Droplets,
  ExternalLink,
  Eye,
  Flame,
  Home,
  Mountain,
  Navigation,
  Plus,
  RotateCw,
  Search,
  SquareParking,
  Star,
  Telescope,
  Tent,
  TreePine,
  Umbrella,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import MapCanvas from '../components/map/MapCanvas'
import { etapeIcon, fitToPoints } from '../components/map/mapLayers'
import type { PoiPrefill } from '../components/pois/PoiForm'
import { PageTransition, Spinner } from '../components/ui'
import { useGeolocation } from '../hooks/useGeolocation'
import { lienStreetView } from '../lib/googleMaps'
import { chercherBivouacs, haversineKm, type SousTypeBivouac, type SpotBivouac } from '../lib/overpass'
import { chercherNotesGoogle, lienAvisGoogle, type NoteGoogle } from '../lib/placesRatings'
import { useTripData } from '../state/TripDataContext'
import type { LatLng } from '../types/db'

const SOUS_TYPES: Record<SousTypeBivouac, { label: string; couleur: string; Icon: LucideIcon }> = {
  viewpoint: { label: 'Point de vue', couleur: '#9B8CFF', Icon: Telescope },
  beach: { label: 'Plage / baignade', couleur: '#6FB8FF', Icon: Waves },
  picnic: { label: 'Pique-nique / feu', couleur: '#F0A35E', Icon: Flame },
  camp_site: { label: 'Camping', couleur: '#7FD08C', Icon: Tent },
  caravan_site: { label: 'Camping-car / van', couleur: '#F0C04A', Icon: Caravan },
  rest_area: { label: 'Aire de repos', couleur: '#8FB0C2', Icon: SquareParking },
  gapahuk: { label: 'Gapahuk', couleur: '#5BBFBA', Icon: TreePine },
  shelter: { label: 'Abri', couleur: '#A7B0BF', Icon: Umbrella },
  wilderness_hut: { label: 'Refuge non gardé', couleur: '#E8824A', Icon: Home },
  alpine_hut: { label: 'Refuge gardé', couleur: '#FF7FA0', Icon: Mountain },
}

const RAYONS = [5, 10, 20, 50] as const
const POSITION = '__position__'

function libelleSpot(spot: SpotBivouac): string {
  return spot.nom ?? SOUS_TYPES[spot.sousType].label
}

function notePrefill(spot: SpotBivouac): string | undefined {
  const equip = [
    spot.dnt ? 'DNT' : null,
    spot.eau ? 'eau potable' : null,
    spot.feu ? 'feu autorisé' : null,
    spot.toilettes ? 'WC' : null,
    spot.fee === false ? 'gratuit' : spot.fee === true ? 'payant' : null,
  ].filter(Boolean)
  const lignes = [spot.description, equip.length > 0 ? `Équipements : ${equip.join(', ')}` : null].filter(Boolean)
  return lignes.length > 0 ? lignes.join('\n\n') : undefined
}

function NoteEtoiles({ note }: { note: NoteGoogle }): ReactNode {
  return (
    <a
      href={lienAvisGoogle(note.placeId)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 font-medium text-amber-300 hover:underline"
      title={`${note.total} avis sur Google Maps`}
      onClick={(e) => e.stopPropagation()}
    >
      <Star className="h-3 w-3 fill-amber-300" />
      {note.rating.toFixed(1)}
      <span className="text-amber-300/70">({note.total})</span>
    </a>
  )
}

function BadgesSpot({ spot }: { spot: SpotBivouac }): ReactNode {
  if (!spot.dnt && !spot.eau && !spot.feu && !spot.toilettes) return null
  const badge = 'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium'
  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {spot.dnt && (
        <span className={`${badge} bg-ember/20 text-ember`} title="Réseau DNT (club alpin norvégien)">DNT</span>
      )}
      {spot.eau && (
        <span className={`${badge} bg-glacier/15 text-glacier`} title="Eau potable">
          <Droplets className="h-3 w-3" /> eau
        </span>
      )}
      {spot.feu && (
        <span className={`${badge} bg-orange-400/15 text-orange-300`} title="Feu autorisé / foyer">
          <Flame className="h-3 w-3" /> feu
        </span>
      )}
      {spot.toilettes && (
        <span className={`${badge} bg-white/10 text-cream-dim`} title="Toilettes">WC</span>
      )}
    </span>
  )
}

export default function BivouacsPage(): ReactNode {
  const { etapes } = useTripData()
  const navigate = useNavigate()
  const etapesAvecCoords = etapes.filter((e) => e.lat != null && e.lng != null)
  const geo = useGeolocation()

  const [etapeId, setEtapeId] = useState<string>(() =>
    etapesAvecCoords.length > 0 ? etapesAvecCoords[0].id : POSITION,
  )
  const [rayon, setRayon] = useState<number>(20)
  const [filtres, setFiltres] = useState<Set<SousTypeBivouac>>(
    new Set<SousTypeBivouac>([
      'viewpoint',
      'beach',
      'picnic',
      'camp_site',
      'caravan_site',
      'rest_area',
      'gapahuk',
      'shelter',
      'wilderness_hut',
      'alpine_hut',
    ]),
  )
  const [inclureSansNom, setInclureSansNom] = useState(false)
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
      setNotesChargement(true)
      void chercherNotesGoogle(lat, lng, rayonKm, resultats)
        .then((n) => { if (!ctrl.signal.aborted) setNotes(n) })
        .catch(() => undefined)
        .finally(() => setNotesChargement(false))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }, [])

  const rechercher = async (): Promise<void> => {
    skipFitRef.current = false
    if (etapeId === POSITION) {
      const p = await geo.localiser()
      if (!p) return
      void lancerRecherche(p.lat, p.lng, rayon)
      return
    }
    const etape = etapes.find((e) => e.id === etapeId)
    if (!etape?.lat || !etape?.lng) return
    void lancerRecherche(etape.lat, etape.lng, rayon)
  }

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
    const prefill: PoiPrefill = {
      lat: spot.lat,
      lng: spot.lng,
      nom: libelleSpot(spot),
      categorie: spot.sousType === 'viewpoint' ? 'vue_panoramique' : 'bivouac',
      note: notePrefill(spot),
    }
    // Encode prefill in URL state so PoisPage can pick it up
    void navigate('/pois', { state: { bivouacPrefill: prefill } })
  }

  const onMapReady = useCallback((m: google.maps.Map) => setMap(m), [])

  // Marqueurs spots
  useEffect(() => {
    if (!map) return
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
      const estSel = spotSel?.osmId === spot.osmId
      const marker = new google.maps.Marker({
        map,
        position: { lat: spot.lat, lng: spot.lng },
        title: `${libelleSpot(spot)} · ${spot.distanceKm.toFixed(1)} km`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: estSel ? 9 : 6.5,
          fillColor: meta.couleur,
          fillOpacity: 0.95,
          strokeColor: estSel ? '#F0EDE6' : '#0D1B2A',
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
  }, [map, spotsFiltres, spotSel])

  // Cadrage auto sur les résultats
  useEffect(() => {
    if (!map || !spotsFiltres || spotsFiltres.length === 0) return
    if (skipFitRef.current) {
      skipFitRef.current = false
      return
    }
    const points: LatLng[] = spotsFiltres.map((s) => ({ lat: s.lat, lng: s.lng }))
    if (centreRef.current) points.push(centreRef.current)
    fitToPoints(map, points, 48)
  }, [map, spotsFiltres])

  // Bouton "Rechercher dans cette zone"
  useEffect(() => {
    if (!map) return
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
  }, [map])

  const occupe = chargement || geo.chargement

  return (
    <PageTransition>
      <div className="flex h-[calc(100dvh-4rem)] flex-col pt-16 md:flex-row">
        {/* Panneau gauche : filtres + résultats */}
        <aside className="flex w-full flex-col border-b border-white/[0.06] md:h-full md:w-[22rem] md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
          {/* Filtres */}
          <div className="space-y-3 px-4 pt-4">
            <div>
              <label className="label">Où chercher ?</label>
              <select className="input" value={etapeId} onChange={(e) => setEtapeId(e.target.value)}>
                <option value={POSITION}>📍 Autour de moi (GPS)</option>
                {etapesAvecCoords.length > 0 && (
                  <optgroup label="Étapes">
                    {etapesAvecCoords.map((e) => (
                      <option key={e.id} value={e.id}>
                        J{etapes.indexOf(e) + 1} — {e.nom}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="label">Rayon</label>
              <div className="flex gap-2">
                {RAYONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRayon(r)}
                    className={`chip flex-1 justify-center transition-all ${
                      rayon === r ? 'bg-glacier/20 text-glacier ring-1 ring-glacier/40' : 'text-cream-dim'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Types</label>
              <div className="flex flex-wrap gap-1.5">
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
              onClick={() => void rechercher()}
              disabled={!etapeId || occupe}
            >
              {occupe ? (
                <Spinner className="h-4 w-4" />
              ) : etapeId === POSITION ? (
                <Navigation className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {geo.chargement ? 'Localisation…' : chargement ? 'Recherche en cours…' : 'Rechercher'}
            </button>

            {(erreur || geo.erreur) && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {erreur ?? geo.erreur}
              </div>
            )}
          </div>

          {/* Résultats */}
          {spotsFiltres !== null && !chargement && (
            <div className="mt-3 flex-1 overflow-y-auto px-4 pb-4">
              <p className="mb-2 text-xs text-cream-dim">
                {spotsFiltres.length === 0
                  ? "Aucun spot trouvé — essaie un rayon plus grand ou active d'autres types"
                  : `${spotsFiltres.length} spot${spotsFiltres.length > 1 ? 's' : ''} trouvé${spotsFiltres.length > 1 ? 's' : ''}`}
                {notesChargement && (
                  <span className="ml-2 inline-flex items-center gap-1 text-amber-300/80">
                    <Spinner className="h-3 w-3" /> avis…
                  </span>
                )}
              </p>

              <div className="space-y-2">
                {spotsFiltres.map((spot) => {
                  const meta = SOUS_TYPES[spot.sousType]
                  const note = notes[spot.osmId]
                  const estSel = spotSel?.osmId === spot.osmId
                  return (
                    <div
                      key={spot.osmId}
                      className={`glass-soft flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-all ${
                        estSel ? 'ring-1 ring-glacier/40' : ''
                      }`}
                      onClick={() => {
                        setSpotSel(spot)
                        if (map) map.panTo({ lat: spot.lat, lng: spot.lng })
                      }}
                    >
                      <meta.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.couleur }} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${spot.nom ? 'text-cream' : 'italic text-cream-dim'}`}>
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
                        <BadgesSpot spot={spot} />
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <a
                          href={lienStreetView(spot.lat, spot.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost p-1.5"
                          title="Voir sur Street View"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </a>
                        {spot.website && (
                          <a
                            href={spot.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost p-1.5"
                            title="Site web"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn-glacier px-2 py-1.5 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleAjouter(spot) }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {spotsFiltres.length > 0 && (
                <p className="mt-4 text-center text-xs text-cream-dim/50">
                  <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
                    © contributeurs OpenStreetMap
                  </a>
                  {' · avis : Google Maps'}
                </p>
              )}
            </div>
          )}
        </aside>

        {/* Carte principale plein écran */}
        <div className="relative flex-1 overflow-hidden">
          <MapCanvas className="h-full" onReady={onMapReady} />

          {/* Bouton recherche dans cette zone */}
          {(zoneDispo || (spots !== null && !chargement)) && (
            <button
              type="button"
              onClick={rechercherZone}
              disabled={chargement}
              className="glass absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium text-glacier transition-transform hover:scale-105 disabled:opacity-50"
            >
              <RotateCw className={`h-4 w-4 ${chargement ? 'animate-spin' : ''}`} />
              Rechercher dans cette zone
            </button>
          )}

          {/* Fiche du spot sélectionné */}
          {spotSel && (
            <div className="glass absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-lg px-4 py-3">
              <div className="flex items-start gap-3">
                {(() => {
                  const meta = SOUS_TYPES[spotSel.sousType]
                  return <meta.Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: meta.couleur }} />
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-cream">{libelleSpot(spotSel)}</p>
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
                  <BadgesSpot spot={spotSel} />
                  {spotSel.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-cream-dim/70">{spotSel.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={lienStreetView(spotSel.lat, spotSel.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost p-1.5"
                    title="Voir sur Street View"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    className="btn-glacier px-2 py-1.5 text-xs"
                    onClick={() => handleAjouter(spotSel)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message d'accueil quand pas encore de résultats */}
          {spots === null && !chargement && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="glass rounded-2xl px-6 py-5 text-center">
                <Tent className="mx-auto mb-2 h-8 w-8 text-glacier/60" />
                <p className="text-sm font-medium text-cream-dim">Sélectionne une étape et lance la recherche</p>
                <p className="mt-0.5 text-xs text-cream-dim/60">Ou déplace la carte puis clique "Rechercher dans cette zone"</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
