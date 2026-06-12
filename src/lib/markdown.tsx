import type { ReactNode } from 'react'

// Mini-rendu Markdown (gras, italique, liens, listes, titres) sans dépendance
// ni dangerouslySetInnerHTML : le contenu utilisateur reste inerte.

const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+)/g

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(INLINE_RE)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (!part) return null
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-cream">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key}>{part.slice(1, -1)}</em>
      )
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer" className="text-glacier underline underline-offset-2 hover:text-glacier-soft">
          {link[1]}
        </a>
      )
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={key} href={part} target="_blank" rel="noreferrer" className="text-glacier underline underline-offset-2 hover:text-glacier-soft break-all">
          {part.replace(/^https?:\/\/(www\.)?/, '')}
        </a>
      )
    }
    return <span key={key}>{part}</span>
  })
}

export function Markdown({ text, className = '' }: { text: string; className?: string }): ReactNode {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let items: ReactNode[] = []

  const flushList = (): void => {
    if (items.length === 0) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-1 pl-1">
        {items}
      </ul>,
    )
    items = []
  }

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (line.startsWith('- ')) {
      items.push(
        <li key={`li-${i}`} className="flex gap-2">
          <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-glacier/70" />
          <span>{renderInline(line.slice(2), `l${i}`)}</span>
        </li>,
      )
      return
    }
    flushList()
    if (!line) return
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push(
        <p key={`h-${i}`} className="pt-1 font-display text-base font-semibold text-cream">
          {renderInline(heading[2], `h${i}`)}
        </p>,
      )
      return
    }
    blocks.push(<p key={`p-${i}`}>{renderInline(line, `p${i}`)}</p>)
  })
  flushList()

  return <div className={`text-sm leading-relaxed text-cream-dim ${className}`}>{blocks}</div>
}
