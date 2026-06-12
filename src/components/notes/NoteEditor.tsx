import { useEffect, useState, type ReactNode } from 'react'
import { TRIP_DAYS } from '../../config/constants'
import { fmtDateCourte } from '../../lib/format'
import { Markdown } from '../../lib/markdown'
import { useTripData } from '../../state/TripDataContext'
import type { Note, NoteInput } from '../../types/db'
import { Modal, useAction, useToast } from '../ui'

interface NoteEditorProps {
  ouvert: boolean
  note: Note | null // null → création
  onFermer: () => void
}

interface FormNote {
  titre: string
  contenu: string
  date: string
  poiId: string
}

const FORM_VIDE: FormNote = { titre: '', contenu: '', date: '', poiId: '' }

export default function NoteEditor({ ouvert, note, onFermer }: NoteEditorProps): ReactNode {
  const { pois, creerNote, modifierNote } = useTripData()
  const executer = useAction()
  const toast = useToast()
  const [form, setForm] = useState<FormNote>(FORM_VIDE)
  const [apercu, setApercu] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    setApercu(false)
    setForm(
      note
        ? { titre: note.titre, contenu: note.contenu, date: note.date ?? '', poiId: note.poi_id ?? '' }
        : FORM_VIDE,
    )
  }, [ouvert, note])

  const enregistrer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.titre.trim()) {
      toast('Un titre est requis', 'erreur')
      return
    }
    const input: NoteInput = {
      titre: form.titre.trim(),
      contenu: form.contenu,
      date: form.date || null,
      poi_id: form.poiId || null,
    }
    await executer(async () => {
      if (note) await modifierNote(note.id, input)
      else await creerNote(input)
      onFermer()
    }, note ? 'Note mise à jour' : 'Note créée')
  }

  return (
    <Modal ouvert={ouvert} onFermer={onFermer} titre={note ? 'Modifier la note' : 'Nouvelle note'}>
      <form onSubmit={(e) => void enregistrer(e)} className="space-y-4">
        <div>
          <label className="label" htmlFor="note-titre">Titre</label>
          <input id="note-titre" className="input" value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} required placeholder="Ex : Plan B si pluie à Besseggen" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="note-date">Jour</label>
            <select id="note-date" className="input" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}>
              <option value="">—</option>
              {TRIP_DAYS.map((d, i) => (
                <option key={d} value={d}>
                  J{i + 1} — {fmtDateCourte(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="note-poi">POI lié</label>
            <select id="note-poi" className="input" value={form.poiId} onChange={(e) => setForm((f) => ({ ...f, poiId: e.target.value }))}>
              <option value="">—</option>
              {pois.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label mb-0" htmlFor="note-contenu">Contenu (Markdown)</label>
            <div className="flex gap-1 rounded-lg bg-white/[0.05] p-0.5">
              <button type="button" onClick={() => setApercu(false)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${apercu ? 'text-cream-dim' : 'bg-glacier/20 text-glacier'}`}>
                Écrire
              </button>
              <button type="button" onClick={() => setApercu(true)} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${apercu ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}>
                Aperçu
              </button>
            </div>
          </div>
          {apercu ? (
            <div className="glass-soft min-h-36 px-3.5 py-3">
              {form.contenu.trim() ? <Markdown text={form.contenu} /> : <p className="text-sm text-cream-dim/60">Rien à prévisualiser…</p>}
            </div>
          ) : (
            <textarea
              id="note-contenu"
              className="input min-h-36 font-mono text-[13px]"
              rows={8}
              value={form.contenu}
              onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
              placeholder={'**Gras**, *italique*, [lien](https://…)\n- liste\n# Titre'}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onFermer}>
            Annuler
          </button>
          <button type="submit" className="btn-primary">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}
