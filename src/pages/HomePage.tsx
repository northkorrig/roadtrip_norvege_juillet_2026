import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, Plane, RotateCcw, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AujourdHui, { dateLocaleIso, etapeDuJour } from '../components/home/AujourdHui'
import MapCanvas from '../components/map/MapCanvas'
import { fitToPoints, flyOver, useRoutePolyline, useTripMarkers } from '../components/map/mapLayers'
import { CountUp } from '../components/ui'
import { TRIP_META } from '../config/constants'
import { fetchDrivingRoute } from '../lib/directions'
import { useTripData } from '../state/TripDataContext'
import type { LatLng } from '../types/db'

const conteneur = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const element = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

export default function HomePage(): ReactNode {
  const { etapes, pois } = useTripData()
  // Pendant le voyage, les compteurs laissent place au tableau de bord du jour.
  // `?jour=YYYY-MM-DD` permet de prévisualiser n'importe quelle journée.
  const [searchParams] = useSearchParams()
  const jour = searchParams.get('jour') ?? dateLocaleIso()
  const enVoyage = etapeDuJour(etapes, jour) !== null
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [path, setPath] = useState<LatLng[] | null>(null)
  const cancelVol = useRef<(() => void) | null>(null)
  const [volEffectue, setVolEffectue] = useState(false)
  // Survol manuel : on efface l'habillage pour voir la carte (sur mobile le
  // voile la couvre entièrement — le vol était invisible).
  const [enVol, setEnVol] = useState(false)

  const stops = useMemo<LatLng[]>(
    () =>
      etapes
        .filter((e) => e.lat !== null && e.lng !== null)
        .map((e) => ({ lat: e.lat as number, lng: e.lng as number })),
    [etapes],
  )

  const onMapReady = useCallback((m: google.maps.Map) => setMap(m), [])

  // Trace réelle via Directions API (repli : segments droits)
  useEffect(() => {
    if (!map || stops.length < 2) return
    let actif = true
    fitToPoints(map, stops, 90)
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

  useRoutePolyline(map, path, true)
  useTripMarkers(map, { etapes, pois, clusterPois: true })

  // Animation d'entrée : la caméra survole la route d'Oslo à Oslo
  useEffect(() => {
    if (!map || stops.length < 2 || volEffectue) return
    const timer = window.setTimeout(() => {
      cancelVol.current = flyOver(map, stops, () => setVolEffectue(true))
    }, 1500)
    return () => {
      window.clearTimeout(timer)
      cancelVol.current?.()
    }
  }, [map, stops, volEffectue])

  const relancerVol = (): void => {
    if (!map || stops.length < 2) return
    cancelVol.current?.()
    setEnVol(true)
    cancelVol.current = flyOver(map, stops, () => setEnVol(false))
  }

  const arreterVol = (): void => {
    cancelVol.current?.()
    setEnVol(false)
  }

  const kmTotal = etapes.reduce((s, e) => s + (e.km_depuis_precedent ?? 0), 0)

  const compteurs: { valeur: number; suffixe: string; label: string }[] = [
    { valeur: Math.round(kmTotal), suffixe: ' km', label: 'de route' },
    { valeur: TRIP_META.nbJours, suffixe: '', label: 'jours' },
    { valeur: etapes.length, suffixe: '', label: 'étapes' },
    { valeur: pois.length, suffixe: '', label: 'points d’intérêt' },
  ]

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <MapCanvas className="absolute inset-0" fallbackMessage={false} onReady={onMapReady} />

      {/* Voiles de lisibilité — effacés pendant le survol pour dégager la carte */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${enVol ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-transparent md:via-night/40" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-night/90 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night/80 to-transparent" />
      </div>

      {/* Bouton pour couper le survol et retrouver l'écran d'accueil */}
      {enVol && (
        <button
          type="button"
          onClick={arreterVol}
          className="glass absolute bottom-28 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-cream md:bottom-10"
        >
          ✕ Arrêter le survol
        </button>
      )}

      <div
        className={`pointer-events-none absolute inset-0 flex items-center transition-opacity duration-700 ${
          enVol ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <motion.div
            className={`${enVol ? 'pointer-events-none' : 'pointer-events-auto'} max-w-2xl pb-20 pt-20 md:pb-0`}
            variants={conteneur}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={element} className="chip mb-5 bg-glacier/15 text-glacier">
              <CalendarDays className="h-3.5 w-3.5" />
              14 → 26 juillet 2026 · {TRIP_META.nbJours} jours
            </motion.p>

            <motion.h1
              variants={element}
              className="font-display text-4xl font-bold leading-[1.08] sm:text-6xl lg:text-7xl"
            >
              Norvège
              <span className="mt-1 block bg-gradient-to-r from-glacier via-glacier-soft to-ember bg-clip-text text-transparent">
                Fjords & Montagnes
              </span>
            </motion.h1>

            <motion.p variants={element} className="mt-4 max-w-lg text-base text-cream-dim sm:text-lg">
              {TRIP_META.sousTitre}
            </motion.p>

            {enVoyage ? (
              <motion.div variants={element} className="mt-6">
                <AujourdHui jour={jour} />
              </motion.div>
            ) : (
              <>
                <motion.div variants={element} className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {compteurs.map((c) => (
                    <div key={c.label} className="glass px-4 py-3">
                      <p className="font-display text-2xl font-bold text-cream sm:text-3xl">
                        <CountUp valeur={c.valeur} />
                        <span className="text-glacier">{c.suffixe}</span>
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-cream-dim">{c.label}</p>
                    </div>
                  ))}
                </motion.div>
                <motion.div variants={element} className="mt-3">
                  <Link
                    to={`/?jour=${TRIP_META.debut}`}
                    className="chip bg-glacier/10 text-glacier transition-colors hover:bg-glacier/20"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    Nouveau : le mode « Aujourd’hui » s’activera ici le 14 juillet — prévisualiser
                  </Link>
                </motion.div>
              </>
            )}

            <motion.div variants={element} className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/itineraire" className="btn-primary px-6 py-3 text-base">
                Voir l’itinéraire <ArrowRight className="h-4 w-4" />
              </Link>
              {map && stops.length > 1 && (
                <button type="button" className="btn-ghost" onClick={relancerVol}>
                  <RotateCcw className="h-4 w-4" /> Survoler la route
                </button>
              )}
            </motion.div>

            <motion.p variants={element} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-cream-dim">
              <span className="inline-flex items-center gap-1.5">
                <Plane className="h-3.5 w-3.5 text-glacier" /> {TRIP_META.vehicule}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-glacier" /> {TRIP_META.voyageurs.length} voyageurs · ~
                {TRIP_META.distanceEstimeeKm.toLocaleString('fr-FR')} km estimés
              </span>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
