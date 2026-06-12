import { motion } from 'framer-motion'
import { MapPinOff } from 'lucide-react'
import type { ReactNode } from 'react'
import type { MapsStatus } from '../../lib/googleMaps'

/**
 * Décor "fjord de nuit" affiché à la place de Google Maps quand la clé API
 * est absente ou que le chargement échoue — l'app reste belle et utilisable.
 */
export default function MapFallback({
  status,
  className = '',
  message = true,
}: {
  status: MapsStatus
  className?: string
  message?: boolean
}): ReactNode {
  return (
    <div className={`relative overflow-hidden bg-night-deep ${className}`}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#091421" />
            <stop offset="70%" stopColor="#0D1B2A" />
            <stop offset="100%" stopColor="#13263B" />
          </linearGradient>
          <linearGradient id="eau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10293a" />
            <stop offset="100%" stopColor="#0a1521" />
          </linearGradient>
          <radialGradient id="aurore" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#5BBFBA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#5BBFBA" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="1200" height="800" fill="url(#ciel)" />

        <motion.ellipse
          cx="780"
          cy="170"
          rx="420"
          ry="130"
          fill="url(#aurore)"
          animate={{ opacity: [0.5, 1, 0.6, 1], scaleX: [1, 1.12, 1.04, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.ellipse
          cx="380"
          cy="120"
          rx="300"
          ry="90"
          fill="url(#aurore)"
          animate={{ opacity: [0.8, 0.4, 0.9, 0.8] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        {[
          [120, 90], [240, 150], [420, 60], [560, 130], [700, 70],
          [880, 110], [1020, 60], [1110, 160], [320, 210], [960, 200],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.3} fill="#F0EDE6" opacity={0.5} />
        ))}
        <circle cx="1040" cy="120" r="26" fill="#F0EDE6" opacity="0.85" />
        <circle cx="1030" cy="112" r="26" fill="#0D1B2A" opacity="0.9" />

        <path d="M0 430 L180 300 L320 420 L470 270 L640 440 L0 460 Z" fill="#0f2236" />
        <path d="M380 450 L600 280 L760 430 L920 250 L1200 460 L1200 520 L380 520 Z" fill="#13263B" />
        <path d="M0 520 L240 400 L480 530 L720 420 L980 540 L1200 470 V620 H0 Z" fill="#1E3650" />
        <path d="M470 270 L640 440 L560 440 Z" fill="#F0EDE6" opacity="0.12" />
        <path d="M920 250 L1040 360 L980 365 Z" fill="#F0EDE6" opacity="0.1" />

        <rect y="560" width="1200" height="240" fill="url(#eau)" />
        <motion.rect
          y="560"
          width="1200"
          height="240"
          fill="#5BBFBA"
          opacity="0.05"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <motion.path
          d="M120 700 C 260 620, 330 660, 420 600 S 600 480, 700 520 S 880 560, 960 470 S 1080 380, 1130 330"
          fill="none"
          stroke="#5BBFBA"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="2 14"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }}
        />
        {[
          [120, 700], [420, 600], [700, 520], [960, 470], [1130, 330],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="#E8824A" opacity="0.25" />
            <circle cx={x} cy={y} r="5" fill="#E8824A" stroke="#0D1B2A" strokeWidth="1.5" />
          </g>
        ))}
      </svg>

      {message && (
        <div className="glass absolute bottom-4 left-1/2 z-10 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 px-4 py-3 text-sm text-cream-dim">
          <MapPinOff className="h-4 w-4 shrink-0 text-glacier" />
          {status === 'erreur' ? (
            <span>Google Maps n’a pas pu se charger — vérifie la clé API et la connexion.</span>
          ) : (
            <span>
              Carte interactive désactivée — ajoute <code className="text-glacier">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
              dans <code className="text-glacier">.env.local</code>.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
