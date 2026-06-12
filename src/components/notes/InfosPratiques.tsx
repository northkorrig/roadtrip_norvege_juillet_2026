import { ExternalLink, LifeBuoy, Link2, Ship, TentTree, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import WeatherWidget from './WeatherWidget'

const LIENS_UTILES: { label: string; detail: string; url: string }[] = [
  { label: 'yr.no', detail: 'La météo de référence en Norvège', url: 'https://www.yr.no' },
  { label: '175.no', detail: 'État des routes & cols en temps réel', url: 'https://www.175.no' },
  { label: 'norwaysbest.com', detail: 'Croisière Nærøyfjord (à réserver)', url: 'https://www.norwaysbest.com' },
  { label: 'flamsbana.no', detail: 'Train panoramique de Flåm (à réserver)', url: 'https://www.flamsbana.no' },
  { label: 'gjende.no', detail: 'Bateau du lac Gjende — Besseggen (à réserver en juin)', url: 'https://gjende.no' },
  { label: 'arcticcampers.no', detail: 'Loueur du van — infos pickup/restitution', url: 'https://arcticcampers.no' },
]

export default function InfosPratiques(): ReactNode {
  return (
    <div className="space-y-5">
      <WeatherWidget />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <LifeBuoy className="h-5 w-5 text-glacier" /> Urgences
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['112', 'Police'],
              ['113', 'Ambulance'],
              ['110', 'Pompiers'],
            ].map(([num, label]) => (
              <div key={num} className="glass-soft py-3">
                <p className="font-display text-2xl font-bold text-ember">{num}</p>
                <p className="text-xs text-cream-dim">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-cream-dim">
            Secours en montagne via le <strong className="text-cream">112</strong>. Numéro Arctic Campers : sur le
            contrat de location.
          </p>
        </section>

        <section className="glass p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <TentTree className="h-5 w-5 text-glacier" /> Bivouac — allemannsretten
          </h3>
          <ul className="space-y-1.5 text-sm text-cream-dim">
            <li>• À 150 m minimum des habitations</li>
            <li>• 2 nuits max au même endroit</li>
            <li>• Feux interdits du 15/4 au 15/9 près des forêts</li>
            <li>• Aucune trace : tout remporter</li>
            <li>• Vidanges : uniquement aux stations équipées</li>
          </ul>
        </section>

        <section className="glass p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Ship className="h-5 w-5 text-glacier" /> Ferries
          </h3>
          <ul className="space-y-1.5 text-sm text-cream-dim">
            <li>• Jondal → Tørvikbygd : ~20 min, sans réservation</li>
            <li>• Paiement automatique par plaque (AutoPASS) ou CB</li>
            <li>• Arriver ~15 min avant, monter au moteur</li>
            <li>• Frein à main serré, rester près du van</li>
          </ul>
        </section>

        <section className="glass p-5">
          <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <TriangleAlert className="h-5 w-5 text-glacier" /> Conduite & van
          </h3>
          <ul className="space-y-1.5 text-sm text-cream-dim">
            <li>• 80 km/h hors agglomération — radars fréquents</li>
            <li>• Péages : flat fee Arctic Campers, rien à faire</li>
            <li>• Gasoil ~1,60 €/L — plein avant les zones isolées</li>
            <li>• Restitution : navette gratuite entrée 7, Gardermoen</li>
          </ul>
        </section>
      </div>

      <section className="glass p-5">
        <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Link2 className="h-5 w-5 text-glacier" /> Liens utiles
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LIENS_UTILES.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noreferrer"
              className="glass-soft group flex items-center gap-3 px-3.5 py-3 transition-colors hover:border-glacier/40"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-glacier">{l.label}</p>
                <p className="truncate text-xs text-cream-dim">{l.detail}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-cream-dim/50 transition-colors group-hover:text-glacier" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
