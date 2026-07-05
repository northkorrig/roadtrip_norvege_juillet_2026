// « Sélection connaisseurs » — spots de nuit réputés le long de l'itinéraire,
// compilés à la main depuis les guides van-life et les aires des Routes
// touristiques nationales (Nasjonale turistveger). Il n'existe pas d'API
// ouverte chez park4night / iOverlander (cf. api/spots.ts) : cette liste
// éditoriale est notre couche "recommandé par des humains".
//
// Précision : les coordonnées embarquées sont un repère. Au premier affichage,
// chaque spot est recalé sur la fiche Google Places correspondante
// (findPlaceFromQuery) puis mis en cache — le point tombe alors exactement
// sur le lieu. Si Places est indisponible, le spot est marqué "approx".

import { LS_KEYS } from '../config/constants'
import { haversineKm, type SpotBivouac } from './overpass'

interface SelectionDef {
  id: string
  nom: string
  /** Requête Google Places pour recaler le point ; null = coordonnées fiables. */
  requete: string | null
  lat: number
  lng: number
  description: string
  website: string | null
}

const SELECTION: SelectionDef[] = [
  // ---- Telemark ----
  {
    id: 'stavsro',
    nom: 'Stavsro (Gaustatoppen)',
    requete: 'Stavsro parkering Gaustatoppen',
    lat: 59.839,
    lng: 8.692,
    description:
      'Parking à 1 170 m au départ de la rando du Gaustatoppen. Nuit en van classique chez les vanlifers pour attaquer le sommet à l’aube avant la foule.',
    website: null,
  },
  // ---- Hardangervidda (Rv7) ----
  {
    id: 'dyranut',
    nom: 'Dyranut Fjellstove (Rv7)',
    requete: 'Dyranut Fjellstove',
    lat: 60.4194,
    lng: 7.4747,
    description:
      'Le toit de la Rv7 (~1 250 m), au cœur du plateau à rennes sauvages. Grand parking, café-refuge en été — base parfaite pour une soirée Hardangervidda.',
    website: null,
  },
  {
    id: 'halne',
    nom: 'Halne Fjellstugu',
    requete: 'Halne Fjellstugu',
    lat: 60.439,
    lng: 7.629,
    description:
      'Au bord du Halnefjorden sur la Rv7 : lumière du soir sur le lac, départs de sentiers. Spot de nuit réputé des guides van-life sur la traversée du plateau.',
    website: null,
  },
  {
    id: 'sysendammen',
    nom: 'Sysendammen',
    requete: 'Sysendammen',
    lat: 60.398,
    lng: 7.26,
    description:
      'La digue au-dessus d’Eidfjord, vue sur le glacier Hardangerjøkulen. Très prisé des vans pour la nuit avant/après Vøringsfossen (à 10 min).',
    website: null,
  },
  // ---- Hardangerfjord ----
  {
    id: 'kinsarvik',
    nom: 'Kinsarvik — bord de fjord',
    requete: 'Kinsarvik gjestehavn',
    lat: 60.3745,
    lng: 6.7205,
    description:
      'Quai et pelouses au bord du fjord, coucher de soleil sur le Sørfjorden. Départ des cascades de Husedalen. Nuit van généralement tolérée près du port.',
    website: null,
  },
  {
    id: 'sandvinvatnet',
    nom: 'Sandvinvatnet (Odda)',
    requete: 'Odda camping Sandvinvatnet',
    lat: 60.048,
    lng: 6.543,
    description:
      'Les rives du lac juste derrière Odda, sous les parois de Folgefonna — l’alternative nature aux parkings du bourg, à 5 min du ravitaillement.',
    website: null,
  },
  // ---- Nærøyfjord ----
  {
    id: 'gudvangen',
    nom: 'Gudvangen — Nærøyfjord',
    requete: 'Gudvangen fjordtell parking',
    lat: 60.8785,
    lng: 6.833,
    description:
      'Le fond du fjord UNESCO, parois de 1 000 m au-dessus du van. Parking/aire au bord de l’eau près de l’embarcadère — idéal la veille de la croisière de 9 h.',
    website: null,
  },
  // ---- Aurlandsfjellet (Fv243, « Snøvegen ») ----
  {
    id: 'flotane',
    nom: 'Flotane (Aurlandsfjellet)',
    requete: 'Flotane rasteplass Aurlandsfjellet',
    lat: 60.966,
    lng: 7.241,
    description:
      'Aire design des Routes touristiques nationales posée sur le plateau de la « route des neiges », WC d’été. Névés en juillet et nuit hors du temps à 1 100 m.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/aurlandsfjellet/',
  },
  {
    id: 'vedahaugane',
    nom: 'Vedahaugane (Aurlandsfjellet)',
    requete: 'Vedahaugane rasteplass',
    lat: 61.029,
    lng: 7.323,
    description:
      'Aire panoramique côté Lærdal de l’Aurlandsfjellet, avec son banc-sculpture qui plonge dans le paysage. Halte ou nuit calme au-dessus de la vallée.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/aurlandsfjellet/',
  },
  // ---- Lærdal ----
  {
    id: 'laerdal',
    nom: 'Lærdalsøyri',
    requete: 'Lærdalsøyri gjestehavn',
    lat: 61.1005,
    lng: 7.468,
    description:
      'Aire au bord du Sognefjord à deux pas des maisons en bois du vieux Lærdal. Étape van réputée entre Borgund et l’Aurlandsfjellet.',
    website: null,
  },
  // ---- Sognefjellsvegen (Rv55) ----
  {
    id: 'turtagro',
    nom: 'Turtagrø',
    requete: 'Turtagrø Hotel',
    lat: 61.5045,
    lng: 7.801,
    description:
      'Le camp de base historique de l’alpinisme norvégien, face aux aiguilles des Hurrungane. Parking van derrière l’hôtel, bar mythique des grimpeurs.',
    website: 'https://turtagro.no',
  },
  {
    id: 'oscarshaug',
    nom: 'Nedre Oscarshaug (Rv55)',
    requete: 'Nedre Oscarshaug utsiktspunkt',
    lat: 61.463,
    lng: 7.972,
    description:
      'Belvédère des Routes touristiques nationales avec sa longue-vue en verre : panorama sur les glaciers du Jotunheimen. Photo du soir garantie.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/sognefjellet/',
  },
  {
    id: 'mefjellet',
    nom: 'Mefjellet — sculpture (Rv55)',
    requete: 'Mefjellet rasteplass',
    lat: 61.493,
    lng: 8.035,
    description:
      'L’aire à la sculpture-cadre de Knut Wold, à ~1 400 m sur le col du Sognefjell. Névés, lacs turquoise — l’arrêt le plus photographié de la Rv55.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/sognefjellet/',
  },
  {
    id: 'liasanden',
    nom: 'Liasanden — pinède (Rv55)',
    requete: 'Liasanden rasteplass',
    lat: 61.635,
    lng: 8.26,
    description:
      'Aire ombragée dans une pinède au bord de la rivière, dans la descente vers Bøverdalen. Réputée paisible pour la nuit après le col.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/sognefjellet/',
  },
  // ---- Jotunheimen / Valdresflye (Rv51) ----
  {
    id: 'gjendesheim',
    nom: 'Reinsvangen — lac Gjende',
    requete: 'Reinsvangen parkering Gjendesheim',
    lat: 61.489,
    lng: 8.832,
    description:
      'Le grand parking du lac Gjende (navette vers l’embarcadère) : LA base pour Besseggen. Nuit en van autorisée (payante) — départ du bateau à deux pas.',
    website: 'https://gjende.no',
  },
  {
    id: 'maurvangen',
    nom: 'Maurvangen',
    requete: 'Maurvangen camping',
    lat: 61.468,
    lng: 8.935,
    description:
      'Au carrefour Rv51/Gjendesheim, au bord de la rivière Sjoa naissante. Alternative avec services quand Reinsvangen affiche complet en été.',
    website: null,
  },
  {
    id: 'flye1389',
    nom: 'Flye 1389 (Valdresflye)',
    requete: 'Flye 1389 Valdresflye',
    lat: 61.362,
    lng: 8.806,
    description:
      'Le point haut de la Rv51 (1 389 m) et son café d’altitude design. Rennes au petit matin, panorama Jotunheimen à 360° — bivouac d’altitude mythique.',
    website: 'https://www.nasjonaleturistveger.no/en/routes/valdresflye/',
  },
  {
    id: 'bygdin',
    nom: 'Bygdin — lac d’altitude',
    requete: 'Bygdin fjellhotell',
    lat: 61.345,
    lng: 8.816,
    description:
      'Au bord du lac Bygdin à 1 060 m, embarcadère du vieux bateau M/B Bitihorn. Rives dégagées côté Rv51, soirées calmes après le passage du Valdresflye.',
    website: null,
  },
]

