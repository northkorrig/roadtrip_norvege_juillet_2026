import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { Depense } from '../../types/db'

/** Lundi (ISO) de la semaine contenant `iso`, au format yyyy-mm-dd. */
function lundiDe(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  const decalage = (d.getDay() + 6) % 7 // 0 = lundi
  d.setDate(d.getDate() - decalage)
  return d.toISOString().split('T')[0]
}

function fmtSemaine(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface Semaine {
  cle: string
  label: string
  total: number
  cumulAvant: number
  cumulApres: number
}

/**
 * Évolution du budget dans le temps : barres flottantes par semaine, dont le
 * bord supérieur trace la dépense cumulée. Une ligne pointillée matérialise le
 * budget total. Complète le donut (répartition) par la progression.
 */
export default function BudgetTimeline({
  depenses,
  budget,
  fmt,
}: {
  depenses: Depense[]
  budget: number
  fmt: (eur: number) => string
}): ReactNode {
  const datees = depenses.filter((d) => d.date)
  const totalNonDate = depenses.filter((d) => !d.date).reduce((s, d) => s + d.montant, 0)

  const parSemaine = new Map<string, number>()
  for (const d of datees) {
    const cle = lundiDe(d.date as string)
    parSemaine.set(cle, (parSemaine.get(cle) ?? 0) + d.montant)
  }

  let cumul = 0
  const semaines: Semaine[] = [...parSemaine.keys()]
    .sort()
    .map((cle) => {
      const total = parSemaine.get(cle) as number
      const cumulAvant = cumul
      cumul += total
      return { cle, total, cumulAvant, cumulApres: cumul, label: fmtSemaine(cle) }
    })

  if (semaines.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-cream-dim">
        Renseigne une date sur tes dépenses pour visualiser leur évolution dans le temps.
      </p>
    )
  }

  const echelle = Math.max(cumul, budget) * 1.08 || 1
  const pct = (v: number): number => (v / echelle) * 100
  const budgetDepasse = cumul > budget

  return (
    <div>
      <div className="relative h-52 w-full">
        {/* Ligne du budget total */}
        {budget > 0 && pct(budget) <= 100 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-cream/40"
            style={{ bottom: `${pct(budget)}%` }}
          >
            <span className="absolute right-0 -top-4 rounded bg-night-deep/60 px-1 text-[10px] text-cream-dim">
              Budget {fmt(budget)}
            </span>
          </div>
        )}

        {/* Barres hebdomadaires (flottantes → trace le cumulé) */}
        <div className="absolute inset-0 flex items-end gap-1.5">
          {semaines.map((s, i) => {
            const depasseIci = s.cumulApres > budget && budget > 0
            return (
              <div key={s.cle} className="relative flex h-full flex-1 flex-col justify-end">
                <motion.div
                  className={`relative mx-auto w-full max-w-[2.75rem] rounded-md ${
                    depasseIci ? 'bg-red-400/70' : 'bg-glacier/70'
                  }`}
                  style={{ marginBottom: `${pct(s.cumulAvant)}%` }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${pct(s.total)}%`, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: 'easeOut' }}
                  title={`Semaine du ${s.label} : ${fmt(s.total)} — cumulé ${fmt(s.cumulApres)}`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Axe des semaines */}
      <div className="mt-2 flex gap-1.5">
        {semaines.map((s) => (
          <div key={s.cle} className="min-w-0 flex-1 text-center">
            <p className="truncate text-[10px] uppercase tracking-wide text-cream-dim">{s.label}</p>
            <p className="truncate text-[11px] font-semibold tabular-nums text-cream">{fmt(s.cumulApres)}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-cream-dim">
        Barres = dépense de la semaine ; leur sommet suit le total cumulé.
        {budgetDepasse && <span className="text-red-300"> Budget dépassé.</span>}
        {totalNonDate > 0 && ` ${fmt(totalNonDate)} sans date non inclus.`}
      </p>
    </div>
  )
}
