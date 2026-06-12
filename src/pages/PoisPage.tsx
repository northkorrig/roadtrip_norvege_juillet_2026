import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { List, Map as MapIcon, Plus, Search, Tent } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import MapCanvas from '../components/map/MapCanvas'
import { useTripMarkers } from '../components/map/mapLayers'
import BivouacSearch from '../components/pois/BivouacSearch'
import ImportExportMenu from '../components/pois/ImportExportMenu'
import PoiCard from '../components/pois/PoiCard'
import PoiForm, { type PoiPrefill } from '../components/pois/PoiForm'
import { PoigneeDrag } from '../components/itinerary/EtapeCard'
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
  Modal,
  PageTransition,
  useAction,
} from '../components/ui'
import { POI_CATEGORIES, POI_CATEGORIE_LIST } from '../config/constants'
import { draftsToInputs, type PoiDraft } from '../lib/importExport'
import { useReadonly, useTripData } from '../state/TripDataContext'
import type { Etape, LatLng, Poi, PoiCategorie } from '../types/db'

function PoiTriable({
  poi,
  onEdit,
  onDelete,
}: {
  poi: Poi
  onEdit: () => void
  onDelete: () => void
}): ReactNode {
  const readonly = useReadonly()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: poi.id,
    disabled: readonly,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'z-10 opacity-80' : ''}
    >
      <PoiCard
        poi={poi}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandle={readonly ? null : <PoigneeDrag {...attributes} {...listeners} />}
      />
    </div>
  )
}

