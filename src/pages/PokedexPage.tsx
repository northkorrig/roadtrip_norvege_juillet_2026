import { Check, ExternalLink, MapPin, PawPrint, RotateCcw, Search, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  ConfirmDialog,
  ErrorBanner,
  LoadingScreen,
  Modal,
  PageTransition,
  useAction,
} from '../components/ui'
import {
  ANIMAL_CATEGORIES,
  ANIMAL_CATEGORIE_LIST,
  ANIMAL_RARETES,
  ANIMAUX,
  POKEDEX_LIEUX,
  type Animal,
  type AnimalCategorie,
} from '../lib/pokedexData'
import { urlWikipedia, useFichesWiki } from '../lib/wikipedia'
import { useTripData } from '../state/TripDataContext'
import type { PokedexObservation, PokedexObservationInput } from '../types/db'

type FiltreVu = 'tous' | 'vus' | 'a_trouver'

// Les noms latins redirigent vers l'article français sur fr.wikipedia.org
const TITRES_WIKI = ANIMAUX.map((a) => a.nomLatin)

const aujourdhui = (): string => new Date().toISOString().split('T')[0]

const OBSERVATION_VIDE: PokedexObservationInput = { animal_id: '', vu: false, date: null, lieu: '', note: '' }

/** Normalise pour la recherche : minuscules + sans accents. */
const normaliser = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export default function PokedexPage(): ReactNode {
  const { pokedex, chargement, erreur, recharger, observerPokedex, supprimerObservationPokedex } =
    useTripData()
  const executer = useAction()
  const fiches = useFichesWiki(TITRES_WIKI)

  const [recherche, setRecherche] = useState('')
  const [categorie, setCategorie] = useState<AnimalCategorie | 'toutes'>('toutes')
  const [lieu, setLieu] = useState<string>('tous')
  const [filtreVu, setFiltreVu] = useState<FiltreVu>('tous')
  const [detail, setDetail] = useState<Animal | null>(null)
  // Brouillon des champs de la fiche détail : persisté au blur / à la fermeture
  // pour ne pas envoyer une requête à chaque frappe.
  const [draft, setDraft] = useState<PokedexObservationInput | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const parAnimal = useMemo(
    () => new Map<string, PokedexObservation>(pokedex.map((o) => [o.animal_id, o])),
    [pokedex],
  )
  const obs = (id: string): PokedexObservationInput =>
    parAnimal.get(id) ?? { ...OBSERVATION_VIDE, animal_id: id }

  const basculerVu = (animal: Animal): void => {
    const o = obs(animal.id)
    const patch: PokedexObservationInput = o.vu
      ? { ...o, vu: false }
      : { ...o, vu: true, date: o.date ?? aujourdhui() }
    if (detail?.id === animal.id) setDraft(patch)
    void executer(() => observerPokedex(patch))
  }

  const ouvrirDetail = (animal: Animal): void => {
    setDraft(obs(animal.id))
    setDetail(animal)
  }

  const sauverDraft = (d: PokedexObservationInput | null = draft): void => {
    if (!d) return
    const actuel = obs(d.animal_id)
    const inchange =
      actuel.vu === d.vu && actuel.date === d.date && actuel.lieu === d.lieu && actuel.note === d.note
    if (inchange) return
    void executer(() => observerPokedex(d))
  }

  const fermerDetail = (): void => {
    sauverDraft()
    setDetail(null)
    setDraft(null)
  }

  const nbVus = useMemo(() => ANIMAUX.filter((a) => obs(a.id).vu).length, [parAnimal])

  const filtres = useMemo(() => {
    const q = normaliser(recherche.trim())
    return ANIMAUX.filter((a) => {
      if (categorie !== 'toutes' && a.categorie !== categorie) return false
      if (lieu !== 'tous' && !a.partout && !a.lieux.includes(lieu)) return false
      const o = obs(a.id)
      if (filtreVu === 'vus' && !o.vu) return false
      if (filtreVu === 'a_trouver' && o.vu) return false
      if (q) {
        const corpus = normaliser([a.nom, a.nomLatin, a.conseils, ...a.lieux, o.note, o.lieu].join(' '))
        if (!corpus.includes(q)) return false
      }
      return true
    })
  }, [recherche, categorie, lieu, filtreVu, parAnimal])

  if (chargement) return <LoadingScreen />

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-[4.75rem] sm:px-4 md:pb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Pokédex norvégien</h1>
            <p className="text-xs text-cream-dim">
              La faune à débusquer le long de l’itinéraire — coche tes observations, attrape-les toutes !
            </p>
          </div>
          {nbVus > 0 && (
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => setConfirmReset(true)}
              title="Réinitialiser toutes les observations"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        {erreur && (
          <div className="mb-4">
            <ErrorBanner message={erreur} onRetry={() => void recharger()} />
          </div>
        )}

        {/* Progression */}
        <div className="glass mb-5 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <PawPrint className="h-4 w-4 text-glacier" />
              {nbVus} / {ANIMAUX.length} espèces observées
            </p>
            <p className="text-xs text-cream-dim">
              {nbVus === ANIMAUX.length
                ? '🏆 Pokédex complet !'
                : `Encore ${ANIMAUX.length - nbVus} à trouver`}
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-glacier to-ember transition-all duration-500"
              style={{ width: `${(nbVus / ANIMAUX.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Recherche + filtres */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim/60" />
            <input
              type="search"
              className="input pl-10"
              placeholder="Rechercher un animal, un lieu, un mot-clé…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-white/[0.06] p-1">
              <button
                type="button"
                onClick={() => setCategorie('toutes')}
                className={`chip shrink-0 ${categorie === 'toutes' ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
              >
                Toutes
              </button>
              {ANIMAL_CATEGORIE_LIST.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategorie(c)}
                  className={`chip shrink-0 ${categorie === c ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
                >
                  {ANIMAL_CATEGORIES[c].emoji} {ANIMAL_CATEGORIES[c].label}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-xl bg-white/[0.06] p-1">
              {(
                [
                  { id: 'tous', label: 'Tous' },
                  { id: 'vus', label: '✓ Vus' },
                  { id: 'a_trouver', label: 'À trouver' },
                ] as { id: FiltreVu; label: string }[]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFiltreVu(id)}
                  className={`chip shrink-0 ${filtreVu === id ? 'bg-glacier/20 text-glacier' : 'text-cream-dim'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              className="input w-auto min-w-[10rem] py-2 text-xs"
              value={lieu}
              onChange={(e) => setLieu(e.target.value)}
              aria-label="Filtrer par lieu"
            >
              <option value="tous">📍 Tous les lieux</option>
              {POKEDEX_LIEUX.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille d'espèces */}
        {filtres.length === 0 ? (
          <div className="glass-soft flex flex-col items-center gap-1.5 px-6 py-10 text-center">
            <p className="font-display text-lg">Aucune espèce ne correspond</p>
            <p className="text-sm text-cream-dim">Essaie d’élargir la recherche ou les filtres.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtres.map((animal) => {
              const o = obs(animal.id)
              const rarete = ANIMAL_RARETES[animal.rarete]
              const photo = fiches[animal.nomLatin]?.image
              return (
                <article
                  key={animal.id}
                  className={`glass relative cursor-pointer p-4 transition-all hover:bg-white/[0.09] ${
                    o.vu ? 'border-glacier/40' : ''
                  }`}
                  onClick={() => ouvrirDetail(animal)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl ${
                        o.vu ? 'bg-glacier/15' : 'bg-white/[0.06] grayscale'
                      }`}
                      aria-hidden
                    >
                      {animal.emoji}
                      {photo && (
                        <img
                          src={photo}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                          // image indisponible (hors-ligne, lien mort) → on retombe sur l'emoji
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-base font-semibold leading-snug">
                        {animal.nom}
                      </h2>
                      <p className="truncate text-[11px] italic text-cream-dim/70">{animal.nomLatin}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span className={`chip px-2 py-0.5 text-[10px] ${rarete.classes}`}>{rarete.label}</span>
                        <span className="chip bg-white/[0.07] px-2 py-0.5 text-[10px] text-cream-dim">
                          <MapPin className="h-2.5 w-2.5" />
                          {animal.partout ? 'Tout l’itinéraire' : animal.lieux[0]}
                          {!animal.partout && animal.lieux.length > 1 && ` +${animal.lieux.length - 1}`}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        basculerVu(animal)
                      }}
                      aria-label={o.vu ? `Marquer ${animal.nom} comme non vu` : `Marquer ${animal.nom} comme vu`}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        o.vu
                          ? 'border-glacier bg-glacier text-night-deep'
                          : 'border-white/20 text-transparent hover:border-glacier/60'
                      }`}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </button>
                  </div>
                  {o.vu && (o.date || o.lieu || o.note) && (
                    <p className="mt-2.5 truncate border-t border-white/[0.06] pt-2 text-[11px] text-glacier">
                      ✓ Vu {o.date && `le ${new Date(o.date).toLocaleDateString('fr-FR')}`}
                      {o.lieu && ` · ${o.lieu}`}
                      {o.note && ` — ${o.note}`}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Fiche détail */}
      <Modal ouvert={detail !== null} onFermer={fermerDetail} titre={detail ? `${detail.emoji} ${detail.nom}` : ''}>
        {detail && draft && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm italic text-cream-dim">{detail.nomLatin}</span>
              <span className={`chip px-2 py-0.5 text-[10px] ${ANIMAL_RARETES[detail.rarete].classes}`}>
                {ANIMAL_RARETES[detail.rarete].label}
              </span>
              <span className="chip bg-white/[0.07] px-2 py-0.5 text-[10px] text-cream-dim">
                {ANIMAL_CATEGORIES[detail.categorie].emoji} {ANIMAL_CATEGORIES[detail.categorie].label}
              </span>
              <a
                href={fiches[detail.nomLatin]?.url ?? urlWikipedia(detail.nomLatin)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="chip bg-white/[0.07] px-2 py-0.5 text-[10px] text-cream-dim hover:bg-glacier/15 hover:text-glacier"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Wikipédia
              </a>
            </div>

            {fiches[detail.nomLatin]?.image && (
              <img
                src={fiches[detail.nomLatin]?.image ?? undefined}
                alt={detail.nom}
                className="max-h-52 w-full rounded-xl object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}

            <div>
              <p className="label">Où le trouver</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.partout ? (
                  <span className="chip bg-glacier/15 text-glacier">📍 Tout l’itinéraire</span>
                ) : (
                  detail.lieux.map((l) => (
                    <span key={l} className="chip bg-glacier/15 text-glacier">
                      📍 {l}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="label">Conseils d’observation</p>
              <p className="text-sm leading-relaxed text-cream-dim">{detail.conseils}</p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
              <button
                type="button"
                onClick={() => basculerVu(detail)}
                className={draft.vu ? 'btn-glacier w-full' : 'btn-primary w-full'}
              >
                {draft.vu ? (
                  <>
                    <X className="h-4 w-4" /> Marquer comme non vu
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Je l’ai vu !
                  </>
                )}
              </button>

              {draft.vu && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor="obs-date">
                        Date
                      </label>
                      <input
                        id="obs-date"
                        type="date"
                        className="input"
                        value={draft.date ?? ''}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value || null })}
                        onBlur={() => sauverDraft()}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="obs-lieu">
                        Lieu
                      </label>
                      <input
                        id="obs-lieu"
                        type="text"
                        className="input"
                        placeholder="Où l’as-tu vu ?"
                        value={draft.lieu}
                        onChange={(e) => setDraft({ ...draft, lieu: e.target.value })}
                        onBlur={() => sauverDraft()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="obs-note">
                      Note
                    </label>
                    <textarea
                      id="obs-note"
                      className="input min-h-[5rem] resize-y"
                      placeholder="Un souvenir, une anecdote, le nombre d’individus…"
                      value={draft.note}
                      onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                      onBlur={() => sauverDraft()}
                    />
                  </div>
                  <p className="text-[10px] text-cream-dim/60">
                    Synchronisé entre vous deux — l’autre voit tes trouvailles en direct.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        ouvert={confirmReset}
        titre="Réinitialiser le pokédex ?"
        message="Toutes les observations (coches, dates, notes) seront effacées pour vous deux."
        labelConfirmer="Tout effacer"
        onConfirmer={() => {
          setConfirmReset(false)
          void executer(async () => {
            await Promise.all(pokedex.map((o) => supprimerObservationPokedex(o.animal_id)))
          }, 'Pokédex réinitialisé')
        }}
        onAnnuler={() => setConfirmReset(false)}
      />
    </PageTransition>
  )
}
