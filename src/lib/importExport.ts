import type { Etape, LatLng, Poi, PoiCategorie, PoiInput } from '../types/db'
import { POI_CATEGORIES } from '../config/constants'

/** POI candidat issu d'un import, avant insertion. */
export interface PoiDraft {
  nom: string
  lat: number
  lng: number
  note: string | null
  categorie: PoiCategorie
}

function parseXml(text: string, kind: string): Document {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error(`Fichier ${kind} invalide ou illisible`)
  }
  return doc
}

function clean(s: string | null | undefined): string {
  return (s ?? '').replace(/\s+/g, ' ').trim()
}

/** KML (Google My Maps) → waypoints des <Placemark><Point>. */
export function parseKml(text: string): PoiDraft[] {
  const doc = parseXml(text, 'KML')
  const out: PoiDraft[] = []
  doc.querySelectorAll('Placemark').forEach((pm) => {
    const coords = pm.querySelector('Point > coordinates')?.textContent
    if (!coords) return // LineString/Polygon ignorés : on n'importe que des points
    const [lng, lat] = coords.trim().split(',').map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const nom = clean(pm.querySelector('name')?.textContent) || 'POI importé'
    const desc = clean(pm.querySelector('description')?.textContent)
    out.push({ nom, lat, lng, note: desc || null, categorie: 'activite' })
  })
  return out
}

/** GPX → waypoints <wpt>. */
export function parseGpx(text: string): PoiDraft[] {
  const doc = parseXml(text, 'GPX')
  const out: PoiDraft[] = []
  doc.querySelectorAll('wpt').forEach((wpt) => {
    const lat = Number(wpt.getAttribute('lat'))
    const lng = Number(wpt.getAttribute('lon'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
    const nom = clean(wpt.querySelector('name')?.textContent) || 'Waypoint GPX'
    const desc = clean(wpt.querySelector('desc')?.textContent)
    out.push({ nom, lat, lng, note: desc || null, categorie: 'activite' })
  })
  return out
}

/** CSV avec en-tête `nom,lat,lng[,categorie][,note]` (séparateur , ou ;). */
export function parseCsv(text: string): PoiDraft[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) throw new Error('CSV vide ou sans ligne de données')
  const sep = lines[0].includes(';') ? ';' : ','
  const splitLine = (line: string): string[] =>
    line
      .split(new RegExp(`${sep}(?=(?:[^"]*"[^"]*")*[^"]*$)`))
      .map((c) => c.trim().replace(/^"(.*)"$/s, '$1').replace(/""/g, '"'))

  const header = splitLine(lines[0]).map((h) => h.toLowerCase())
  const idx = (name: string): number => header.indexOf(name)
  const iNom = idx('nom')
  const iLat = idx('lat')
  const iLng = idx('lng') !== -1 ? idx('lng') : idx('lon')
  if (iNom === -1 || iLat === -1 || iLng === -1) {
    throw new Error('CSV : colonnes requises `nom`, `lat`, `lng`')
  }
  const iCat = idx('categorie')
  const iNote = idx('note')

  const out: PoiDraft[] = []
  for (const line of lines.slice(1)) {
    const cells = splitLine(line)
    const lat = Number(cells[iLat]?.replace(',', '.'))
    const lng = Number(cells[iLng]?.replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    const catRaw = iCat === -1 ? '' : (cells[iCat] ?? '')
    const categorie = (Object.keys(POI_CATEGORIES) as PoiCategorie[]).find((c) => c === catRaw) ?? 'activite'
    out.push({
      nom: cells[iNom] || 'POI importé',
      lat,
      lng,
      categorie,
      note: iNote === -1 ? null : cells[iNote] || null,
    })
  }
  return out
}

/** Extrait des coordonnées d'une URL Google Maps collée. */
export function parseGoogleMapsUrl(url: string): LatLng | null {
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // lien "place" précis
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // position caméra
    /[?&]q(?:uery)?=(-?\d+(?:\.\d+)?)(?:,|%2C)(-?\d+(?:\.\d+)?)/, // ?q=lat,lng
    /\/search\/(-?\d+(?:\.\d+)?),\s*\+?(-?\d+(?:\.\d+)?)/,
  ]
  for (const re of patterns) {
    const m = re.exec(url)
    if (m) {
      const lat = Number(m[1])
      const lng = Number(m[2])
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng }
      }
    }
  }
  return null
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function toKml(pois: Poi[], etapes: Etape[]): string {
  const placemarks = pois
    .map(
      (p) => `    <Placemark>
      <name>${escapeXml(p.nom)}</name>
      <description>${escapeXml(`[${POI_CATEGORIES[p.categorie].label}] ${p.note ?? ''}`.trim())}</description>
      <Point><coordinates>${p.lng},${p.lat},0</coordinates></Point>
    </Placemark>`,
    )
    .join('\n')
  const routeCoords = etapes
    .filter((e) => e.lat !== null && e.lng !== null)
    .map((e) => `${e.lng},${e.lat},0`)
    .join(' ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Norvège — Road Trip Fjords &amp; Montagnes</name>
${placemarks}
    <Placemark>
      <name>Trace du road trip</name>
      <LineString><tessellate>1</tessellate><coordinates>${routeCoords}</coordinates></LineString>
    </Placemark>
  </Document>
</kml>
`
}

export function toGpx(pois: Poi[], etapes: Etape[]): string {
  const wpts = pois
    .map(
      (p) => `  <wpt lat="${p.lat}" lon="${p.lng}">
    <name>${escapeXml(p.nom)}</name>
    <desc>${escapeXml(p.note ?? '')}</desc>
  </wpt>`,
    )
    .join('\n')
  const rtepts = etapes
    .filter((e) => e.lat !== null && e.lng !== null)
    .map((e) => `    <rtept lat="${e.lat}" lon="${e.lng}"><name>${escapeXml(e.nom)}</name></rtept>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="norway-roadtrip-v2" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
  <rte>
    <name>Itinéraire Oslo → Oslo</name>
${rtepts}
  </rte>
</gpx>
`
}

export function toCsv(pois: Poi[]): string {
  const esc = (v: string | number | null): string => {
    const s = v === null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = pois.map((p) => [p.nom, p.lat, p.lng, p.categorie, p.jour ?? '', p.note ?? ''].map(esc).join(','))
  return ['nom,lat,lng,categorie,jour,note', ...rows].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Convertit les drafts importés en lignes prêtes pour la table `pois`. */
export function draftsToInputs(drafts: PoiDraft[], ordreDepart: number): PoiInput[] {
  return drafts.map((d, i) => ({
    nom: d.nom,
    categorie: d.categorie,
    lat: d.lat,
    lng: d.lng,
    note: d.note,
    ordre: ordreDepart + i,
    jour: null,
    etape_id: null,
  }))
}