export default function PoisPage(): ReactNode {
  const { etapes, pois, chargement, erreur, recharger, creerPois, supprimerPoi, reordonnerPois } = useTripData()
  const readonly = useReadonly()
  const executer = useAction()

  const [vue, setVue] = useState<'liste' | 'carte'>('liste')
  const [filtres, setFiltres] = useState<Set<PoiCategorie>>(new Set())
  const [recherche, setRecherche] = useState('')
  const [formOuvert, setFormOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState<Poi | null>(null)
  const [prefill, setPrefill] = useState<PoiPrefill | null>(null)
  const [bivouacOuvert, setBivouacOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<Poi | null>(null)
  const [importDrafts, setImportDrafts] = useState<PoiDraft[] | null>(null)
  const [poiBulle, setPoiBulle] = useState<Poi | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const filtrés = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return pois.filter((p) => {
      if (filtres.size > 0 && !filtres.has(p.categorie)) return false
      if (q && !`${p.nom} ${p.note ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [pois, filtres, recherche])

  // Liste groupée par étape (ordre du voyage), puis "sans étape"
  const groupes = useMemo(() => {
    const out: { etape: Etape | null; items: Poi[] }[] = []
    for (const etape of etapes) {
      const items = filtrés.filter((p) => p.etape_id === etape.id)
      if (items.length > 0) out.push({ etape, items })
    }
    const sans = filtrés.filter((p) => !p.etape_id || !etapes.some((e) => e.id === p.etape_id))
    if (sans.length > 0) out.push({ etape: null, items: sans })
    return out
  }, [etapes, filtrés])

  const basculerFiltre = (c: PoiCategorie): void => {
    setFiltres((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  // Drag & drop : réordonner uniquement au sein d'une même étape
  const finDrag = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const actif = pois.find((p) => p.id === active.id)
    const cible = pois.find((p) => p.id === over.id)
    if (!actif || !cible || actif.etape_id !== cible.etape_id) return

    const groupe = groupes.find((g) => (g.etape?.id ?? null) === (actif.etape_id ?? null))
    if (!groupe) return
    const idsGroupe = groupe.items.map((p) => p.id)
    const reordonne = arrayMove(idsGroupe, idsGroupe.indexOf(actif.id), idsGroupe.indexOf(cible.id))

    // ordre global : groupes dans l'ordre d'affichage, items dans leur nouvel ordre
    const idsGlobaux = groupes.flatMap((g) =>
      (g.etape?.id ?? null) === (actif.etape_id ?? null) ? reordonne : g.items.map((p) => p.id),
    )
    void executer(() => reordonnerPois(idsGlobaux))
  }

  const ouvrirCreation = (pos?: LatLng | PoiPrefill): void => {
    setEnEdition(null)
    setPrefill(pos ?? null)
    setFormOuvert(true)
  }
  const ouvrirEdition = (poi: Poi): void => {
    setEnEdition(poi)
    setPrefill(null)
    setFormOuvert(true)
  }

  const onMapReady = useCallback((m: google.maps.Map) => setMap(m), [])
  const onMapClick = useCallback(
    (pos: LatLng) => {
      if (!readonly) ouvrirCreation(pos)
    },
    [readonly],
  )
  const onPoiMarker = useCallback((p: Poi) => setPoiBulle(p), [])

  useTripMarkers(map, {
    pois: filtrés,
    poiSelectionne: poiBulle?.id ?? null,
    onPoiClick: onPoiMarker,
  })

  const confirmerImport = async (): Promise<void> => {
    if (!importDrafts) return
    const drafts = importDrafts
    setImportDrafts(null)
    await executer(
      () => creerPois(draftsToInputs(drafts, pois.length)),
      `${drafts.length} POI${drafts.length > 1 ? 's' : ''} importé${drafts.length > 1 ? 's' : ''}`,
    )
  }

  if (chargement) return <LoadingScreen />

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-[4.75rem] sm:px-4 md:pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Points d’intérêt</h1>
            <p className="text-xs text-cream-dim">
              {filtrés.length} / {pois.length} POIs
              {vue === 'carte' && !readonly && ' · clique sur la carte pour en ajouter un'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-white/[0.06] p-1">
              <button type="button" onClick={() => setVue('liste')} className={`chip ${vue === 'liste' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}>
                <List className="h-3.5 w-3.5" /> Liste
              </button>
              <button type="button" onClick={() => setVue('carte')} className={`chip ${vue === 'carte' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}>
                <MapIcon className="h-3.5 w-3.5" /> Carte
              </button>
            </div>
            {!readonly && <ImportExportMenu onImport={setImportDrafts} />}
            {!readonly && (
              <button type="button" className="btn-ghost" onClick={() => setBivouacOuvert(true)}>
                <Tent className="h-4 w-4" /> Bivouacs
              </button>
            )}
            {!readonly && (
              <button type="button" className="btn-primary" onClick={() => ouvrirCreation()}>
                <Plus className="h-4 w-4" /> POI
              </button>
            )}
          </div>
        </div>

        {erreur && (
          <div className="mb-4">
            <ErrorBanner message={erreur} onRetry={() => void recharger()} />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim/60" />
            <input
              className="input pl-10"
              placeholder="Filtrer par nom…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {POI_CATEGORIE_LIST.map((c) => {
              const meta = POI_CATEGORIES[c]
              const actif = filtres.has(c)
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => basculerFiltre(c)}
                  className="chip shrink-0 transition-all"
                  style={
                    actif
                      ? { backgroundColor: `${meta.couleur}2e`, color: meta.couleur, boxShadow: `inset 0 0 0 1px ${meta.couleur}88` }
                      : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#B7C2CC' }
                  }
                >
                  <meta.Icon style={{ width: 13, height: 13 }} />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {vue === 'carte' ? (
          <div className="relative h-[calc(100dvh-21rem)] min-h-[24rem] overflow-hidden rounded-2xl border border-white/10">
            <MapCanvas className="h-full" onReady={onMapReady} onMapClick={onMapClick} />
            {poiBulle && (
              <div className="glass absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-sm px-4 py-3">
                <p className="text-sm font-semibold">{poiBulle.nom}</p>
                <p className="text-xs text-cream-dim">{POI_CATEGORIES[poiBulle.categorie].label}</p>
                {!readonly && (
                  <button type="button" className="btn-glacier mt-2 px-3 py-1.5 text-xs" onClick={() => ouvrirEdition(poiBulle)}>
                    Modifier
                  </button>
                )}
              </div>
            )}
          </div>
        ) : filtrés.length === 0 ? (
          <EmptyState
            titre="Aucun POI ne correspond"
            detail="Modifie les filtres, ou ajoute un POI via le bouton, un clic sur la carte, ou un import KML/GPX/CSV."
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={finDrag}>
            <div className="space-y-6">
              {groupes.map((g) => (
                <section key={g.etape?.id ?? 'sans-etape'}>
                  <h2 className="mb-2 flex items-baseline gap-2 font-display text-lg font-semibold">
                    {g.etape ? (
                      <>
                        <span className="text-glacier">J{etapes.indexOf(g.etape) + 1}</span>
                        {g.etape.nom}
                      </>
                    ) : (
                      'Sans étape'
                    )}
                    <span className="text-xs font-normal text-cream-dim">({g.items.length})</span>
                  </h2>
                  <SortableContext items={g.items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                      {g.items.map((p) => (
                        <PoiTriable key={p.id} poi={p} onEdit={() => ouvrirEdition(p)} onDelete={() => setASupprimer(p)} />
                      ))}
                    </div>
                  </SortableContext>
                </section>
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <BivouacSearch
        ouvert={bivouacOuvert}
        onFermer={() => setBivouacOuvert(false)}
        onAjouter={(p) => ouvrirCreation(p)}
      />

      <PoiForm ouvert={formOuvert} poi={enEdition} prefill={prefill} onFermer={() => setFormOuvert(false)} />

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        titre="Supprimer ce POI ?"
        message={`« ${aSupprimer?.nom ?? ''} » sera définitivement supprimé.`}
        onConfirmer={() => {
          const poi = aSupprimer
          setASupprimer(null)
          if (poi) void executer(() => supprimerPoi(poi.id), 'POI supprimé')
        }}
        onAnnuler={() => setASupprimer(null)}
      />

      <Modal ouvert={importDrafts !== null} onFermer={() => setImportDrafts(null)} titre="Confirmer l’import">
        {importDrafts && (
          <>
            <p className="text-sm text-cream-dim">
              <strong className="text-cream">{importDrafts.length}</strong> point{importDrafts.length > 1 ? 's' : ''}{' '}
              trouvé{importDrafts.length > 1 ? 's' : ''} dans le fichier :
            </p>
            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm text-cream-dim">
              {importDrafts.slice(0, 12).map((d, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate text-cream">{d.nom}</span>
                  <span className="shrink-0 tabular-nums text-cream-dim/60">
                    {d.lat.toFixed(3)}, {d.lng.toFixed(3)}
                  </span>
                </li>
              ))}
              {importDrafts.length > 12 && <li>… et {importDrafts.length - 12} autres</li>}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setImportDrafts(null)}>
                Annuler
              </button>
              <button type="button" className="btn-primary" onClick={() => void confirmerImport()}>
                Importer
              </button>
            </div>
          </>
        )}
      </Modal>
    </PageTransition>
  )
}
