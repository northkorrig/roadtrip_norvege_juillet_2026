import { Eye, ExternalLink, Navigation, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { POI_CATEGORIES } from '../../config/constants'
import { fmtCoord, jourLabel } from '../../lib/format'
import { lienGoogleMaps, lienStreetView, lienWaze } from '../../lib/googleMaps'
import { Markdown } from '../../lib/markdown'
import { useReadonly } from '../../state/TripDataContext'
import type { Poi } from '../../types/db'

interface PoiCardProps {
  poi: Poi
  selectionne?: boolean
  onSelect?: () => void
  onEdit: () => void
  onDelete: () => void
  dragHandle?: ReactNode
}

export default function PoiCard({ poi, selectionne = false, onSelect, onEdit, onDelete, dragHandle }: PoiCardProps): ReactNode {
  const readonly = useReadonly()
  const meta = POI_CATEGORIES[poi.categorie]
  const jour = jourLabel(poi.jour)

  return (
    <article
      className={`glass-soft flex items-start gap-3 p-3.5 transition-colors ${
        selectionne ? 'border-glacier/50 bg-glacier/[0.07]' : 'hover:bg-white/[0.06]'
      } ${onSelect ? 'cursor-pointer' : ''}`}
      onClick={onSelect}
    >
      {dragHandle}
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${meta.couleur}22`, color: meta.couleur }}
        title={meta.label}
      >
        <meta.Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="font-semibold leading-snug text-cream">{poi.nom}</h3>
          {jour && <span className="chip bg-white/[0.07] px-2 py-0.5 text-[10px] text-cream-dim">{jour}</span>}
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-cream-dim/70">{fmtCoord(poi.lat, poi.lng)}</p>
        {poi.note && <Markdown text={poi.note} className="mt-1.5 line-clamp-3" />}

        <div className="mt-2 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <a className="btn-ghost px-2 py-1.5 text-[11px]" href={lienStreetView(poi.lat, poi.lng)} target="_blank" rel="noreferrer" title="Street View">
            <Eye className="h-3.5 w-3.5" /> Street View
          </a>
          <a className="btn-ghost px-2 py-1.5 text-[11px]" href={lienGoogleMaps(poi.lat, poi.lng)} target="_blank" rel="noreferrer" title="Ouvrir dans Google Maps">
            <ExternalLink className="h-3.5 w-3.5" /> Maps
          </a>
          <a className="btn-ghost px-2 py-1.5 text-[11px]" href={lienWaze(poi.lat, poi.lng)} target="_blank" rel="noreferrer" title="Ouvrir dans Waze">
            <Navigation className="h-3.5 w-3.5" /> Waze
          </a>
          {!readonly && (
            <>
              <button type="button" className="btn-ghost px-2 py-1.5 text-[11px]" onClick={onEdit} title="Modifier">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="btn-ghost px-2 py-1.5 text-[11px] text-red-300" onClick={onDelete} title="Supprimer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
