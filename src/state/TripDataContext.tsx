import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { repo } from '../lib/repo'
import type {
  Depense,
  DepenseInput,
  Etape,
  EtapeInput,
  Note,
  NoteInput,
  Poi,
  PoiInput,
  TableName,
  Tache,
  TacheInput,
} from '../types/db'

interface TripDataValue {
  etapes: Etape[]
  pois: Poi[]
  notes: Note[]
  taches: Tache[]
  depenses: Depense[]
  chargement: boolean
  erreur: string | null
  mode: 'supabase' | 'local'
  recharger: () => Promise<void>

  creerEtape: (input: EtapeInput) => Promise<Etape>
  modifierEtape: (id: string, patch: Partial<EtapeInput>) => Promise<void>
  supprimerEtape: (id: string) => Promise<void>
  reordonnerEtapes: (ids: string[]) => Promise<void>

  creerPoi: (input: PoiInput) => Promise<Poi>
  creerPois: (inputs: PoiInput[]) => Promise<void>
  modifierPoi: (id: string, patch: Partial<PoiInput>) => Promise<void>
  supprimerPoi: (id: string) => Promise<void>
  reordonnerPois: (ids: string[]) => Promise<void>

  creerNote: (input: NoteInput) => Promise<void>
  modifierNote: (id: string, patch: Partial<NoteInput>) => Promise<void>
  supprimerNote: (id: string) => Promise<void>

  creerTache: (input: TacheInput) => Promise<void>
  modifierTache: (id: string, patch: Partial<TacheInput>) => Promise<void>
  supprimerTache: (id: string) => Promise<void>

  creerDepense: (input: DepenseInput) => Promise<void>
  modifierDepense: (id: string, patch: Partial<DepenseInput>) => Promise<void>
  supprimerDepense: (id: string) => Promise<void>
}

const TripDataContext = createContext<TripDataValue | null>(null)

const parOrdre = <T extends { ordre: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => a.ordre - b.ordre)

