import { AnimatePresence, motion } from 'framer-motion'
import { Download, FileUp, Upload } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import {
  parseCsv,
  parseGpx,
  parseKml,
  toCsv,
  toGpx,
  toKml,
  downloadFile,
  type PoiDraft,
} from '../../lib/importExport'
import { useTripData } from '../../state/TripDataContext'
import { useToast } from '../ui'

type Format = 'kml' | 'gpx' | 'csv'

const PARSERS: Record<Format, (text: string) => PoiDraft[]> = {
  kml: parseKml,
  gpx: parseGpx,
  csv: parseCsv,
}

const ACCEPT: Record<Format, string> = {
  kml: '.kml,application/vnd.google-earth.kml+xml',
  gpx: '.gpx,application/gpx+xml',
  csv: '.csv,text/csv',
}

export default function ImportExportMenu({ onImport }: { onImport: (drafts: PoiDraft[]) => void }): ReactNode {
  const { pois, etapes } = useTripData()
  const toast = useToast()
  const [ouvert, setOuvert] = useState(false)
  const fichierRef = useRef<HTMLInputElement>(null)
  const formatRef = useRef<Format>('kml')

  const demanderImport = (format: Format): void => {
    formatRef.current = format
    setOuvert(false)
    if (fichierRef.current) {
      fichierRef.current.accept = ACCEPT[format]
      fichierRef.current.value = ''
      fichierRef.current.click()
    }
  }

  const lireFichier = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const fichier = e.target.files?.[0]
    if (!fichier) return
    try {
      const texte = await fichier.text()
      const drafts = PARSERS[formatRef.current](texte)
      if (drafts.length === 0) {
        toast('Aucun point trouvé dans ce fichier', 'erreur')
        return
      }
      onImport(drafts)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import impossible', 'erreur')
    }
  }

  const exporter = (format: Format): void => {
    setOuvert(false)
    const horodatage = new Date().toISOString().split('T')[0]
    if (format === 'kml') downloadFile(`norvege-roadtrip-${horodatage}.kml`, toKml(pois, etapes), 'application/vnd.google-earth.kml+xml')
    if (format === 'gpx') downloadFile(`norvege-roadtrip-${horodatage}.gpx`, toGpx(pois, etapes), 'application/gpx+xml')
    if (format === 'csv') downloadFile(`norvege-roadtrip-${horodatage}.csv`, toCsv(pois), 'text/csv')
    toast(`Export ${format.toUpperCase()} téléchargé`)
  }

  return (
    <div className="relative">
      <button type="button" className="btn-ghost" onClick={() => setOuvert((o) => !o)}>
        <FileUp className="h-4 w-4" /> Import / Export
      </button>
      <input ref={fichierRef} type="file" className="hidden" onChange={(e) => void lireFichier(e)} />

      <AnimatePresence>
        {ouvert && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOuvert(false)} />
            <motion.div
              className="glass absolute right-0 z-40 mt-2 w-56 p-2"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-cream-dim/70">
                <Upload className="mr-1 inline h-3 w-3" /> Importer
              </p>
              {(['kml', 'gpx', 'csv'] as Format[]).map((f) => (
                <button key={f} type="button" className="block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-white/[0.08]" onClick={() => demanderImport(f)}>
                  {f.toUpperCase()}
                  {f === 'kml' && <span className="text-cream-dim"> — Google My Maps</span>}
                </button>
              ))}
              <p className="px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-cream-dim/70">
                <Download className="mr-1 inline h-3 w-3" /> Exporter
              </p>
              {(['kml', 'gpx', 'csv'] as Format[]).map((f) => (
                <button key={f} type="button" className="block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-white/[0.08]" onClick={() => exporter(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
