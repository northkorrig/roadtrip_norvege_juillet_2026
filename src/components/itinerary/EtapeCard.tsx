import { motion } from 'framer-motion'
import { CalendarCheck, Clock, GripVertical, MapPin, Milestone, Mountain, Pencil, Ship } from 'lucide-react'
import type { ReactNode } from 'react'
import { NUIT_TYPES } from '../../config/constants'
import { fmtDateCourte, fmtDuree, fmtKm } from '../../lib/format'
import { Markdown } from '../../lib/markdown'
import { useReadonly } from '../../state/TripDataContext'
import type { Etape } from '../../types/db'

interface EtapeCardProps {
  etape: Etape
  index: number
  nbPois: number
  selectionnee: boolean
  onSelect: () => void
  onEdit: () => void
  dragHandle?: ReactNode
}

/** Badges dérivés du contenu de la note (le schéma ne prévoit pas de colonnes dédiées). */
function badgesDe(note: string | null): { reserver: boolean; rando: boolean; ferry: boolean } {
  const n = note ?? ''
  return {
    reserver: /réserver|reserver/i.test(n),
    rando: /rando/i.test(n),
    ferry: /ferry/i.test(n),
  }
}

export default function EtapeCard({
  etape,
  index,
  nbPois,
  selectionnee,
  onSelect,
  onEdit,
  dragHandle,
}: EtapeCardProps): ReactNode {
  const readonly = useReadonly()
  const badges = badgesDe(etape.note)
  const nuit = etape.nuit_type ? NUIT_TYPES[etape.nuit_type] : null

  return (
    <motion.article
      layout
      id={`etape-card-${etape.id}`}
      onClick={onSelect}
      className={`glass cursor-pointer p-4 transition-shadow duration-300 sm:p-5 ${
        selectionnee ? 'border-glacier/60 shadow-glow' : 'hover:border-white/20'
      }`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
              selectionnee ? 'bg-glacier text-night-deep' : 'bg-ember text-night-deep'
            }`}
          >
            J{index + 1}
          </span>
          {dragHandle}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-cream-dim">
            {fmtDateCourte(etape.date)}
          </p>
          <h3 className="font-display text-lg font-semibold leading-snug text-cream">{etape.nom}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-cream-dim">
            <span className="inline-flex items-center gap-1.5">
              <Milestone className="h-3.5 w-3.5 text-glacier" />
              {fmtKm(etape.km_depuis_precedent)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-glacier" />
              {fmtDuree(etape.duree_min)}
            </span>
            {nuit && (
              <span className="inline-flex items-center gap-1.5">
                <nuit.Icon className="h-3.5 w-3.5 text-glacier" />
                {nuit.label}
              </span>
            )}
            {nbPois > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-glacier" />
                {nbPois} POI{nbPois > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {(badges.reserver || badges.rando || badges.ferry) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {badges.reserver && (
                <span className="chip bg-ember/15 text-ember-soft">
                  <CalendarCheck className="h-3 w-3" /> Réservation requise
                </span>
              )}
              {badges.rando && (
                <span className="chip bg-glacier/15 text-glacier">
                  <Mountain className="h-3 w-3" /> Rando du jour
                </span>
              )}
              {badges.ferry && (
                <span className="chip bg-[#6FA8FF]/15 text-[#9cc2ff]">
                  <Ship className="h-3 w-3" /> Ferry
                </span>
              )}
            </div>
          )}

          {etape.note && (
            <div className="mt-3">
              <Markdown text={etape.note} />
            </div>
          )}
        </div>

        {!readonly && (
          <button
            type="button"
            className="btn-ghost shrink-0 p-2"
            title="Modifier l'étape"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.article>
  )
}

export function PoigneeDrag(props: Record<string, unknown>): ReactNode {
  return (
    <button
      type="button"
      className="cursor-grab touch-none rounded p-1 text-cream-dim/50 hover:text-glacier active:cursor-grabbing"
      title="Glisser pour réordonner"
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}
