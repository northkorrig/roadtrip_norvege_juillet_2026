import { useEffect, useState, type ReactNode } from 'react'
import { DEPENSE_CATEGORIES, DEPENSE_CATEGORIE_LIST, TRIP_META } from '../../config/constants'
import { useTripData } from '../../state/TripDataContext'
import type { Depense, DepenseCategorie, DepenseInput } from '../../types/db'
import { Modal, useAction, useToast } from '../ui'

interface DepenseFormProps {
  ouvert: boolean
  depense: Depense | null // null → création
  onFermer: () => void
}

interface FormDepense {
  label: string
  montant: string
  categorie: DepenseCategorie
  date: string
  personne: string
  note: string
  etapeId: string
}

const FORM_VIDE: FormDepense = { label: '', montant: '', categorie: 'divers', date: '', personne: 'Commun', note: '', etapeId: '' }

export const PERSONNES = [...TRIP_META.voyageurs, 'Commun']

export default function DepenseForm({ ouvert, depense, onFermer }: DepenseFormProps): ReactNode {
  const { creerDepense, modifierDepense, etapes } = useTripData()
  const executer = useAction()
  const toast = useToast()
  const [form, setForm] = useState<FormDepense>(FORM_VIDE)

  useEffect(() => {
    if (!ouvert) return
    setForm(
      depense
        ? {
            label: depense.label,
            montant: String(depense.montant),
            categorie: depense.categorie,
            date: depense.date ?? '',
            personne: depense.personne ?? 'Commun',
            note: depense.note ?? '',
            etapeId: depense.etape_id ?? '',
          }
        : FORM_VIDE,
    )
  }, [ouvert, depense])

  const champ = (k: keyof FormDepense) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const enregistrer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const montant = Number(form.montant.replace(',', '.'))
    if (!form.label.trim() || !Number.isFinite(montant) || montant < 0) {
      toast('Label et montant valides requis', 'erreur')
      return
    }
    const input: DepenseInput = {
      label: form.label.trim(),
      montant,
      categorie: form.categorie,
      date: form.date || null,
      personne: form.personne || null,
      note: form.note.trim() || null,
      etape_id: form.etapeId || null,
    }
    await executer(async () => {
      if (depense) await modifierDepense(depense.id, input)
      else await creerDepense(input)
      onFermer()
    }, depense ? 'Dépense mise à jour' : 'Dépense ajoutée')
  }

  return (
    <Modal ouvert={ouvert} onFermer={onFermer} titre={depense ? 'Modifier la dépense' : 'Nouvelle dépense'}>
      <form onSubmit={(e) => void enregistrer(e)} className="space-y-4">
        <div>
          <label className="label" htmlFor="dep-label">Label</label>
          <input id="dep-label" className="input" value={form.label} onChange={champ('label')} required placeholder="Ex : Plein de gasoil à Voss" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="dep-montant">Montant (€)</label>
            <input id="dep-montant" className="input" inputMode="decimal" value={form.montant} onChange={champ('montant')} required placeholder="85" />
          </div>
          <div>
            <label className="label" htmlFor="dep-cat">Catégorie</label>
            <select id="dep-cat" className="input" value={form.categorie} onChange={champ('categorie')}>
              {DEPENSE_CATEGORIE_LIST.map((c) => (
                <option key={c} value={c}>
                  {DEPENSE_CATEGORIES[c].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="dep-date">Date</label>
            <input id="dep-date" type="date" className="input" value={form.date} onChange={champ('date')} />
          </div>
          <div>
            <label className="label" htmlFor="dep-personne">Payé par</label>
            <select id="dep-personne" className="input" value={form.personne} onChange={champ('personne')}>
              {PERSONNES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="dep-etape">Étape liée</label>
          <select
            id="dep-etape"
            className="input"
            value={form.etapeId}
            onChange={(e) => {
              const etape = etapes.find((et) => et.id === e.target.value)
              setForm((f) => ({
                ...f,
                etapeId: e.target.value,
                // pré-remplit la date depuis l'étape si non encore renseignée
                date: f.date || etape?.date || '',
              }))
            }}
          >
            <option value="">Aucune (coût général)</option>
            {etapes.map((et, i) => (
              <option key={et.id} value={et.id}>
                J{i + 1} · {et.nom}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-cream-dim">Rattacher la dépense à un jour pour le coût par étape.</p>
        </div>

        <div>
          <label className="label" htmlFor="dep-note">Note</label>
          <input id="dep-note" className="input" value={form.note} onChange={champ('note')} placeholder="Optionnel" />
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
