import { CalendarClock, ExternalLink, Plus, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { LS_KEYS } from '../../config/constants'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { SEED_RESERVATIONS } from '../../lib/seedData'
import { fmtDateCourte } from '../../lib/format'
import { useReadonly } from '../../state/TripDataContext'
import type { Reservation, ReservationStatut } from '../../types/db'

const STATUTS: Record<ReservationStatut, { label: string; classe: string }> = {
  a_faire: { label: 'À faire', classe: 'bg-ember/20 text-ember-soft ring-1 ring-inset ring-ember/40' },
  en_cours: { label: 'En cours', classe: 'bg-[#F0C04A]/15 text-[#F0C04A] ring-1 ring-inset ring-[#F0C04A]/40' },
  confirme: { label: 'Confirmé', classe: 'bg-glacier/15 text-glacier ring-1 ring-inset ring-glacier/40' },
}

const ORDRE_STATUTS: ReservationStatut[] = ['a_faire', 'en_cours', 'confirme']

function suivant(statut: ReservationStatut): ReservationStatut {
  return ORDRE_STATUTS[(ORDRE_STATUTS.indexOf(statut) + 1) % ORDRE_STATUTS.length]
}

function echeanceProche(echeance: string | null): boolean {
  if (!echeance) return false
  const limite = new Date(`${echeance}T23:59:59`)
  const dans20Jours = new Date()
  dans20Jours.setDate(dans20Jours.getDate() + 20)
  return limite <= dans20Jours
}

/**
 * Réservations à faire — persistées en localStorage (le schéma BDD est figé
 * aux 5 tables : etapes, pois, notes, taches, depenses).
 */
export default function Reservations(): ReactNode {
  const readonly = useReadonly()
  const [reservations, setReservations] = useLocalStorage<Reservation[]>(LS_KEYS.reservations, SEED_RESERVATIONS)
  const [nouveauLabel, setNouveauLabel] = useState('')

  const changerStatut = (id: string): void => {
    setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, statut: suivant(r.statut) } : r)))
  }

  const supprimer = (id: string): void => {
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  const ajouter = (e: React.FormEvent): void => {
    e.preventDefault()
    const label = nouveauLabel.trim()
    if (!label) return
    setReservations((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label, statut: 'a_faire', url: null, echeance: null, note: null },
    ])
    setNouveauLabel('')
  }

  return (
    <div className="space-y-2.5">
      {reservations.map((r) => (
        <div key={r.id} className="glass-soft flex flex-wrap items-center gap-2.5 px-3.5 py-3">
          <button
            type="button"
            disabled={readonly}
            onClick={() => changerStatut(r.id)}
            className={`chip shrink-0 ${STATUTS[r.statut].classe} ${readonly ? '' : 'cursor-pointer'}`}
            title={readonly ? undefined : 'Cliquer pour changer le statut'}
          >
            {STATUTS[r.statut].label}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-cream">{r.label}</p>
            {r.note && <p className="text-xs text-cream-dim">{r.note}</p>}
          </div>
          {r.echeance && r.statut !== 'confirme' && (
            <span
              className={`chip shrink-0 ${
                echeanceProche(r.echeance) ? 'bg-red-500/15 text-red-300' : 'bg-white/[0.07] text-cream-dim'
              }`}
              title="Échéance de réservation"
            >
              <CalendarClock className="h-3 w-3" />
              avant le {fmtDateCourte(r.echeance)}
            </span>
          )}
          {r.url && (
            <a href={r.url} target="_blank" rel="noreferrer" className="btn-glacier shrink-0 px-2.5 py-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> Réserver
            </a>
          )}
          {!readonly && (
            <button type="button" className="btn-ghost shrink-0 p-1.5" onClick={() => supprimer(r.id)} title="Retirer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}

      {!readonly && (
        <form onSubmit={ajouter} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ajouter une réservation…"
            value={nouveauLabel}
            onChange={(e) => setNouveauLabel(e.target.value)}
          />
          <button type="submit" className="btn-ghost shrink-0 px-3" disabled={!nouveauLabel.trim()}>
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  )
}
