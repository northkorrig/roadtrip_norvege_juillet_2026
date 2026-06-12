import { ClipboardPaste } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { POI_CATEGORIES, POI_CATEGORIE_LIST, TRIP_DAYS } from '../../config/constants'
import { fmtDateCourte } from '../../lib/format'
import { parseGoogleMapsUrl } from '../../lib/importExport'
import { useTripData } from '../../state/TripDataContext'
import type { LatLng, Poi, PoiCategorie, PoiInput } from '../../types/db'
import { Modal, useAction, useToast } from '../ui'
import PlacesSearch from './PlacesSearch'

interface PoiFormProps {
  ouvert: boolean
  poi: Poi | null // null → création
  prefill?: LatLng | null // clic sur la carte
  onFermer: () => void
}

interface FormPoi {
  nom: string
  categorie: PoiCategorie
  lat: string
  lng: string
  jour: string
  etapeId: string
  note: string
  url: string
}

const FORM_VIDE: FormPoi = { nom: '', categorie: 'activite', lat: '', lng: '', jour: '', etapeId: '', note: '', url: '' }

export default function PoiForm({ ouvert, poi, prefill, onFermer }: PoiFormProps): ReactNode {
  const { etapes, pois, creerPoi, modifierPoi } = useTripData()
  const executer = useAction()
  const toast = useToast()
  const [form, setForm] = useState<FormPoi>(FORM_VIDE)

  useEffect(() => {
    if (!ouvert) return
    if (poi) {
      setForm({
        nom: poi.nom,
        categorie: poi.categorie,
        lat: String(poi.lat),
        lng: String(poi.lng),
        jour: poi.jour ?? '',
        etapeId: poi.etape_id ?? '',
        note: poi.note ?? '',
        url: '',
      })
    } else {
      setForm({
        ...FORM_VIDE,
        lat: prefill ? prefill.lat.toFixed(5) : '',
        lng: prefill ? prefill.lng.toFixed(5) : '',
      })
    }
  }, [ouvert, poi, prefill])

  const champ = (k: keyof FormPoi) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const extraireUrl = (): void => {
    const coords = parseGoogleMapsUrl(form.url)
    if (!coords) {
      toast('Aucune coordonnée trouvée dans ce lien Google Maps', 'erreur')
      return
    }
    setForm((f) => ({ ...f, lat: coords.lat.toFixed(5), lng: coords.lng.toFixed(5), url: '' }))
    toast('Coordonnées extraites du lien')
  }

  const enregistrer = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const lat = Number(form.lat.replace(',', '.'))
    const lng = Number(form.lng.replace(',', '.'))
    if (!form.nom.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast('Nom et coordonnées valides requis', 'erreur')
      return
    }
    const input: PoiInput = {
      nom: form.nom.trim(),
      categorie: form.categorie,
      lat,
      lng,
      note: form.note.trim() || null,
      ordre: poi?.ordre ?? pois.length,
      jour: form.jour || null,
      etape_id: form.etapeId || null,
    }
    await executer(async () => {
      if (poi) await modifierPoi(poi.id, input)
      else await creerPoi(input)
      onFermer()
    }, poi ? 'POI mis à jour' : 'POI ajouté')
  }

  return (
    <Modal ouvert={ouvert} onFermer={onFermer} titre={poi ? 'Modifier le POI' : 'Nouveau POI'}>
      <form onSubmit={(e) => void enregistrer(e)} className="space-y-4">
        <PlacesSearch
          onPick={({ nom, lat, lng }) =>
            setForm((f) => ({ ...f, nom: f.nom || nom, lat: lat.toFixed(5), lng: lng.toFixed(5) }))
          }
        />

        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="…ou colle un lien Google Maps"
            value={form.url}
            onChange={champ('url')}
          />
          <button type="button" className="btn-ghost shrink-0 px-3" onClick={extraireUrl} disabled={!form.url.trim()} title="Extraire les coordonnées du lien">
            <ClipboardPaste className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="label" htmlFor="poi-nom">Nom</label>
          <input id="poi-nom" className="input" value={form.nom} onChange={champ('nom')} required placeholder="Ex : Vøringsfossen" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="poi-cat">Catégorie</label>
            <select id="poi-cat" className="input" value={form.categorie} onChange={champ('categorie')}>
              {POI_CATEGORIE_LIST.map((c) => (
                <option key={c} value={c}>
                  {POI_CATEGORIES[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="poi-jour">Jour</label>
            <select id="poi-jour" className="input" value={form.jour} onChange={champ('jour')}>
              <option value="">—</option>
              {TRIP_DAYS.map((d, i) => (
                <option key={d} value={d}>
                  J{i + 1} — {fmtDateCourte(d)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="poi-lat">Latitude</label>
            <input id="poi-lat" className="input" inputMode="decimal" value={form.lat} onChange={champ('lat')} required placeholder="60.4108" />
          </div>
          <div>
            <label className="label" htmlFor="poi-lng">Longitude</label>
            <input id="poi-lng" className="input" inputMode="decimal" value={form.lng} onChange={champ('lng')} required placeholder="7.2100" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="poi-etape">Étape liée</label>
          <select id="poi-etape" className="input" value={form.etapeId} onChange={champ('etapeId')}>
            <option value="">Sans étape</option>
            {etapes.map((e, i) => (
              <option key={e.id} value={e.id}>
                J{i + 1} — {e.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="poi-note">
            Notes <span className="normal-case text-cream-dim/60">(Markdown — lien externe : [texte](https://…))</span>
          </label>
          <textarea id="poi-note" className="input" rows={3} value={form.note} onChange={champ('note')} placeholder="Infos pratiques, lien de réservation…" />
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
