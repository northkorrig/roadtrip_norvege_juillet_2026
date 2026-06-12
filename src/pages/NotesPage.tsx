import { Info, ListChecks, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import Checklist from '../components/notes/Checklist'
import InfosPratiques from '../components/notes/InfosPratiques'
import NoteEditor from '../components/notes/NoteEditor'
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
  PageTransition,
  useAction,
} from '../components/ui'
import { fmtDateCourte, jourLabel } from '../lib/format'
import { Markdown } from '../lib/markdown'
import { useReadonly, useTripData } from '../state/TripDataContext'
import type { Note } from '../types/db'

type Onglet = 'notes' | 'checklist' | 'infos'

const ONGLETS: { id: Onglet; label: string; Icon: typeof NotebookPen }[] = [
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
  { id: 'checklist', label: 'Checklist', Icon: ListChecks },
  { id: 'infos', label: 'Infos pratiques', Icon: Info },
]

export default function NotesPage(): ReactNode {
  const { notes, pois, chargement, erreur, recharger, supprimerNote } = useTripData()
  const readonly = useReadonly()
  const executer = useAction()

  const [onglet, setOnglet] = useState<Onglet>('notes')
  const [editorOuvert, setEditorOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState<Note | null>(null)
  const [aSupprimer, setASupprimer] = useState<Note | null>(null)

  const triees = useMemo(
    () =>
      [...notes].sort((a, b) => {
        if (a.date && b.date) return a.date.localeCompare(b.date)
        if (a.date) return -1
        if (b.date) return 1
        return a.created_at.localeCompare(b.created_at)
      }),
    [notes],
  )

  const nomPoi = (id: string | null): string | null => {
    if (!id) return null
    return pois.find((p) => p.id === id)?.nom ?? null
  }

  if (chargement) return <LoadingScreen />

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-[4.75rem] sm:px-4 md:pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Notes & logistique</h1>
            <p className="text-xs text-cream-dim">Carnet de bord, checklist et infos pratiques du voyage</p>
          </div>
          {onglet === 'notes' && !readonly && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEnEdition(null)
                setEditorOuvert(true)
              }}
            >
              <Plus className="h-4 w-4" /> Note
            </button>
          )}
        </div>

        {erreur && (
          <div className="mb-4">
            <ErrorBanner message={erreur} onRetry={() => void recharger()} />
          </div>
        )}

        <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-white/[0.06] p-1 md:w-fit">
          {ONGLETS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOnglet(id)}
              className={`chip shrink-0 ${onglet === id ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {onglet === 'checklist' && <Checklist />}
        {onglet === 'infos' && <InfosPratiques />}

        {onglet === 'notes' &&
          (triees.length === 0 ? (
            <EmptyState titre="Aucune note" detail="Crée ta première note de voyage : plan B météo, idée resto, souvenir…" />
          ) : (
            <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4">
              {triees.map((note) => {
                const jour = jourLabel(note.date)
                const poi = nomPoi(note.poi_id)
                return (
                  <article key={note.id} className="glass break-inside-avoid p-5">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg font-semibold leading-snug">{note.titre}</h2>
                      {!readonly && (
                        <span className="flex shrink-0 gap-0.5">
                          <button
                            type="button"
                            className="p-1.5 text-cream-dim/60 hover:text-glacier"
                            onClick={() => {
                              setEnEdition(note)
                              setEditorOuvert(true)
                            }}
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 text-cream-dim/60 hover:text-red-300"
                            onClick={() => setASupprimer(note)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                    {(jour ?? poi) && (
                      <div className="mb-2.5 flex flex-wrap gap-1.5">
                        {jour && <span className="chip bg-glacier/15 text-glacier">{jour} · {fmtDateCourte(note.date)}</span>}
                        {poi && <span className="chip bg-white/[0.07] text-cream-dim">📍 {poi}</span>}
                      </div>
                    )}
                    <Markdown text={note.contenu} />
                    <p className="mt-3 text-[10px] uppercase tracking-wider text-cream-dim/50">
                      Modifiée le {new Date(note.updated_at).toLocaleDateString('fr-FR')}
                    </p>
                  </article>
                )
              })}
            </div>
          ))}
      </div>

      <NoteEditor ouvert={editorOuvert} note={enEdition} onFermer={() => setEditorOuvert(false)} />

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        titre="Supprimer cette note ?"
        message={`« ${aSupprimer?.titre ?? ''} » sera définitivement supprimée.`}
        onConfirmer={() => {
          const n = aSupprimer
          setASupprimer(null)
          if (n) void executer(() => supprimerNote(n.id), 'Note supprimée')
        }}
        onAnnuler={() => setASupprimer(null)}
      />
    </PageTransition>
  )
}
