import { Trash2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NUIT_TYPES, TRIP_DAYS } from '../../config/constants'
import { fmtDateCourte } from '../../lib/format'
import { useTripData } from '../../state/TripDataContext'
import type { Etape, EtapeInput, NuitType } from '../../types/db'
import { ConfirmDialog, Drawer, useAction } from '../ui'

interface EtapeEditorProps {
  ouvert: boolean
  etape: Etape | null // null → création
  onFermer: () => void
}

interface FormEtape {
  nom: string
  date: string
  lat: string
  lng: string
  km: string
  duree: string
  nuit: NuitType | ''
  note: string
}

const FORM_VIDE: FormEtape = { nom: '', date: '', lat: '', lng: '', km: '', duree: '', nuit: '', note: '' }

function versForm(etape: Etape | null): FormEtape {
  if (!etape) return FORM_VIDE
  return {
    nom: etape.nom,
    date: etape.date ?? '',
    lat: etape.lat?.toString() ?? '',
    lng: etape.lng?.toString() ?? '',
    km: etape.km_depuis_precedent?.toString() ?? '',
    duree: etape.duree_min?.toString() ?? '',
    nuit: etape.nuit_type ?? '',
    note: etape.note ?? '',
  }
}

function nombreOuNull(s: string): number | null {
  if (s.trim() === '') return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export default function EtapeEditor({ ouvert, etape, onFermer }: EtapeEditorProps): ReactNode {
  const { etapes, creerEtape, modifierEtape, supprimerEtape } = useTripData()
  const executer = useAction()
  const [form, setForm] = useState<FormEtape>(FORM_VIDE)
  const [confirmerSuppression, setConfirmerSuppression] = useState(false)

  useEffect(() => {
    if (ouvert) setForm(versForm(etape))
  }, [ouvert, etape])

  const champ = (k: keyof FormEtape) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const enregistrer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!form.nom.trim()) return
    const input: EtapeInput = {
      nom: form.nom.trim(),
      date: form.date || null,
      ordre: etape?.ordre ?? etapes.length,
      lat: nombreOuNull(form.lat),
      lng: nombreOuNull(form.lng),
      km_depuis_precedent: nombreOuNull(form.km),
      duree_min: nombreOuNull(form.duree),
      nuit_type: form.nuit === '' ? null : form.nuit,
      note: form.note.trim() || null,
    }
    await executer(async () => {
      if (etape) await modifierEtape(etape.id, input)
      else await creerEtape(input)
      onFermer()
    }, etape ? 'Étape mise à jour' : 'Étape ajoutée')
  }

  const supprimer = async (): Promise<void> => {
    if (!etape) return
    setConfirmerSuppression(false)
    await executer(async () => {
      await supprimerEtape(etape.id)
      onFermer()
    }, 'Étape supprimée')
  }

  return (
    <Drawer ouvert={ouvert} onFermer={onFermer} titre={etape ? 'Modifier l’étape' : 'Nouvelle étape'}>
      <form onSubmit={(e) => void enregistrer(e)} className="space-y-4">
        <div>
          <label className="label" htmlFor="etape-nom">Nom de l’étape</label>
          <input id="etape-nom" className="input" value={form.nom} onChange={champ('nom')} required placeholder="Ex : Gaustatoppen — montée au sommet" />
        </div>

        <div>
          <label className="label" htmlFor="etape-date">Jour</label>
          <select id="etape-date" className="input" value={form.date} onChange={champ('date')}>
            <option value="">Sans date</option>
            {TRIP_DAYS.map((d, i) => (
              <option key={d} value={d}>
                J{i + 1} — {fmtDateCourte(d)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="etape-lat">Latitude</label>
            <input id="etape-lat" className="input" inputMode="decimal" value={form.lat} onChange={champ('lat')} placeholder="60.4108" />
          </div>
          <div>
            <label className="label" htmlFor="etape-lng">Longitude</label>
            <input id="etape-lng" className="input" inputMode="decimal" value={form.lng} onChange={champ('lng')} placeholder="7.2100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="etape-km">Km depuis l’étape précédente</label>
            <input id="etape-km" className="input" inputMode="decimal" value={form.km} onChange={champ('km')} placeholder="190" />
          </div>
          <div>
            <label className="label" htmlFor="etape-duree">Route (minutes)</label>
            <input id="etape-duree" className="input" inputMode="numeric" value={form.duree} onChange={champ('duree')} placeholder="165" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="etape-nuit">Nuit</label>
          <select id="etape-nuit" className="input" value={form.nuit} onChange={champ('nuit')}>
            <option value="">—</option>
            {(Object.keys(NUIT_TYPES) as NuitType[]).map((t) => (
              <option key={t} value={t}>
                {NUIT_TYPES[t].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="etape-note">
            Programme / notes <span className="normal-case text-cream-dim/60">(Markdown, « RÉSERVER » crée un badge)</span>
          </label>
          <textarea id="etape-note" className="input min-h-32" rows={6} value={form.note} onChange={champ('note')} placeholder={'- Activité principale\n- Randonnée du jour\n- ⚠️ RÉSERVER…'} />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {etape ? (
            <button type="button" className="btn-danger" onClick={() => setConfirmerSuppression(true)}>
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onFermer}>
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              Enregistrer
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        ouvert={confirmerSuppression}
        titre="Supprimer cette étape ?"
        message={`« ${etape?.nom ?? ''} » sera supprimée. Les POIs liés seront conservés mais détachés de l'étape.`}
        onConfirmer={() => void supprimer()}
        onAnnuler={() => setConfirmerSuppression(false)}
      />
    </Drawer>
  )
}
