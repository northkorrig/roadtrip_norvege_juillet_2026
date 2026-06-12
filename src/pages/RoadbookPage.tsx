import { ArrowLeft, Printer } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  DEPENSE_CATEGORIES,
  LS_KEYS,
  NUIT_TYPES,
  POI_CATEGORIES,
  TACHE_CATEGORIES,
  TRIP_META,
} from '../config/constants'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { fmtDateLongue, fmtDuree, fmtKm } from '../lib/format'
import { SEED_RESERVATIONS } from '../lib/seedData'
import { useTripData } from '../state/TripDataContext'
import type { Reservation, TacheCategorie } from '../types/db'
import { LoadingScreen } from '../components/ui'

const STATUT_LABEL: Record<Reservation['statut'], string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  confirme: 'Confirmé',
}

/**
 * Roadbook complet en thème clair, optimisé pour l'impression :
 * « Imprimer » → choisir « Enregistrer en PDF » dans le navigateur.
 */
export default function RoadbookPage(): ReactNode {
  const { etapes, pois, notes, taches, depenses, chargement } = useTripData()
  const [budget] = useLocalStorage<number>(LS_KEYS.budget, TRIP_META.budgetDefautEur)
  const [reservations] = useLocalStorage<Reservation[]>(LS_KEYS.reservations, SEED_RESERVATIONS)

  if (chargement) return <LoadingScreen />

  const totalDepense = depenses.reduce((s, d) => s + d.montant, 0)
  const kmTotal = Math.round(etapes.reduce((s, e) => s + (e.km_depuis_precedent ?? 0), 0))
  const euros = (n: number): string => `${Math.round(n).toLocaleString('fr-FR')} €`

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-[#16242f]">
      {/* Barre d'action, masquée à l'impression */}
      <div className="no-print sticky top-0 z-10 border-b border-black/10 bg-[#f6f4ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#16242f]/70 hover:text-[#16242f]">
            <ArrowLeft className="h-4 w-4" /> Retour à l’app
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E8824A] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#d97539]"
          >
            <Printer className="h-4 w-4" /> Imprimer / Exporter en PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Couverture */}
        <header className="print-page mb-10 border-b-2 border-[#16242f] pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E8824A]">Roadbook</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight">{TRIP_META.nom}</h1>
          <p className="mt-3 text-sm text-[#16242f]/70">
            Du mardi 14 au dimanche 26 juillet 2026 · {TRIP_META.nbJours} jours · {kmTotal.toLocaleString('fr-FR')} km
            <br />
            {TRIP_META.vehicule} · {TRIP_META.voyageurs.length} voyageurs
          </p>
        </header>

        {/* Itinéraire jour par jour */}
        <section className="mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Itinéraire jour par jour</h2>
          <div className="space-y-5">
            {etapes.map((e, i) => {
              const poisDuJour = pois.filter((p) => p.etape_id === e.id)
              return (
                <article key={e.id} className="print-page rounded-xl border border-black/10 bg-white p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="rounded-lg bg-[#E8824A] px-2.5 py-1 font-display text-sm font-bold text-white">
                      J{i + 1}
                    </span>
                    <h3 className="font-display text-lg font-bold">{e.nom}</h3>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-[#16242f]/55">
                    {fmtDateLongue(e.date)}
                    {e.km_depuis_precedent ? ` · ${fmtKm(e.km_depuis_precedent)}` : ''}
                    {e.duree_min ? ` · ${fmtDuree(e.duree_min)} de route` : ''}
                    {e.nuit_type ? ` · nuit : ${NUIT_TYPES[e.nuit_type].label.toLowerCase()}` : ''}
                  </p>
                  {e.note && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#16242f]/85">{e.note}</p>}
                  {poisDuJour.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-black/[0.07] pt-3 text-sm">
                      {poisDuJour.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-baseline gap-x-2">
                          <strong>{p.nom}</strong>
                          <span className="text-xs text-[#16242f]/55">
                            [{POI_CATEGORIES[p.categorie].label}] {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {/* Budget */}
        <section className="print-break mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Budget</h2>
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-black/[0.03] text-left text-xs uppercase tracking-wide text-[#16242f]/60">
                  <th className="px-4 py-2.5">Poste</th>
                  <th className="px-4 py-2.5">Catégorie</th>
                  <th className="px-4 py-2.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {depenses.map((d) => (
                  <tr key={d.id} className="border-b border-black/[0.05]">
                    <td className="px-4 py-2">{d.label}</td>
                    <td className="px-4 py-2 text-[#16242f]/60">{DEPENSE_CATEGORIES[d.categorie].label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{euros(d.montant)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-black/[0.03] font-bold">
                  <td className="px-4 py-2.5" colSpan={2}>
                    Total engagé (budget : {euros(budget)})
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{euros(totalDepense)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Réservations */}
        <section className="print-page mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Réservations</h2>
          <ul className="space-y-1.5 text-sm">
            {reservations.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className={r.statut === 'confirme' ? '' : 'font-semibold'}>
                  {r.statut === 'confirme' ? '☑' : '☐'} {r.label}
                </span>
                <span className="text-xs text-[#16242f]/55">
                  — {STATUT_LABEL[r.statut]}
                  {r.url ? ` · ${r.url.replace(/^https?:\/\/(www\.)?/, '')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Checklist */}
        <section className="print-page mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Checklist</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {(Object.keys(TACHE_CATEGORIES) as TacheCategorie[]).map((cat) => (
              <div key={cat}>
                <h3 className="mb-2 font-display text-base font-bold">{TACHE_CATEGORIES[cat].label}</h3>
                <ul className="space-y-1 text-sm">
                  {taches
                    .filter((t) => t.categorie === cat)
                    .map((t) => (
                      <li key={t.id} className={t.completee ? 'text-[#16242f]/45 line-through' : ''}>
                        {t.completee ? '☑' : '☐'} {t.texte}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="mb-10">
          <h2 className="mb-4 font-display text-2xl font-bold">Notes</h2>
          <div className="space-y-4">
            {notes.map((n) => (
              <article key={n.id} className="print-page rounded-xl border border-black/10 bg-white p-5">
                <h3 className="font-display text-base font-bold">{n.titre}</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#16242f]/85">
                  {n.contenu.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-black/10 pt-4 text-center text-xs text-[#16242f]/50">
          {TRIP_META.nom} — roadbook généré le {new Date().toLocaleDateString('fr-FR')} · god tur ! 🇳🇴
        </footer>
      </div>
    </div>
  )
}
