import { TRIP_DAYS } from '../config/constants'

const nfFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

export function fmtKm(km: number | null | undefined): string {
  if (km === null || km === undefined || km <= 0) return '—'
  return `${nfFr.format(km)} km`
}

export function fmtDuree(min: number | null | undefined): string {
  if (min === null || min === undefined || min <= 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

export function fmtMontant(eur: number, devise: 'EUR' | 'NOK', nokParEur: number): string {
  const valeur = devise === 'EUR' ? eur : eur * nokParEur
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    maximumFractionDigits: devise === 'EUR' ? 0 : 0,
  }).format(valeur)
}

export function fmtDateLongue(iso: string | null | undefined): string {
  if (!iso) return 'Sans date'
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function fmtDateCourte(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "J3" si la date appartient au voyage, sinon null. */
export function jourLabel(iso: string | null | undefined): string | null {
  if (!iso) return null
  const i = TRIP_DAYS.indexOf(iso)
  return i === -1 ? null : `J${i + 1}`
}

export function fmtCoord(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return '—'
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}
