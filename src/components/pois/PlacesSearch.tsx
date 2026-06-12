import { Search } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useGoogleMapsReady } from '../../lib/googleMaps'

interface PlacesSearchProps {
  onPick: (resultat: { nom: string; lat: number; lng: number }) => void
  placeholder?: string
}

/** Champ d'autocomplétion Google Places (rendu uniquement si l'API est dispo). */
export default function PlacesSearch({ onPick, placeholder = 'Chercher un lieu en Norvège…' }: PlacesSearchProps): ReactNode {
  const status = useGoogleMapsReady()
  const inputRef = useRef<HTMLInputElement>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    if (status !== 'pret' || !inputRef.current) return
    const input = inputRef.current
    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['name', 'geometry.location'],
      componentRestrictions: { country: 'no' },
    })
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const loc = place.geometry?.location
      if (!loc) return
      onPickRef.current({ nom: place.name ?? 'Lieu', lat: loc.lat(), lng: loc.lng() })
      input.value = ''
    })
    return () => {
      listener.remove()
      google.maps.event.clearInstanceListeners(input)
    }
  }, [status])

  if (status === 'absent' || status === 'erreur') return null

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim/60" />
      <input
        ref={inputRef}
        className="input pl-10"
        placeholder={placeholder}
        disabled={status === 'chargement'}
        aria-label="Recherche Google Places"
      />
    </div>
  )
}