/** Recalages Google Places mis en cache : id → position exacte (ou null si introuvable). */
type SnapCache = Record<string, { lat: number; lng: number; placeId: string } | null>

function lireSnaps(): SnapCache {
  try {
    const raw = localStorage.getItem(LS_KEYS.selectionSnap)
    return raw ? (JSON.parse(raw) as SnapCache) : {}
  } catch {
    return {}
  }
}

function ecrireSnaps(cache: SnapCache): void {
  try {
    localStorage.setItem(LS_KEYS.selectionSnap, JSON.stringify(cache))
  } catch {
    // stockage indisponible : on recalera à la prochaine session
  }
}

/** Distance max entre la coordonnée embarquée et la fiche Google acceptée. */
const SNAP_MAX_KM = 15

function snapUnSpot(def: SelectionDef): Promise<SnapCache[string]> {
  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'))
    service.findPlaceFromQuery(
      {
        query: `${def.requete} Norway`,
        fields: ['geometry', 'place_id'],
        locationBias: { lat: def.lat, lng: def.lng },
      },
      (results, status) => {
        const loc = results?.[0]?.geometry?.location
        const placeId = results?.[0]?.place_id
        if (status !== 'OK' || !loc || !placeId) return resolve(null)
        const lat = loc.lat()
        const lng = loc.lng()
        // garde-fou : on refuse une fiche à l'autre bout du pays
        if (haversineKm(def.lat, def.lng, lat, lng) > SNAP_MAX_KM) return resolve(null)
        resolve({ lat, lng, placeId })
      },
    )
  })
}

