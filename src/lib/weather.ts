export interface JourMeteo {
  date: string
  tMin: number
  tMax: number
  precipitationMm: number
  ventKmh: number
  code: number
}

export interface MeteoResult {
  disponible: boolean
  jours: JourMeteo[]
}

/** Codes WMO → libellé + pictogramme. */
export function descriptionMeteo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Ciel clair', emoji: '☀️' }
  if (code <= 2) return { label: 'Éclaircies', emoji: '🌤️' }
  if (code === 3) return { label: 'Couvert', emoji: '☁️' }
  if (code <= 48) return { label: 'Brouillard', emoji: '🌫️' }
  if (code <= 57) return { label: 'Bruine', emoji: '🌦️' }
  if (code <= 67) return { label: 'Pluie', emoji: '🌧️' }
  if (code <= 77) return { label: 'Neige', emoji: '🌨️' }
  if (code <= 82) return { label: 'Averses', emoji: '🌧️' }
  if (code <= 86) return { label: 'Averses de neige', emoji: '🌨️' }
  return { label: 'Orage', emoji: '⛈️' }
}

const HORIZON_JOURS = 15 // limite de prévision Open-Meteo (16 j) avec marge

/**
 * Prévisions Open-Meteo (gratuit, sans clé API). Si les dates demandées sont
 * au-delà de l'horizon de prévision, renvoie `disponible: false` — l'UI
 * affiche alors les normales climatiques de juillet.
 */
export async function fetchMeteo(
  lat: number,
  lng: number,
  debut: string,
  fin: string,
  signal?: AbortSignal,
): Promise<MeteoResult> {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + HORIZON_JOURS)
  const start = new Date(`${debut}T12:00:00`)
  if (start > maxDate) {
    return { disponible: false, jours: [] }
  }
  const finBornee = new Date(`${fin}T12:00:00`) > maxDate ? maxDate.toISOString().split('T')[0] : fin

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code' +
    `&timezone=Europe%2FOslo&start_date=${debut}&end_date=${finBornee}`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo : HTTP ${res.status}`)

  const body = (await res.json()) as {
    daily?: {
      time: string[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_sum: number[]
      wind_speed_10m_max: number[]
      weather_code: number[]
    }
  }
  const d = body.daily
  if (!d) return { disponible: false, jours: [] }

  return {
    disponible: true,
    jours: d.time.map((date, i) => ({
      date,
      tMax: Math.round(d.temperature_2m_max[i]),
      tMin: Math.round(d.temperature_2m_min[i]),
      precipitationMm: Math.round(d.precipitation_sum[i] * 10) / 10,
      ventKmh: Math.round(d.wind_speed_10m_max[i]),
      code: d.weather_code[i],
    })),
  }
}
