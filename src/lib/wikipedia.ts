import { useEffect, useState } from 'react'
import { LS_KEYS } from '../config/constants'

/** Fiche Wikipédia résolue pour une espèce : lien vers l'article + vignette. */
export interface FicheWiki {
  url: string
  image: string | null
}

type CacheWiki = Record<string, FicheWiki>

function lireCache(): CacheWiki {
  try {
    const raw = localStorage.getItem(LS_KEYS.wikiCache)
    return raw ? (JSON.parse(raw) as CacheWiki) : {}
  } catch {
    return {}
  }
}

function ecrireCache(cache: CacheWiki): void {
  try {
    localStorage.setItem(LS_KEYS.wikiCache, JSON.stringify(cache))
  } catch {
    // stockage plein/indisponible : le cache mémoire suffit pour la session
  }
}

interface SummaryWiki {
  content_urls?: { desktop?: { page?: string } }
  thumbnail?: { source?: string }
}

/** Lien de repli si l'API n'a pas (encore) répondu pour ce titre. */
export function urlWikipedia(titre: string): string {
  return `https://fr.wikipedia.org/wiki/${encodeURIComponent(titre.replaceAll(' ', '_'))}`
}

async function fetchFiche(titre: string): Promise<FicheWiki | null> {
  const res = await fetch(
    `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titre)}`,
  )
  if (!res.ok) return null
  const data = (await res.json()) as SummaryWiki
  const url = data.content_urls?.desktop?.page
  if (!url) return null
  return { url, image: data.thumbnail?.source ?? null }
}

/**
 * Résout les fiches Wikipédia (photo + lien) d'une liste de titres — ici les
 * noms latins des espèces, qui redirigent vers l'article français.
 * Une seule salve de requêtes par appareil : le résultat est mis en cache en
 * localStorage, et les images elles-mêmes passent par le cache du service
 * worker (voir vite.config.ts) pour rester visibles hors-ligne.
 */
export function useFichesWiki(titres: string[]): CacheWiki {
  const [fiches, setFiches] = useState<CacheWiki>(lireCache)

  useEffect(() => {
    const connues = lireCache()
    const manquants = titres.filter((t) => !(t in connues))
    if (manquants.length === 0) return

    let actif = true
    void Promise.all(
      manquants.map(async (titre) => [titre, await fetchFiche(titre).catch(() => null)] as const),
    ).then((resultats) => {
      const trouvees = resultats.filter((r): r is [string, FicheWiki] => r[1] !== null)
      if (!actif || trouvees.length === 0) return
      setFiches((prev) => {
        const next = { ...prev, ...Object.fromEntries(trouvees) }
        ecrireCache(next)
        return next
      })
    })
    return () => {
      actif = false
    }
    // Une salve au montage de la page ; les échecs (hors-ligne) seront
    // retentés à la prochaine visite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return fiches
}