/**
 * Spots de la sélection dans le rayon demandé, au format SpotBivouac
 * (sousType 'selection'). Recale chaque spot sur sa fiche Google Places la
 * première fois (puis cache localStorage) pour que le point tombe pile sur
 * le lieu ; `approx` reste vrai tant que le recalage n'a pas abouti.
 */
export async function chercherSelection(
  lat: number,
  lng: number,
  rayonKm: number,
): Promise<SpotBivouac[]> {
  // marge : un spot recalé peut rentrer/sortir du rayon de quelques centaines de mètres
  const candidats = SELECTION.filter(
    (d) => haversineKm(lat, lng, d.lat, d.lng) <= rayonKm + 2,
  )
  if (candidats.length === 0) return []

  const snaps = lireSnaps()
  const placesDispo = typeof google !== 'undefined' && !!google.maps?.places

  if (placesDispo) {
    const aRecaler = candidats.filter((d) => !(d.id in snaps))
    if (aRecaler.length > 0) {
      const resultats = await Promise.all(
        aRecaler.map(async (d) => [d.id, await snapUnSpot(d).catch(() => null)] as const),
      )
      for (const [id, snap] of resultats) snaps[id] = snap
      ecrireSnaps(snaps)
    }
  }

  return candidats
    .map<SpotBivouac>((d) => {
      const snap = snaps[d.id] ?? null
      const pos = snap ?? d
      return {
        osmId: `selection/${d.id}`,
        nom: d.nom,
        sousType: 'selection',
        lat: pos.lat,
        lng: pos.lng,
        operateur: null,
        dnt: false,
        fee: null,
        eau: null,
        feu: null,
        toilettes: null,
        website: d.website,
        description: d.description,
        distanceKm: haversineKm(lat, lng, pos.lat, pos.lng),
        approx: snap === null,
      }
    })
    .filter((s) => s.distanceKm <= rayonKm)
}
