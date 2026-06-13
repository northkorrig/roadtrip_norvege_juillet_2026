// Génère les icônes PWA (PNG) en rastérisant le logo du favicon — aucun outil
// externe requis (ni sharp ni ImageMagick). Rasteriseur maison : polygones +
// cercle en peintre, supersampling pour l'anticrénelage, encodage PNG manuel.
//
// Lancer : node scripts/generate-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '..', 'public')

// ---------- Couleurs (#RRGGBB → [r,g,b]) ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const NIGHT = hex('#0D1B2A')
const BACK = hex('#13263B')
const FRONT = hex('#1E3650')
const SNOW = hex('#F0EDE6')
const TEAL = hex('#5BBFBA')
const EMBER = hex('#E8824A')

// ---------- Géométrie du logo (viewBox 64×64) ----------
function bezier(p0, c1, c2, p3, n) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0]
    const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]
    pts.push([x, y])
  }
  return pts
}

const SHAPES = [
  { type: 'poly', color: BACK, alpha: 1, pts: [[6, 44], [20, 22], [28, 34], [36, 18], [50, 40], [58, 30], [58, 58], [6, 58]] },
  { type: 'poly', color: FRONT, alpha: 1, pts: [[36, 18], [50, 40], [58, 30], [58, 58], [30, 58]] },
  { type: 'poly', color: SNOW, alpha: 1, pts: [[33, 24], [36, 18], [40, 24]] },
  {
    type: 'poly',
    color: TEAL,
    alpha: 0.9,
    pts: [[6, 58], [58, 58], ...bezier([58, 50], [46, 44], [22, 44], [6, 50], 24)],
  },
  { type: 'circle', color: EMBER, alpha: 1, cx: 14, cy: 14, r: 5 },
]

function inPoly(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Rastérise le logo à la taille `size`, motif mis à l'échelle `contentScale`
// autour du centre (fond toujours plein bord à bord).
function rasterize(size, contentScale = 1, ss = 4) {
  const big = size * ss
  const k = big / 64
  const tx = (p) => [(32 + (p[0] - 32) * contentScale) * k, (32 + (p[1] - 32) * contentScale) * k]
  const shapes = SHAPES.map((s) =>
    s.type === 'poly'
      ? { ...s, pts: s.pts.map(tx) }
      : { ...s, cx: (32 + (s.cx - 32) * contentScale) * k, cy: (32 + (s.cy - 32) * contentScale) * k, r: s.r * contentScale * k },
  )

  // Canvas supersamplé (RGB, fond opaque)
  const buf = new Uint8ClampedArray(big * big * 3)
  for (let i = 0; i < big * big; i++) {
    buf[i * 3] = NIGHT[0]
    buf[i * 3 + 1] = NIGHT[1]
    buf[i * 3 + 2] = NIGHT[2]
  }
  for (let y = 0; y < big; y++) {
    for (let x = 0; x < big; x++) {
      const px = x + 0.5
      const py = y + 0.5
      for (const s of shapes) {
        const hit = s.type === 'poly' ? inPoly(px, py, s.pts) : (px - s.cx) ** 2 + (py - s.cy) ** 2 <= s.r * s.r
        if (!hit) continue
        const o = (y * big + x) * 3
        const a = s.alpha
        buf[o] = buf[o] * (1 - a) + s.color[0] * a
        buf[o + 1] = buf[o + 1] * (1 - a) + s.color[1] * a
        buf[o + 2] = buf[o + 2] * (1 - a) + s.color[2] * a
      }
    }
  }

  // Downscale moyenné → RGBA opaque
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const o = ((y * ss + dy) * big + (x * ss + dx)) * 3
          r += buf[o]; g += buf[o + 1]; b += buf[o + 2]
        }
      }
      const n = ss * ss
      const o = (y * size + x) * 4
      out[o] = Math.round(r / n)
      out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n)
      out[o + 3] = 255
    }
  }
  return out
}

// ---------- Encodage PNG (RGBA, 8 bits) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}
function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  // Lignes filtrées (filtre 0)
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))])
}

// ---------- Génération ----------
mkdirSync(PUBLIC, { recursive: true })
const targets = [
  { file: 'pwa-192x192.png', size: 192, scale: 1 },
  { file: 'pwa-512x512.png', size: 512, scale: 1 },
  { file: 'pwa-maskable-512x512.png', size: 512, scale: 0.8 }, // zone de sécurité maskable
  { file: 'apple-touch-icon.png', size: 180, scale: 1 },
]
for (const t of targets) {
  writeFileSync(resolve(PUBLIC, t.file), encodePng(rasterize(t.size, t.scale), t.size))
  console.log('✓', t.file)
}
