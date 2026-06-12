import { Eye } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import Timeline from '../components/itinerary/Timeline'
import MapCanvas from '../components/map/MapCanvas'
import { fitToPoints, useRoutePolyline, useTripMarkers } from '../components/map/mapLayers'
import DonutChart from '../components/budget/DonutChart'
import { LoadingScreen } from '../components/ui'
import { DEPENSE_CATEGORIES, DEPENSE_CATEGORIE_LIST, TRIP_META } from '../config/constants'
import { fetchDrivingRoute } from '../lib/directions'
import { fmtMontant } from '../lib/format'
import { Markdown } from '../lib/markdown'
import { ReadonlyProvider, useTripData } from '../state/TripDataContext'
import type { Etape, LatLng } from '../types/db'

function ContenuPartage(): ReactNode {
  const { etapes, pois, notes, depenses, chargement } = useTripData()
  const { code } = useParams()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [path, setPath] = useState<LatLng[] | null>(null)
  const [selection, setSelection] = useState<string | null>(null)

  const stops = useMemo<LatLng[]>(
    () =>
      etapes
        .filter((e) => e.lat !== null && e.lng !== null)
        .map((e) => ({ lat: e.lat as number, lng: e.lng as number })),
    [etapes],
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

  const onEtapeClick = useCallback((e: Etape) => setSelection(e.id), [])

  useRoutePolyline(map, path)
  useTripMarkers(map, { etapes, pois, etapeSelectionnee: selection, onEtapeClick })

  const totalDepense = depenses.reduce((s, d) => s + d.montant, 0)
  const segments = DEPENSE_CATEGORIE_LIST.map((c) => ({
    label: DEPENSE_CATEGORIES[c].label,
    couleur: DEPENSE_CATEGORIES[c].couleur,
    valeur: depenses.filter((d) => d.categorie === c).reduce((s, d) => s + d.montant, 0),
  }))

  if (chargement) return <LoadingScreen />

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6">
      <div className="glass mb-6 flex flex-wrap items-center gap-3 px-4 py-3">
        <Eye className="h-4 w-4 shrink-0 text-glacier" />
        <p className="flex-1 text-sm text-cream-dim">
          <strong className="text-cream">Lecture seule</strong> — roadtrip partagé{code ? ` (lien ${code})` : ''}
        </p>
        <Link to="/" className="btn-glacier px-3 py-1.5 text-xs">
          Ouvrir l’app complète
        </Link>
      </div>

      <header className="mb-8">
        <p className="chip mb-3 bg-glacier/15 text-glacier">14 → 26 juillet 2026 · {TRIP_META.nbJours} jours</p>
        <h1 className="font-display text-3xl font-bold sm:text-5xl">{TRIP_META.nom}</h1>
        <p className="mt-2 text-sm text-cream-dim">
          {TRIP_META.vehicule} · {TRIP_META.voyageurs.length} voyageurs · {etapes.length} étapes · {pois.length} POIs
        </p>
      </header>

      <div className="mb-8 h-[50dvh] min-h-[20rem] overflow-hidden rounded-2xl border border-white/10">
        <MapCanvas className="h-full" onReady={onMapReady} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">Itinéraire</h2>
          <Timeline
            etapes={etapes}
            pois={pois}
            selectionneeId={selection}
            onSelect={(e) => setSelection(e.id)}
            onEdit={() => undefined}
            onReorder={() => undefined}
          />
        </section>

        <div className="space-y-8">
          <section className="glass p-5">
            <h2 className="mb-3 font-display text-xl font-semibold">Budget</h2>
            <div className="flex flex-col items-center">
              <DonutChart
                segments={segments}
                taille={180}
                centre={
                  <>
                    <p className="font-display text-xl font-bold">{fmtMontant(totalDepense, 'EUR', 1)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-cream-dim">engagé</p>
                  </>
                }
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Notes du voyage</h2>
            <div className="space-y-3">
              {notes.map((n) => (
                <article key={n.id} className="glass-soft p-4">
                  <h3 className="mb-1.5 font-semibold text-cream">{n.titre}</h3>
                  <Markdown text={n.contenu} />
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/** Vue publique en lecture seule (`/trip/:code`). */
export default function SharePage(): ReactNode {
  return (
    <ReadonlyProvider>
      <ContenuPartage />
    </ReadonlyProvider>
  )
}