export function TripDataProvider({ children }: { children: ReactNode }): ReactNode {
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [pois, setPois] = useState<Poi[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [taches, setTaches] = useState<Tache[]>([])
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  const rechargerTable = useCallback(async (table: TableName): Promise<void> => {
    switch (table) {
      case 'etapes':
        setEtapes(parOrdre(await repo.listEtapes()))
        break
      case 'pois':
        setPois(parOrdre(await repo.listPois()))
        break
      case 'notes':
        setNotes(await repo.listNotes())
        break
      case 'taches':
        setTaches(parOrdre(await repo.listTaches()))
        break
      case 'depenses':
        setDepenses(await repo.listDepenses())
        break
    }
  }, [])

  const recharger = useCallback(async (): Promise<void> => {
    setErreur(null)
    try {
      const [e, p, n, t, d] = await Promise.all([
        repo.listEtapes(),
        repo.listPois(),
        repo.listNotes(),
        repo.listTaches(),
        repo.listDepenses(),
      ])
      setEtapes(parOrdre(e))
      setPois(parOrdre(p))
      setNotes(n)
      setTaches(parOrdre(t))
      setDepenses(d)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de chargement des données')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void recharger()
  }, [recharger])

  // Realtime (Supabase) / autres onglets (local) → recharge la table modifiée,
  // avec un léger debounce pour absorber les rafales d'événements.
  const pendingRef = useRef<Set<TableName>>(new Set())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const unsubscribe = repo.subscribe((table) => {
      pendingRef.current.add(table)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const tables = [...pendingRef.current]
        pendingRef.current.clear()
        for (const t of tables) {
          rechargerTable(t).catch(() => {
            // un refresh raté n'est pas bloquant, le prochain événement réessaiera
          })
        }
      }, 250)
    })
    return () => {
      if (timer) clearTimeout(timer)
      unsubscribe()
    }
  }, [rechargerTable])

  const value = useMemo<TripDataValue>(
    () => ({
      etapes,
      pois,
      notes,
      taches,
      depenses,
      chargement,
      erreur,
      mode: repo.mode,
      recharger,

      creerEtape: async (input) => {
        const row = await repo.createEtape(input)
        setEtapes((prev) => parOrdre([...prev, row]))
        return row
      },
      modifierEtape: async (id, patch) => {
        const row = await repo.updateEtape(id, patch)
        setEtapes((prev) => parOrdre(prev.map((e) => (e.id === id ? row : e))))
      },
      supprimerEtape: async (id) => {
        await repo.deleteEtape(id)
        setEtapes((prev) => prev.filter((e) => e.id !== id))
        setPois((prev) => prev.map((p) => (p.etape_id === id ? { ...p, etape_id: null } : p)))
      },
      reordonnerEtapes: async (ids) => {
        setEtapes((prev) => {
          const parId = new Map(prev.map((e) => [e.id, e]))
          return ids.flatMap((id, ordre) => {
            const e = parId.get(id)
            return e ? [{ ...e, ordre }] : []
          })
        })
        await repo.setOrdres('etapes', ids)
      },

      creerPoi: async (input) => {
        const row = await repo.createPoi(input)
        setPois((prev) => parOrdre([...prev, row]))
        return row
      },
      creerPois: async (inputs) => {
        await repo.createPois(inputs)
        setPois(parOrdre(await repo.listPois()))
      },
      modifierPoi: async (id, patch) => {
        const row = await repo.updatePoi(id, patch)
        setPois((prev) => parOrdre(prev.map((p) => (p.id === id ? row : p))))
      },
      supprimerPoi: async (id) => {
        await repo.deletePoi(id)
        setPois((prev) => prev.filter((p) => p.id !== id))
        setNotes((prev) => prev.map((n) => (n.poi_id === id ? { ...n, poi_id: null } : n)))
      },
      reordonnerPois: async (ids) => {
        setPois((prev) => {
          const position = new Map(ids.map((id, i) => [id, i]))
          return parOrdre(
            prev.map((p) => {
              const ordre = position.get(p.id)
              return ordre === undefined ? p : { ...p, ordre }
            }),
          )
        })
        await repo.setOrdres('pois', ids)
      },

      creerNote: async (input) => {
        await repo.createNote(input)
        setNotes(await repo.listNotes())
      },
      modifierNote: async (id, patch) => {
        const row = await repo.updateNote(id, patch)
        setNotes((prev) => prev.map((n) => (n.id === id ? row : n)))
      },
      supprimerNote: async (id) => {
        await repo.deleteNote(id)
        setNotes((prev) => prev.filter((n) => n.id !== id))
      },

      creerTache: async (input) => {
        const row = await repo.createTache(input)
        setTaches((prev) => parOrdre([...prev, row]))
      },
      modifierTache: async (id, patch) => {
        const row = await repo.updateTache(id, patch)
        setTaches((prev) => parOrdre(prev.map((t) => (t.id === id ? row : t))))
      },
      supprimerTache: async (id) => {
        await repo.deleteTache(id)
        setTaches((prev) => prev.filter((t) => t.id !== id))
      },

      creerDepense: async (input) => {
        const row = await repo.createDepense(input)
        setDepenses((prev) => [...prev, row])
      },
      modifierDepense: async (id, patch) => {
        const row = await repo.updateDepense(id, patch)
        setDepenses((prev) => prev.map((d) => (d.id === id ? row : d)))
      },
      supprimerDepense: async (id) => {
        await repo.deleteDepense(id)
        setDepenses((prev) => prev.filter((d) => d.id !== id))
      },
    }),
    [etapes, pois, notes, taches, depenses, chargement, erreur, recharger],
  )

  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>
}

export function useTripData(): TripDataValue {
  const ctx = useContext(TripDataContext)
  if (!ctx) throw new Error('useTripData doit être utilisé sous <TripDataProvider>')
  return ctx
}

// ---- Mode lecture seule (page de partage /trip/:code) ----

const ReadonlyContext = createContext(false)

export function ReadonlyProvider({ children }: { children: ReactNode }): ReactNode {
  return <ReadonlyContext.Provider value={true}>{children}</ReadonlyContext.Provider>
}

export function useReadonly(): boolean {
  return useContext(ReadonlyContext)
}
