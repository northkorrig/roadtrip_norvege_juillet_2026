import { ExternalLink, MapPin, Navigation, Search, Ship } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useGeolocation } from '../../hooks/useGeolocation'
import { chercherFerries, type QuaiFerry } from '../../lib/entur'
import { lienGoogleMaps } from '../../lib/googleMaps'
import { useTripData } from '../../state/TripDataContext'
import type { LatLng } from '../../types/db'
import { Drawer, Spinner } from '../ui'

const RAYONS = [10, 20, 30, 50] as const
const POSITION = '__position__'

/** Heure locale HH:MM + écart relatif ("dans 25 min", "départ imminent"). */
function formatDepart(iso: string): { heure: string; relatif: string | null } {
  const d = new Date(iso)
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const min = Math.round((d.getTime() - Date.now()) / 60000)
  if (min < 0) return { heure, relatif: null }
  if (min === 0) return { heure, relatif: 'imminent' }
  if (min < 60) return { heure, relatif: `dans ${min} min` }
  const h = Math.floor(min / 60)
  return { heure, relatif: `dans ${h} h${min % 60 ? String(min % 60).padStart(2, '0') : ''}` }
}

interface Props {
  ouvert: boolean
  onFermer: () => void
}

export default function FerrySearch({ ouvert, onFermer }: Props): ReactNode {
  const { etapes } = useTripData()
  const etapesAvecCoords = etapes.filter((e) => e.lat != null && e.lng != null)
  const geo = useGeolocation()

  const [source, setSource] = useState<string>('')
  const [rayon, setRayon] = useState<number>(20)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [quais, setQuais] = useState<QuaiFerry[] | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (ouvert && !source && etapesAvecCoords.length > 0) setSource(etapesAvecCoords[0].id)
  }, [ouvert, etapesAvecCoords, source])

  const rechercher = async (): Promise<void> => {
    let centre: LatLng | null = null
    if (source === POSITION) {
      centre = await geo.localiser()
      if (!centre) return
    } else {
      const etape = etapes.find((e) => e.id === source)
      if (etape?.lat != null && etape?.lng != null) centre = { lat: etape.lat, lng: etape.lng }
    }
    if (!centre) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setChargement(true)
    setErreur(null)
    setQuais(null)
    try {
      const res = await chercherFerries(centre.lat, centre.lng, rayon, ctrl.signal)
      if (!ctrl.signal.aborted) setQuais(res)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setChargement(false)
    }
  }

  const occupe = chargement || geo.chargement

  return (
    <Drawer ouvert={ouvert} onFermer={onFermer} titre="Ferries à proximité">
      <div className="space-y-4">
        <div>
          <label className="label">Point de recherche</label>
          {etapesAvecCoords.length === 0 ? (
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value={POSITION}>📍 Autour de moi</option>
            </select>
          ) : (
            <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value={POSITION}>📍 Autour de moi (GPS)</option>
              <optgroup label="Étapes">
                {etapesAvecCoords.map((e) => (
                  <option key={e.id} value={e.id}>
                    J{etapes.indexOf(e) + 1} — {e.nom}
                  </option>
                ))}
              </optgroup>
            </select>
          )}
        </div>

        <div>
          <label className="label">Rayon</label>
          <div className="flex gap-2">
            {RAYONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRayon(r)}
                className={`chip flex-1 justify-center transition-all ${
                  rayon === r ? 'bg-glacier/20 text-glacier ring-1 ring-glacier/40' : 'text-cream-dim'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="btn-primary w-full" onClick={() => void rechercher()} disabled={occupe || !source}>
          {occupe ? <Spinner className="h-4 w-4" /> : source === POSITION ? <Navigation className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          {geo.chargement ? 'Localisation…' : chargement ? 'Recherche…' : 'Trouver les ferries'}
        </button>

        <p className="text-xs text-cream-dim/70">
          Affiche les prochains départs en temps réel — surtout utile une fois sur place. Les ferries de la côte
          ouest sont souvent sans réservation : on fait la queue et on paie à bord.
        </p>
      </div>

      {(erreur || geo.erreur) && (
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {erreur ?? geo.erreur}
        </div>
      )}

      {quais !== null && !chargement && (
        <div className="mt-5 space-y-3">
          {quais.length === 0 ? (
            <p className="text-sm text-cream-dim">Aucun embarcadère trouvé dans ce rayon — essaie plus large.</p>
          ) : (
            quais.map((q) => (
              <div key={q.id} className="glass-soft px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Ship className="h-4 w-4 shrink-0 text-glacier" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-cream">{q.nom}</p>
                      <p className="text-xs tabular-nums text-cream-dim">{q.distanceKm.toFixed(1)} km</p>
                    </div>
                  </div>
                  <a
                    href={lienGoogleMaps(q.lat, q.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost shrink-0 p-1.5"
                    title="Voir l'embarcadère sur Google Maps"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </a>
                </div>

                {q.departs.length === 0 ? (
                  <p className="mt-2 text-xs text-cream-dim/60">Pas de départ annoncé dans les prochaines 24 h.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {q.departs.map((d, i) => {
                      const { heure, relatif } = formatDepart(d.heure)
                      return (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-12 shrink-0 font-semibold tabular-nums text-cream">{heure}</span>
                          <span className="flex items-center gap-1 truncate text-cream-dim">
                            {d.realtime && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title="Temps réel" />}
                            → {d.destination}
                          </span>
                          {relatif && <span className="ml-auto shrink-0 text-glacier/80">{relatif}</span>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))
          )}
          {quais.length > 0 && (
            <p className="flex items-center justify-center gap-1 text-center text-xs text-cream-dim/50">
              <ExternalLink className="h-3 w-3" /> Données : Entur (données ouvertes, Norvège)
            </p>
          )}
        </div>
      )}
    </Drawer>
  )
}
