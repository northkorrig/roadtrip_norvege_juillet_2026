import { CalendarDays, ExternalLink, MapPin, Navigation, ShoppingCart, Tent } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { NUIT_TYPES } from '../../config/constants'
import { fmtDuree, fmtKm } from '../../lib/format'
import { lienGoogleMaps } from '../../lib/googleMaps'
import { descriptionMeteo, fetchMeteo, type JourMeteo } from '../../lib/weather'
import { useTripData } from '../../state/TripDataContext'
import type { Etape } from '../../types/db'

/** Date locale (pas UTC : le soir en Norvège, toISOString rendrait déjà demain). */
export function dateLocaleIso(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function etapeDuJour(etapes: Etape[], jour: string): Etape | null {
  return etapes.find((e) => e.date === jour) ?? null
}

const CHECKS_VAN = ['Gaz fermé', 'Toit & portes OK', 'Vaisselle calée', 'Cales & câble rangés']

function estDimanche(iso: string): boolean {
  return new Date(`${iso}T12:00:00`).getDay() === 0
}

function lendemain(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + 1)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Tableau de bord du jour J, affiché sur l'accueil pendant le voyage :
 * étape du jour, route, météo, POIs prévus, check-list départ van et
 * alerte « supermarchés fermés le dimanche ».
 */
export default function AujourdHui({ jour }: { jour: string }): ReactNode {
  const { etapes, pois } = useTripData()
  const etape = etapeDuJour(etapes, jour)
  const [meteo, setMeteo] = useState<JourMeteo | null>(null)
  const [faits, setFaits] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(`van_check_${jour}`) ?? '[]') as number[])
    } catch {
      return new Set()
    }
  })

  const lat = etape?.lat
  const lng = etape?.lng
  useEffect(() => {
    if (lat == null || lng == null) return
    const ctrl = new AbortController()
    fetchMeteo(lat, lng, jour, jour, ctrl.signal)
      .then((m) => setMeteo(m.jours[0] ?? null))
      .catch(() => setMeteo(null))
    return () => ctrl.abort()
  }, [lat, lng, jour])

  if (!etape) return null

  const index = etapes.indexOf(etape)
  const demain = etapes[index + 1] ?? null
  const poisJour = pois.filter((p) => p.jour === jour)
  const nuit = etape.nuit_type ? NUIT_TYPES[etape.nuit_type] : null
  const dimanche = estDimanche(jour)
  const veilleDimanche = !dimanche && estDimanche(lendemain(jour))

  const cocher = (i: number): void => {
    setFaits((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      try {
        localStorage.setItem(`van_check_${jour}`, JSON.stringify([...next]))
      } catch {
        // stockage indisponible : l'état de la session suffit
      }
      return next
    })
  }

  return (
    <div className="glass max-h-[46dvh] space-y-3 overflow-y-auto p-4 sm:p-5">
      {/* Étape du jour */}
      <div>
        <p className="mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-cream-dim">
          <span className="chip bg-ember/20 px-2 py-0.5 text-[10px] text-ember-soft">
            <CalendarDays className="h-3 w-3" /> Aujourd’hui · Jour {index + 1}/{etapes.length}
          </span>
          {meteo && (
            <span title={descriptionMeteo(meteo.code).label}>
              {descriptionMeteo(meteo.code).emoji} {meteo.tMin}° / {meteo.tMax}°
              {meteo.precipitationMm > 0.5 && ` · ${meteo.precipitationMm} mm`}
              {meteo.ventKmh >= 40 && ` · 💨 ${meteo.ventKmh} km/h`}
            </span>
          )}
        </p>
        <h2 className="font-display text-lg font-bold leading-snug sm:text-xl">{etape.nom}</h2>
        <p className="mt-0.5 text-xs text-cream-dim">
          {etape.km_depuis_precedent ? `${fmtKm(etape.km_depuis_precedent)} · ` : ''}
          {etape.duree_min ? `${fmtDuree(etape.duree_min)} de route · ` : ''}
          {nuit && (
            <span className="inline-flex items-center gap-1">
              <nuit.Icon className="h-3 w-3" /> {nuit.label}
            </span>
          )}
        </p>
      </div>

      {/* Alerte ravitaillement dimanche */}
      {(dimanche || veilleDimanche) && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <ShoppingCart className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {dimanche
            ? 'Dimanche : supermarchés fermés en Norvège (stations-service et petits kiosks ouverts).'
            : 'Demain dimanche : supermarchés fermés — fais le ravitaillement aujourd’hui !'}
        </p>
      )}

      {/* POIs du jour */}
      {poisJour.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {poisJour.slice(0, 5).map((p) => (
            <a
              key={p.id}
              href={lienGoogleMaps(p.lat, p.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="chip bg-glacier/10 px-2.5 py-1 text-[11px] text-glacier hover:bg-glacier/20"
              title="Ouvrir dans Google Maps"
            >
              <MapPin className="h-3 w-3" /> {p.nom}
            </a>
          ))}
          {poisJour.length > 5 && (
            <span className="chip bg-white/[0.06] px-2.5 py-1 text-[11px] text-cream-dim">
              +{poisJour.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Check-list départ van */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {CHECKS_VAN.map((c, i) => (
          <label key={c} className="flex cursor-pointer items-center gap-1.5 text-xs text-cream-dim">
            <input
              type="checkbox"
              checked={faits.has(i)}
              onChange={() => cocher(i)}
              className="h-3.5 w-3.5 accent-[#5BBFBA]"
            />
            <span className={faits.has(i) ? 'line-through opacity-60' : ''}>{c}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {etape.lat != null && etape.lng != null && (
          <a
            href={lienGoogleMaps(etape.lat, etape.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glacier px-3 py-1.5 text-xs"
          >
            <Navigation className="h-3.5 w-3.5" /> Naviguer
          </a>
        )}
        <Link to="/bivouacs" className="btn-ghost px-3 py-1.5 text-xs">
          <Tent className="h-3.5 w-3.5" /> Spot ce soir
        </Link>
        {demain && (
          <span className="inline-flex items-center gap-1 text-[11px] text-cream-dim/70">
            <ExternalLink className="h-3 w-3" /> Demain : {demain.nom}
          </span>
        )}
      </div>
    </div>
  )
}
