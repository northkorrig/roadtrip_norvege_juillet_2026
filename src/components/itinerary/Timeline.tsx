import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, Milestone } from 'lucide-react'
import type { ReactNode } from 'react'
import { fmtDuree, fmtKm } from '../../lib/format'
import { useReadonly } from '../../state/TripDataContext'
import type { Etape, Poi } from '../../types/db'
import EtapeCard, { PoigneeDrag } from './EtapeCard'

interface TimelineProps {
  etapes: Etape[]
  pois: Poi[]
  selectionneeId: string | null
  onSelect: (etape: Etape) => void
  onEdit: (etape: Etape) => void
  onReorder: (ids: string[]) => void
}

function EtapeTriable({
  etape,
  index,
  nbPois,
  selectionnee,
  onSelect,
  onEdit,
}: {
  etape: Etape
  index: number
  nbPois: number
  selectionnee: boolean
  onSelect: () => void
  onEdit: () => void
}): ReactNode {
  const readonly = useReadonly()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: etape.id,
    disabled: readonly,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'z-10 opacity-80' : ''}
    >
      <EtapeCard
        etape={etape}
        index={index}
        nbPois={nbPois}
        selectionnee={selectionnee}
        onSelect={onSelect}
        onEdit={onEdit}
        dragHandle={readonly ? null : <PoigneeDrag {...attributes} {...listeners} />}
      />
    </div>
  )
}

/** Timeline verticale des étapes, réordonnable par drag & drop. */
export default function Timeline({
  etapes,
  pois,
  selectionneeId,
  onSelect,
  onEdit,
  onReorder,
}: TimelineProps): ReactNode {
  // Souris : démarre au-delà de 8 px (laisse passer les clics).
  // Tactile : appui maintenu 200 ms avant de saisir, pour ne pas bloquer le scroll
  //   vertical de la liste sur mobile (problème connu de dnd-kit avec PointerSensor).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const totalKm = etapes.reduce((s, e) => s + (e.km_depuis_precedent ?? 0), 0)
  const totalMin = etapes.reduce((s, e) => s + (e.duree_min ?? 0), 0)

  const finDrag = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const depuis = etapes.findIndex((e) => e.id === active.id)
    const vers = etapes.findIndex((e) => e.id === over.id)
    if (depuis === -1 || vers === -1) return
    onReorder(arrayMove(etapes, depuis, vers).map((e) => e.id))
  }

  const nbPoisParEtape = new Map<string, number>()
  for (const poi of pois) {
    if (poi.etape_id) nbPoisParEtape.set(poi.etape_id, (nbPoisParEtape.get(poi.etape_id) ?? 0) + 1)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finDrag}>
      <SortableContext items={etapes.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ol className="relative space-y-3 pl-4">
          <span aria-hidden className="absolute bottom-6 left-[7px] top-6 w-px bg-gradient-to-b from-ember/60 via-glacier/40 to-glacier/10" />
          {etapes.map((etape, index) => (
            <li key={etape.id} className="relative">
              <span aria-hidden className="absolute -left-4 top-8 h-2 w-2 -translate-x-[3px] rounded-full bg-glacier/70" />
              <EtapeTriable
                etape={etape}
                index={index}
                nbPois={nbPoisParEtape.get(etape.id) ?? 0}
                selectionnee={etape.id === selectionneeId}
                onSelect={() => onSelect(etape)}
                onEdit={() => onEdit(etape)}
              />
            </li>
          ))}
        </ol>
      </SortableContext>

      {/* Agrégat automatique : distance et temps de route cumulés */}
      {etapes.length > 0 && (
        <div className="mt-3 ml-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
          <span className="font-display font-semibold text-cream">Total du trajet</span>
          <span className="inline-flex items-center gap-1.5 text-cream-dim">
            <Milestone className="h-4 w-4 text-glacier" />
            <strong className="text-cream tabular-nums">{fmtKm(totalKm)}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-cream-dim">
            <Clock className="h-4 w-4 text-glacier" />
            <strong className="text-cream tabular-nums">{fmtDuree(totalMin)}</strong> de route
          </span>
        </div>
      )}
    </DndContext>
  )
}
