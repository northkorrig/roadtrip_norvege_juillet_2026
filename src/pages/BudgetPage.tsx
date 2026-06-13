import { CalendarCheck, MapPin, Pencil, Plus, TrendingUp, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import BudgetTimeline from '../components/budget/BudgetTimeline'
import DepenseForm, { PERSONNES } from '../components/budget/DepenseForm'
import DonutChart from '../components/budget/DonutChart'
import Reservations from '../components/budget/Reservations'
import {
  ConfirmDialog,
  EmptyState,
  ErrorBanner,
  LoadingScreen,
  PageTransition,
  useAction,
} from '../components/ui'
import {
  DEPENSE_CATEGORIES,
  DEPENSE_CATEGORIE_LIST,
  LS_KEYS,
  NOK_PAR_EUR_DEFAUT,
  TRIP_META,
} from '../config/constants'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { fmtDateCourte, fmtMontant } from '../lib/format'
import { useReadonly, useTripData } from '../state/TripDataContext'
import type { Depense, DepenseCategorie } from '../types/db'

export default function BudgetPage(): ReactNode {
  const { depenses, etapes, chargement, erreur, recharger, supprimerDepense } = useTripData()
  const readonly = useReadonly()
  const executer = useAction()

  // Budget total : persisté en localStorage (clé `total_budget`), pas de table settings
  const [budget, setBudget] = useLocalStorage<number>(LS_KEYS.budget, TRIP_META.budgetDefautEur)
  const [nokParEur, setNokParEur] = useLocalStorage<number>(LS_KEYS.nokRate, NOK_PAR_EUR_DEFAUT)
  const [devise, setDevise] = useState<'EUR' | 'NOK'>('EUR')
  const [editionBudget, setEditionBudget] = useState(false)
  const [budgetSaisi, setBudgetSaisi] = useState('')

  const [filtrePersonne, setFiltrePersonne] = useState<string>('Tous')
  const [filtreCategorie, setFiltreCategorie] = useState<DepenseCategorie | 'toutes'>('toutes')
  const [formOuvert, setFormOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState<Depense | null>(null)
  const [aSupprimer, setASupprimer] = useState<Depense | null>(null)

  const fmt = (eur: number): string => fmtMontant(eur, devise, nokParEur)

  const totalDepense = useMemo(() => depenses.reduce((s, d) => s + d.montant, 0), [depenses])
  const restant = budget - totalDepense

  const segments = useMemo(
    () =>
      DEPENSE_CATEGORIE_LIST.map((c) => ({
        label: DEPENSE_CATEGORIES[c].label,
        couleur: DEPENSE_CATEGORIES[c].couleur,
        valeur: depenses.filter((d) => d.categorie === c).reduce((s, d) => s + d.montant, 0),
      })),
    [depenses],
  )

  // Coût par étape : somme des dépenses rattachées à chaque étape (coût par jour)
  const coutParEtape = useMemo(() => {
    const total = new Map<string, number>()
    for (const d of depenses) {
      if (d.etape_id) total.set(d.etape_id, (total.get(d.etape_id) ?? 0) + d.montant)
    }
    return etapes
      .map((e, i) => ({ etape: e, index: i, total: total.get(e.id) ?? 0 }))
      .filter((x) => x.total > 0)
  }, [depenses, etapes])

  const labelEtape = useMemo(() => {
    const m = new Map<string, string>()
    etapes.forEach((e, i) => m.set(e.id, `J${i + 1} · ${e.nom}`))
    return m
  }, [etapes])

  const totalNonRattache = useMemo(
    () => depenses.filter((d) => !d.etape_id).reduce((s, d) => s + d.montant, 0),
    [depenses],
  )

  const filtrees = useMemo(() => {
    return [...depenses]
      .filter((d) => filtrePersonne === 'Tous' || (d.personne ?? 'Commun') === filtrePersonne)
      .filter((d) => filtreCategorie === 'toutes' || d.categorie === filtreCategorie)
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.created_at.localeCompare(a.created_at))
  }, [depenses, filtrePersonne, filtreCategorie])

  const validerBudget = (): void => {
    const n = Number(budgetSaisi.replace(',', '.'))
    if (Number.isFinite(n) && n > 0) setBudget(Math.round(n))
    setEditionBudget(false)
  }

  if (chargement) return <LoadingScreen />

  const statCards: { label: string; valeur: string; accent?: 'ok' | 'alerte' }[] = [
    { label: 'Budget total', valeur: fmt(budget) },
    { label: 'Dépensé / engagé', valeur: fmt(totalDepense) },
    { label: 'Restant', valeur: fmt(restant), accent: restant >= 0 ? 'ok' : 'alerte' },
    { label: 'Par personne', valeur: fmt(totalDepense / TRIP_META.voyageurs.length) },
  ]

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-[4.75rem] sm:px-4 md:pb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Budget</h1>
            <p className="text-xs text-cream-dim">
              Estimation initiale : {fmt(TRIP_META.estimationInitialeEur)} (~
              {fmt(TRIP_META.estimationInitialeEur / 2)} / pers)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-xl bg-white/[0.06] p-1">
              {(['EUR', 'NOK'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevise(d)}
                  className={`chip ${devise === d ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
                >
                  {d === 'EUR' ? '€ EUR' : 'kr NOK'}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-xs text-cream-dim">
              1 € =
              <input
                key={nokParEur}
                className="input w-20 px-2 py-1.5 text-center"
                inputMode="decimal"
                defaultValue={String(nokParEur)}
                onBlur={(e) => {
                  const n = Number(e.target.value.replace(',', '.'))
                  if (Number.isFinite(n) && n > 0) setNokParEur(n)
                  else e.target.value = String(nokParEur)
                }}
                aria-label="Taux de conversion NOK pour 1 euro"
              />
              kr
            </label>
            {!readonly && (
              <button type="button" className="btn-primary" onClick={() => { setEnEdition(null); setFormOuvert(true) }}>
                <Plus className="h-4 w-4" /> Dépense
              </button>
            )}
          </div>
        </div>

        {erreur && (
          <div className="mb-4">
            <ErrorBanner message={erreur} onRetry={() => void recharger()} />
          </div>
        )}

        {/* Cartes de synthèse */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="glass relative px-4 py-3.5">
              <p className="text-[11px] uppercase tracking-wider text-cream-dim">{s.label}</p>
              {s.label === 'Budget total' && editionBudget ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    validerBudget()
                  }}
                  className="mt-1 flex items-center gap-1.5"
                >
                  <input
                    autoFocus
                    className="input w-28 px-2 py-1 text-lg font-bold"
                    inputMode="numeric"
                    value={budgetSaisi}
                    onChange={(e) => setBudgetSaisi(e.target.value)}
                    onBlur={validerBudget}
                  />
                  <span className="text-sm text-cream-dim">€</span>
                </form>
              ) : (
                <p
                  className={`font-display text-xl font-bold sm:text-2xl ${
                    s.accent === 'ok' ? 'text-glacier' : s.accent === 'alerte' ? 'text-red-400' : 'text-cream'
                  }`}
                >
                  {s.valeur}
                </p>
              )}
              {s.label === 'Budget total' && !editionBudget && !readonly && (
                <button
                  type="button"
                  className="absolute right-2.5 top-2.5 p-1 text-cream-dim/50 hover:text-glacier"
                  onClick={() => {
                    setBudgetSaisi(String(budget))
                    setEditionBudget(true)
                  }}
                  title="Modifier le budget total"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Donut par catégorie */}
          <section className="glass flex flex-col items-center gap-4 p-5">
            <h2 className="self-start font-display text-lg font-semibold">Répartition par catégorie</h2>
            <DonutChart
              segments={segments}
              centre={
                <>
                  <p className="font-display text-2xl font-bold">{fmt(totalDepense)}</p>
                  <p className="text-[11px] uppercase tracking-wider text-cream-dim">total engagé</p>
                </>
              }
            />
            <ul className="w-full space-y-1.5">
              {segments
                .filter((s) => s.valeur > 0)
                .sort((a, b) => b.valeur - a.valeur)
                .map((s) => (
                  <li key={s.label} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.couleur }} />
                    <span className="flex-1 text-cream-dim">{s.label}</span>
                    <span className="tabular-nums text-cream">{fmt(s.valeur)}</span>
                    <span className="w-12 text-right text-xs tabular-nums text-cream-dim/60">
                      {totalDepense > 0 ? Math.round((s.valeur / totalDepense) * 100) : 0}%
                    </span>
                  </li>
                ))}
            </ul>
          </section>

          {/* Liste des dépenses */}
          <section className="glass p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">Dépenses</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  className="input w-auto px-2.5 py-1.5 text-xs"
                  value={filtrePersonne}
                  onChange={(e) => setFiltrePersonne(e.target.value)}
                  aria-label="Filtrer par personne"
                >
                  <option value="Tous">Tous</option>
                  {PERSONNES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  className="input w-auto px-2.5 py-1.5 text-xs"
                  value={filtreCategorie}
                  onChange={(e) => setFiltreCategorie(e.target.value as DepenseCategorie | 'toutes')}
                  aria-label="Filtrer par catégorie"
                >
                  <option value="toutes">Toutes catégories</option>
                  {DEPENSE_CATEGORIE_LIST.map((c) => (
                    <option key={c} value={c}>
                      {DEPENSE_CATEGORIES[c].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtrees.length === 0 ? (
              <EmptyState titre="Aucune dépense" detail="Ajoute ta première dépense avec le bouton ci-dessus." />
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {filtrees.map((d) => {
                  const meta = DEPENSE_CATEGORIES[d.categorie]
                  return (
                    <li key={d.id} className="group flex items-center gap-3 py-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${meta.couleur}22`, color: meta.couleur }}
                        title={meta.label}
                      >
                        <meta.Icon style={{ width: 15, height: 15 }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-cream">{d.label}</p>
                        <p className="text-[11px] text-cream-dim">
                          {fmtDateCourte(d.date)} · {d.personne ?? 'Commun'}
                          {d.etape_id && labelEtape.has(d.etape_id) ? ` · ${labelEtape.get(d.etape_id)}` : ''}
                          {d.note ? ` · ${d.note}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-base font-semibold tabular-nums">
                        {fmt(d.montant)}
                      </span>
                      {!readonly && (
                        <span className="flex shrink-0 gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                          <button
                            type="button"
                            className="p-1.5 text-cream-dim hover:text-glacier"
                            onClick={() => {
                              setEnEdition(d)
                              setFormOuvert(true)
                            }}
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 text-cream-dim hover:text-red-300"
                            onClick={() => setASupprimer(d)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Évolution dans le temps + coût par étape */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="glass p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-glacier" /> Évolution dans le temps
            </h2>
            <BudgetTimeline depenses={depenses} budget={budget} fmt={fmt} />
          </section>

          <section className="glass p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <MapPin className="h-5 w-5 text-glacier" /> Coût par étape
            </h2>
            {coutParEtape.length === 0 ? (
              <EmptyState
                titre="Aucune dépense rattachée"
                detail="Associe une dépense à une étape (champ « Étape liée ») pour suivre le coût par jour."
              />
            ) : (
              <ul className="space-y-1.5">
                {coutParEtape.map(({ etape, index, total }) => (
                  <li key={etape.id} className="flex items-center gap-2.5 text-sm">
                    <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded bg-ember/15 text-[11px] font-bold text-ember-soft">
                      J{index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-cream-dim">{etape.nom}</span>
                    <span className="shrink-0 tabular-nums text-cream">{fmt(total)}</span>
                  </li>
                ))}
                {totalNonRattache > 0 && (
                  <li className="flex items-center gap-2.5 border-t border-white/[0.06] pt-2 text-sm">
                    <span className="flex h-6 w-7 shrink-0 items-center justify-center rounded bg-white/[0.06] text-[11px] text-cream-dim">
                      —
                    </span>
                    <span className="min-w-0 flex-1 truncate text-cream-dim">Non rattaché à une étape</span>
                    <span className="shrink-0 tabular-nums text-cream-dim">{fmt(totalNonRattache)}</span>
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>

        {/* Réservations à faire */}
        <section className="glass mt-5 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarCheck className="h-5 w-5 text-glacier" /> Réservations à faire
          </h2>
          <Reservations />
        </section>
      </div>

      <DepenseForm ouvert={formOuvert} depense={enEdition} onFermer={() => setFormOuvert(false)} />

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        titre="Supprimer cette dépense ?"
        message={`« ${aSupprimer?.label ?? ''} » (${aSupprimer ? fmt(aSupprimer.montant) : ''}) sera supprimée.`}
        onConfirmer={() => {
          const d = aSupprimer
          setASupprimer(null)
          if (d) void executer(() => supprimerDepense(d.id), 'Dépense supprimée')
        }}
        onAnnuler={() => setASupprimer(null)}
      />
    </PageTransition>
  )
}
