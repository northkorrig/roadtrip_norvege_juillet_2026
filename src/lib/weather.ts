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

/** Normales climatiques de juillet, moyennées sur plusieurs années (réanalyse ERA5). */
export interface ClimatologieJuillet {
  tMaxMoy: number
  tMinMoy: number
  /** Précipitations moyennes par jour (mm). */
  precipMoyJour: number
  /** Part des jours de juillet avec ≥ 1 mm de pluie (%). */
  pctJoursPluie: number
  ventMoy: number
  /** Nombre d'années moyennées. */
  annees: number
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

// Fenêtre historique moyennée pour les normales de juillet (réanalyse ERA5,
// disponible avec quelques jours de latence — on s'arrête donc à une année révolue).
const CLIMATO_DEBUT = '2014-07-01'
const CLIMATO_FIN = '2023-07-31'

/**
 * Normales climatiques de juillet à une position donnée, calculées à partir des
 * données historiques Open-Meteo (gratuit, sans clé). Utile dès maintenant —
 * contrairement aux prévisions, limitées à ~15 jours — pour un voyage en juillet.
 * Renvoie `null` si aucune donnée exploitable.
 */
export async function fetchClimatologieJuillet(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<ClimatologieJuillet | null> {
  const url =
    'https://archive-api.open-meteo.com/v1/archive' +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max' +
    `&timezone=Europe%2FOslo&start_date=${CLIMATO_DEBUT}&end_date=${CLIMATO_FIN}`

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open-Meteo archive : HTTP ${res.status}`)

  const body = (await res.json()) as {
    daily?: {
      time: string[]
      temperature_2m_max: (number | null)[]
      temperature_2m_min: (number | null)[]
      precipitation_sum: (number | null)[]
      wind_speed_10m_max: (number | null)[]
    }
  }
  const d = body.daily
  if (!d) return null

  let n = 0
  let sMax = 0
  let sMin = 0
  let sPrecip = 0
  let sVent = 0
  let joursPluie = 0
  const annees = new Set<number>()

  d.time.forEach((date, i) => {
    // ne garde que les jours de juillet (l'API renvoie la plage continue)
    if (date.slice(5, 7) !== '07') return
    const tMax = d.temperature_2m_max[i]
    const tMin = d.temperature_2m_min[i]
    const precip = d.precipitation_sum[i]
    const vent = d.wind_speed_10m_max[i]
    if (tMax === null || tMin === null || precip === null || vent === null) return
    n++
    sMax += tMax
    sMin += tMin
    sPrecip += precip
    sVent += vent
    if (precip >= 1) joursPluie++
    annees.add(Number(date.slice(0, 4)))
  })

  if (n === 0) return null

  return {
    tMaxMoy: Math.round(sMax / n),
    tMinMoy: Math.round(sMin / n),
    precipMoyJour: Math.round((sPrecip / n) * 10) / 10,
    pctJoursPluie: Math.round((joursPluie / n) * 100),
    ventMoy: Math.round(sVent / n),
    annees: annees.size,
  }
}
