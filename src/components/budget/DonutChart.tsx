import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface DonutSegment {
  label: string
  valeur: number
  couleur: string
}

/** Donut SVG maison (pas de lib de charts), animé au montage. */
export default function DonutChart({
  segments,
  centre,
  taille = 220,
}: {
  segments: DonutSegment[]
  centre?: ReactNode
  taille?: number
}): ReactNode {
  const total = segments.reduce((s, x) => s + x.valeur, 0)
  const visibles = segments.filter((s) => s.valeur > 0)

  let cumul = 0
  const arcs = visibles.map((s, i) => {
    const pct = total > 0 ? (s.valeur / total) * 100 : 0
    const arc = { ...s, pct, offset: cumul, index: i }
    cumul += pct
    return arc
  })

  return (
    <div className="relative inline-block" style={{ width: taille, height: taille }}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="26" />
        {arcs.map((a) => (
          <motion.circle
            key={a.label}
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke={a.couleur}
            strokeWidth="26"
            pathLength={100}
            strokeDasharray={`${a.pct} ${100 - a.pct}`}
            strokeDashoffset={-a.offset}
            initial={{ opacity: 0, strokeDasharray: `0 100` }}
            animate={{ opacity: 1, strokeDasharray: `${a.pct} ${100 - a.pct}` }}
            transition={{ duration: 0.9, delay: 0.15 + a.index * 0.08, ease: 'easeOut' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{centre}</div>
    </div>
  )
}
