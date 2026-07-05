import { CalendarDays, CloudSun, Droplets, MapPinOff, RefreshCw, Wind } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EmptyState, ErrorBanner, LoadingScreen, PageTransition, Spinner } from '../components/ui'
import { fmtDateLongue, jourLabel } from '../lib/format'
import { descriptionMeteo, fetchMeteoPoints, type JourMeteo, type MeteoPoint } from '../lib/weather'
import { useTripData } from '../state/TripDataContext'
import type { Etape } from '../types/db'

/** Date du jour au format ISO, en heure locale (pas UTC). */
function aujourdHuiIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function joursAvant(dateIso: string, ref: string): number {
  return Math.round((new Date(`${dateIso}T12:00:00`).getTime() - new Date(`${ref}T12:00:00`).getTime()) / 86_400_000)
}

/** Une donnée météo (température, vent…) avec son icône. */
function Donnee({ Icon, children }: { Icon: typeof Wind; children: ReactNode }): ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-cream-dim">
      <Icon className="h-3 w-3" /> {children}
    </span>
  )
}

function BlocPrevision({ jour }: { jour: JourMeteo }): ReactNode {
  const d = descriptionMeteo(jour.code)
  return (
    <>
      <p className="flex items-center gap-2">
        <span className="text-3xl leading-none">{d.emoji}</span>
        <span className="text-sm text-cream">{d.label}</span>
      </p>
      <p className="mt-1.5 text-sm tabular-nums text-cream-dim">
        <strong className="text-lg text-cream">{jour.tMax}°</strong> / {jour.tMin}°
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Donnee Icon={Droplets}>{jour.precipitationMm} mm</Donnee>
        <Donnee Icon={Wind}>{jour.ventKmh} km/h</Donnee>
      </p>
    </>
  )
}

export default function MeteoPage(): ReactNode {
  const { etapes, chargement } = useTripData()
  const [meteo, setMeteo] = useState<MeteoPoint[] | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [majLe, setMajLe] = useState<Date | null>(null)

  const aujourdHui = aujourdHuiIso()

  // Étapes à venir (aujourd'hui inclus), géolocalisées — une carte météo chacune.
  const futures = useMemo(
    () =>
      etapes
        .filter((e): e is Etape & { date: string; lat: number; lng: number } =>
          e.date !== null && e.date >= aujourdHui && e.lat !== null && e.lng !== null,
        )
        .sort((a, b) => (a.date === b.date ? a.ordre - b.ordre : a.date.localeCompare(b.date))),
    [etapes, aujourdHui],
  )
  const sansCoords = useMemo(
    () => etapes.filter((e) => e.date !== null && e.date >= aujourdHui && (e.lat === null || e.lng === null)),
    [etapes, aujourdHui],
  )

  const charger = useCallback(
    (signal?: AbortSignal): void => {
      if (futures.length === 0) return
      setEnCours(true)
      setErreur(null)
      fetchMeteoPoints(futures.map((e) => ({ lat: e.lat, lng: e.lng })), signal)
        .then((r) => {
          setMeteo(r)
          setMajLe(new Date())
        })
        .catch((err: unknown) => {
          if (signal?.aborted) return
          setErreur(err instanceof Error ? err.message : 'Météo indisponible')
        })
        .finally(() => {
          if (!signal?.aborted) setEnCours(false)
        })
    },
    [futures],
  )

  useEffect(() => {
    const controller = new AbortController()
    charger(controller.signal)
    return () => controller.abort()
  }, [charger])

  if (chargement) return <LoadingScreen />

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-[4.75rem] sm:px-4 md:pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Météo des étapes</h1>
            <p className="text-xs text-cream-dim">
              Conditions actuelles sur place et prévisions pour le jour de chaque étape à venir (Open-Meteo)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {majLe && (
              <span className="text-[11px] text-cream-dim/70">
                Mis à jour à {majLe.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              className="btn-ghost p-2.5"
              onClick={() => charger()}
              disabled={enCours}
              title="Actualiser la météo"
            >
              <RefreshCw className={`h-4 w-4 ${enCours ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {erreur && (
          <div className="mb-4">
            <ErrorBanner message={erreur} onRetry={() => charger()} />
          </div>
        )}

        {futures.length === 0 && (
          <EmptyState
            titre="Aucune étape à venir"
            detail="Toutes les étapes datées et géolocalisées sont passées — bon retour à la maison !"
          />
        )}

        {futures.length > 0 && enCours && !meteo && (
          <div className="flex items-center gap-3 py-8 text-sm text-cream-dim">
            <Spinner className="h-4 w-4" /> Interrogation d’Open-Meteo pour {futures.length} étapes…
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {meteo &&
            futures.map((e, i) => {
              const point = meteo[i]
              const previsionJour = point?.jours.find((j) => j.date === e.date) ?? null
              const dansJours = joursAvant(e.date, aujourdHui)
              const jour = jourLabel(e.date)

              return (
                <article key={e.id} className="glass p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-semibold leading-snug">{e.nom}</h2>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-cream-dim">
                        <CalendarDays className="h-3 w-3" /> {fmtDateLongue(e.date)}
                        {dansJours === 0 ? ' · aujourd’hui' : ` · dans ${dansJours} j`}
                      </p>
                    </div>
                    {jour && <span className="chip shrink-0 bg-glacier/15 text-glacier">{jour}</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="glass-soft min-w-0 px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cream-dim/70">
                        Sur place maintenant
                      </p>
                      {point?.actuelle ? (
                        <>
                          <p className="flex items-center gap-2">
                            <span className="text-3xl leading-none">{descriptionMeteo(point.actuelle.code).emoji}</span>
                            <span className="text-sm text-cream">{descriptionMeteo(point.actuelle.code).label}</span>
                          </p>
                          <p className="mt-1.5 text-lg font-semibold tabular-nums text-cream">
                            {point.actuelle.temperature}°
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Donnee Icon={Droplets}>{point.actuelle.precipitationMm} mm</Donnee>
                            <Donnee Icon={Wind}>{point.actuelle.ventKmh} km/h</Donnee>
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-cream-dim">Indisponible</p>
                      )}
                    </div>

                    <div className="glass-soft min-w-0 px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-cream-dim/70">
                        Le jour de l’étape
                      </p>
                      {previsionJour ? (
                        <BlocPrevision jour={previsionJour} />
                      ) : (
                        <p className="text-sm leading-relaxed text-cream-dim">
                          <CloudSun className="mb-1 h-4 w-4 text-glacier" />
                          Hors horizon de prévision (~16 j). Normales de juillet :{' '}
                          <strong className="text-cream">10 à 20 °C</strong>, averses fréquentes sur les fjords.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
        </div>

        {sansCoords.length > 0 && (
          <p className="mt-5 flex items-center gap-2 text-xs text-cream-dim/70">
            <MapPinOff className="h-3.5 w-3.5" />
            {sansCoords.length === 1
              ? `1 étape à venir sans coordonnées GPS (non affichée) : ${sansCoords[0].nom}`
              : `${sansCoords.length} étapes à venir sans coordonnées GPS ne sont pas affichées.`}
          </p>
        )}
      </div>
    </PageTransition>
  )
}
