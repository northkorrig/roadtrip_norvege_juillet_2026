import { Check, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TACHE_CATEGORIES } from '../../config/constants'
import { useReadonly, useTripData } from '../../state/TripDataContext'
import type { Tache, TacheCategorie } from '../../types/db'
import { useAction } from '../ui'

function LigneTache({ tache }: { tache: Tache }): ReactNode {
  const { modifierTache, supprimerTache } = useTripData()
  const readonly = useReadonly()
  const executer = useAction()

  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.04]">
      <button
        type="button"
        disabled={readonly}
        onClick={() => void executer(() => modifierTache(tache.id, { completee: !tache.completee }))}
        aria-label={tache.completee ? 'Marquer comme à faire' : 'Marquer comme fait'}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
          tache.completee
            ? 'border-glacier bg-glacier text-night-deep'
            : 'border-white/25 bg-transparent hover:border-glacier/60'
        }`}
      >
        {tache.completee && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-sm ${tache.completee ? 'text-cream-dim/50 line-through' : 'text-cream'}`}>
        {tache.texte}
      </span>
      {!readonly && (
        <button
          type="button"
          className="p-1 text-cream-dim/50 transition-colors hover:text-red-300 sm:text-cream-dim/0 sm:group-hover:text-cream-dim/60"
          onClick={() => void executer(() => supprimerTache(tache.id))}
          aria-label="Supprimer la tâche"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  )
}

function GroupeTaches({ categorie }: { categorie: TacheCategorie }): ReactNode {
  const { taches, creerTache } = useTripData()
  const readonly = useReadonly()
  const executer = useAction()
  const [nouvelle, setNouvelle] = useState('')

  const liste = taches.filter((t) => t.categorie === categorie)
  const faites = liste.filter((t) => t.completee).length
  const meta = TACHE_CATEGORIES[categorie]
  const progression = liste.length === 0 ? 0 : Math.round((faites / liste.length) * 100)

  const ajouter = (e: React.FormEvent): void => {
    e.preventDefault()
    const texte = nouvelle.trim()
    if (!texte) return
    setNouvelle('')
    void executer(() =>
      creerTache({ texte, categorie, completee: false, ordre: taches.length }),
    )
  }

  return (
    <section className="glass p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
          <meta.Icon className="h-4.5 w-4.5 text-glacier" style={{ width: 18, height: 18 }} />
          {meta.label}
        </h3>
        <span className="text-xs tabular-nums text-cream-dim">
          {faites}/{liste.length}
        </span>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-glacier to-glacier-soft transition-all duration-500"
          style={{ width: `${progression}%` }}
        />
      </div>

      <ul className="space-y-0.5">
        {liste.map((t) => (
          <LigneTache key={t.id} tache={t} />
        ))}
      </ul>

      {!readonly && (
        <form onSubmit={ajouter} className="mt-3 flex gap-2">
          <input
            className="input flex-1 py-2"
            placeholder="Ajouter…"
            value={nouvelle}
            onChange={(e) => setNouvelle(e.target.value)}
          />
          <button type="submit" className="btn-ghost shrink-0 px-3" disabled={!nouvelle.trim()} aria-label="Ajouter la tâche">
            <Plus className="h-4 w-4" />
          </button>
        </form>
      )}
    </section>
  )
}

/** Checklist packing + avant-départ (table `taches`). */
export default function Checklist(): ReactNode {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <GroupeTaches categorie="packing" />
      <GroupeTaches categorie="avant_depart" />
    </div>
  )
}
