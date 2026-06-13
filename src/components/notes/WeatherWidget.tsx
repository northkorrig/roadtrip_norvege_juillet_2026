import { CloudSun, Droplets, Thermometer, Wind } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { TRIP_DAYS } from '../../config/constants'
import { fmtDateCourte } from '../../lib/format'
import {
  descriptionMeteo,
  fetchClimatologieJuillet,
  fetchMeteo,
  type ClimatologieJuillet,
  type MeteoResult,
} from '../../lib/weather'
import { useTripData } from '../../state/TripDataContext'
import { Spinner } from '../ui'

/**
 * Météo par étape via Open-Meteo (sans clé API). Les prévisions n'existent qu'à
 * ~15 jours : au-delà, on affiche les normales climatiques de juillet, calculées
 * à partir des données historiques (réanalyse ERA5) à la position de l'étape.
 */
export default function WeatherWidget(): ReactNode {
  const { etapes } = useTripData()
  const geolocalisees = etapes.filter((e) => e.lat !== null && e.lng !== null)
  const [etapeId, setEtapeId] = useState<string | null>(null)
  const [meteo, setMeteo] = useState<MeteoResult | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [climato, setClimato] = useState<ClimatologieJuillet | null>(null)
  const [climatoChargement, setClimatoChargement] = useState(false)

  const etape = geolocalisees.find((e) => e.id === etapeId) ?? geolocalisees[0] ?? null

  useEffect(() => {
    if (!etape) return
    const debut = etape.date ?? TRIP_DAYS[0]
    const finIdx = Math.min(TRIP_DAYS.indexOf(debut) + 2, TRIP_DAYS.length - 1)
    const fin = finIdx >= 0 ? TRIP_DAYS[finIdx] : debut

    const controller = new AbortController()
    setChargement(true)
    setErreur(null)
    fetchMeteo(etape.lat as number, etape.lng as number, debut, fin, controller.signal)
      .then((r) => setMeteo(r))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setErreur(err instanceof Error ? err.message : 'Météo indisponible')
      })
      .finally(() => {
        if (!controller.signal.aborted) setChargement(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape?.id])

  // Hors horizon de prévision → on charge les normales de juillet (historique).
  useEffect(() => {
    if (!etape || !meteo || meteo.disponible) {
      setClimato(null)
      return
    }
    const controller = new AbortController()
    setClimatoChargement(true)
    setClimato(null)
    fetchClimatologieJuillet(etape.lat as number, etape.lng as number, controller.signal)
      .then((r) => setClimato(r))
      .catch(() => {
        if (!controller.signal.aborted) setClimato(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setClimatoChargement(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape?.id, meteo])

  if (!etape) return null

  return (
    <section className="glass p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
        <CloudSun className="h-5 w-5 text-glacier" /> Météo par étape
      </h3>

      <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {geolocalisees.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEtapeId(e.id)}
            className={`chip shrink-0 ${
              e.id === etape.id ? 'bg-glacier/20 text-glacier' : 'bg-white/[0.05] text-cream-dim hover:bg-white/[0.1]'
            }`}
          >
            J{i + 1} · {e.nom.split('—')[0].split('→')[0].trim()}
          </button>
        ))}
      </div>

      {chargement && (
        <div className="flex items-center gap-3 py-4 text-sm text-cream-dim">
          <Spinner className="h-4 w-4" /> Interrogation d’Open-Meteo…
        </div>
      )}

      {!chargement && erreur && <p className="py-2 text-sm text-red-300">{erreur}</p>}

      {!chargement && !erreur && meteo && !meteo.disponible && (
        <div className="glass-soft px-4 py-3 text-sm text-cream-dim">
          {climatoChargement && (
            <div className="flex items-center gap-3 py-1">
              <Spinner className="h-4 w-4" /> Calcul des normales de juillet (historique)…
            </div>
          )}

          {!climatoChargement && climato && (
            <>
              <p className="mb-2 font-semibold text-cream">
                Normales de juillet — {etape.nom.split('—')[0].split('→')[0].trim()} (moyenne {climato.annees} ans)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-cream-dim">
                    <Thermometer className="h-3 w-3" /> Max
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-cream">~{climato.tMaxMoy}°</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-cream-dim">
                    <Thermometer className="h-3 w-3" /> Min
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-cream">~{climato.tMinMoy}°</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-cream-dim">
                    <Droplets className="h-3 w-3" /> Jours de pluie
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-cream">{climato.pctJoursPluie}%</p>
                </div>
                <div className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-cream-dim">
                    <Wind className="h-3 w-3" /> Vent
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-cream">~{climato.ventMoy} km/h</p>
                </div>
              </div>
              <p className="mt-2 text-xs">
                {climato.precipMoyJour} mm/jour en moyenne · données historiques Open-Meteo (ERA5). Prévisions précises
                disponibles ~15 jours avant le départ.
              </p>
            </>
          )}

          {!climatoChargement && !climato && (
            <p>
              <span className="font-semibold text-cream">Prévisions disponibles ~15 jours avant le départ.</span>{' '}
              Normales de juillet : <strong className="text-cream">10 à 20 °C</strong>, averses fréquentes sur les
              fjords, vent soutenu sur les plateaux. Soleil jusqu’à ~22h30.
            </p>
          )}
        </div>
      )}

      {!chargement && !erreur && meteo?.disponible && (
        <div className="grid gap-2 sm:grid-cols-3">
          {meteo.jours.map((j) => {
            const d = descriptionMeteo(j.code)
            return (
              <div key={j.date} className="glass-soft px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cream-dim">{fmtDateCourte(j.date)}</p>
                <p className="mt-1 text-2xl">{d.emoji}</p>
                <p className="text-sm text-cream">{d.label}</p>
                <p className="mt-1 text-sm tabular-nums text-cream-dim">
                  <strong className="text-cream">{j.tMax}°</strong> / {j.tMin}°
                </p>
                <p className="mt-1 flex items-center gap-3 text-xs text-cream-dim">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> {j.precipitationMm} mm
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="h-3 w-3" /> {j.ventKmh} km/h
                  </span>
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
