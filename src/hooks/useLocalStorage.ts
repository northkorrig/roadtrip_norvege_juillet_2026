import { useCallback, useState } from 'react'

/** État React persisté en localStorage (JSON). */
export function useLocalStorage<T>(
  key: string,
  valeurDefaut: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? valeurDefaut : (JSON.parse(raw) as T)
    } catch {
      return valeurDefaut
    }
  })

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // stockage plein/indisponible : l'état React reste correct
        }
        return next
      })
    },
    [key],
  )

  return [value, set]
}
