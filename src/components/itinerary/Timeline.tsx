import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'
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
  // Sur iOS, le PointerSensor entre en conflit avec le scroll de page. Le
  // TouchSensor avec un délai d'activation (250 ms) distingue clairement un
  // appui maintenu (drag) d'un simple défilement.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

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
    </DndContext>
  )
}
