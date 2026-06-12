import { Caravan, ExternalLink, Home, Plus, Search, Tent, TreePine, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { chercherBivouacs, type SousTypeBivouac, type SpotBivouac } from '../../lib/overpass'
import { useTripData } from '../../state/TripDataContext'
import { Drawer, Spinner } from '../ui'
import type { PoiPrefill } from './PoiForm'

const SOUS_TYPES: Record<SousTypeBivouac, { label: string; Icon: LucideIcon }> = {
  camp_site: { label: 'Camping', Icon: Tent },
  caravan_site: { label: 'Camping-car / van', Icon: Caravan },
  wilderness_hut: { label: 'Refuge / Hut', Icon: Home },
  shelter: { label: 'Abri', Icon: TreePine },
}

const RAYONS = [5, 10, 20, 50] as const

interface Props {
  ouvert: boolean
  onFermer: () => void
  onAjouter: (prefill: PoiPrefill) => void
}

export default function BivouacSearch({ ouvert, onFermer, onAjouter }: Props): ReactNode {
  const { etapes } = useTripData()
  const etapesAvecCoords = etapes.filter((e) => e.lat != null && e.lng != null)

  const [etapeId, setEtapeId] = useState<string>('')
  const [rayon, setRayon] = useState<number>(20)
  const [filtres, setFiltres] = useState<Set<SousTypeBivouac>>(
    new Set<SousTypeBivouac>(['camp_site', 'caravan_site', 'wilderness_hut', 'shelter']),
  )
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [spots, setSpots] = useState<SpotBivouac[] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (ouvert && !etapeId && etapesAvecCoords.length > 0) {
      setEtapeId(etapesAvecCoords[0].id)
    }
  }, [ouvert, etapesAvecCoords, etapeId])

  const basculerFiltre = (t: SousTypeBivouac): void => {
    setFiltres((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const rechercher = async (): Promise<void> => {
    const etape = etapes.find((e) => e.id === etapeId)
    if (!etape?.lat || !etape?.lng) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setChargement(true)
    setErreur(null)
    setSpots(null)

    try {
      const resultats = await chercherBivouacs(etape.lat, etape.lng, rayon, ctrl.signal)
      setSpots(resultats)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }

  const spotsFiltres = spots?.filter((s) => filtres.has(s.sousType)) ?? null

  const handleAjouter = (spot: SpotBivouac): void => {
    onAjouter({ lat: spot.lat, lng: spot.lng, nom: spot.nom, categorie: 'bivouac' })
    onFermer()
  }

  return (
    <Drawer ouvert={ouvert} onFermer={onFermer} titre="Bivouacs & Campings">
      <div className="space-y-4">
        <div>
          <label className="label">Autour de quelle étape ?</label>
          {etapesAvecCoords.length === 0 ? (
            <p className="text-sm text-amber-400">Aucune étape avec coordonnées GPS. Ajoute des coordonnées à tes étapes d'abord.</p>
          ) : (
            <select className="input" value={etapeId} onChange={(e) => setEtapeId(e.target.value)}>
              <option value="" disabled>
                — Choisir une étape —
              </option>
              {etapesAvecCoords.map((e) => (
                <option key={e.id} value={e.id}>
                  J{etapes.indexOf(e) + 1} — {e.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="label">Rayon de recherche</label>
          <div className="flex gap-2">
            {RAYONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRayon(r)}
                className={`chip flex-1 justify-center transition-all ${
                  rayon === r
                    ? 'bg-glacier/20 text-glacier ring-1 ring-glacier/40'
                    : 'text-cream-dim'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Types de spots</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SOUS_TYPES) as [SousTypeBivouac, { label: string; Icon: LucideIcon }][]).map(
              ([t, meta]) => {
                const actif = filtres.has(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => basculerFiltre(t)}
                    className={`chip transition-all ${
                      actif ? 'bg-glacier/20 text-glacier ring-1 ring-glacier/40' : 'text-cream-dim'
                    }`}
                  >
                    <meta.Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </button>
                )
              },
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary w-full"
          onClick={() => void rechercher()}
          disabled={!etapeId || chargement || etapesAvecCoords.length === 0}
        >
          {chargement ? <Spinner className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          {chargement ? 'Recherche en cours…' : 'Rechercher'}
        </button>
      </div>

      {erreur && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur}
        </div>
      )}

      {spotsFiltres !== null && !chargement && (
        <div className="mt-5">
          <p className="mb-3 text-xs text-cream-dim">
            {spotsFiltres.length === 0
              ? "Aucun spot trouvé — essaie un rayon plus grand ou active d'autres types"
              : `${spotsFiltres.length} spot${spotsFiltres.length > 1 ? 's' : ''} trouvé${spotsFiltres.length > 1 ? 's' : ''}`}
          </p>
          <div className="space-y-2">
            {spotsFiltres.map((spot) => {
              const meta = SOUS_TYPES[spot.sousType]
              return (
                <div key={spot.osmId} className="glass-soft flex items-start gap-3 px-3 py-2.5">
                  <meta.Icon className="mt-0.5 h-4 w-4 shrink-0 text-glacier" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-cream">{spot.nom}</p>
                    <p className="text-xs text-cream-dim">
                      {meta.label}
                      {spot.operateur ? ` · ${spot.operateur}` : ''}
                      {spot.fee === true ? ' · Payant' : spot.fee === false ? ' · Gratuit' : ''}
                      {' · '}
                      <span className="tabular-nums">{spot.distanceKm.toFixed(1)} km</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {spot.website && (
                      <a
                        href={spot.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost p-1.5"
                        title="Site web"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-glacier px-2 py-1.5 text-xs"
                      onClick={() => handleAjouter(spot)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {spotsFiltres.length > 0 && (
            <p className="mt-4 text-center text-xs text-cream-dim/50">
              Données :{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                © contributeurs OpenStreetMap
              </a>
            </p>
          )}
        </div>
      )}
    </Drawer>
  )
}
