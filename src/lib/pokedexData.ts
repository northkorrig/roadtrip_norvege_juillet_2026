// Pokédex faune norvégienne — catalogue statique des espèces observables
// le long de l'itinéraire (sud de la Norvège, juillet). Les observations
// (vu / date / note) vivent dans la table pokedex_observations, partagée
// entre les voyageurs et synchronisée en temps réel (voir types/db.ts).

export type AnimalCategorie = 'mammifere' | 'oiseau' | 'aquatique'

export type AnimalRarete = 'commun' | 'peu_commun' | 'rare' | 'legendaire'

export interface Animal {
  id: string
  nom: string
  nomLatin: string
  emoji: string
  categorie: AnimalCategorie
  rarete: AnimalRarete
  /** Lieux de l'itinéraire où l'espèce est le plus probable. */
  lieux: string[]
  /** Espèce visible à peu près partout sur le trajet. */
  partout?: boolean
  /** Où / quand / comment maximiser ses chances. */
  conseils: string
}

/** Zones de l'itinéraire, dans l'ordre du voyage — utilisées pour le filtre lieu. */
export const POKEDEX_LIEUX = [
  'Oslo & Oslofjord',
  'Telemark & Numedal',
  'Hardangervidda',
  'Hardangerfjord & Eidfjord',
  'Folgefonna & Odda',
  'Voss',
  'Nærøyfjord & Flåm',
  'Lærdal & Aurlandsfjellet',
  'Sognefjell & Lom',
  'Jotunheimen & Besseggen',
  'Valdresflye',
] as const

export const ANIMAL_CATEGORIES: Record<AnimalCategorie, { label: string; emoji: string }> = {
  mammifere: { label: 'Mammifères', emoji: '🦌' },
  oiseau: { label: 'Oiseaux', emoji: '🪶' },
  aquatique: { label: 'Vie aquatique', emoji: '🐟' },
}

export const ANIMAL_CATEGORIE_LIST = Object.keys(ANIMAL_CATEGORIES) as AnimalCategorie[]

export const ANIMAL_RARETES: Record<AnimalRarete, { label: string; classes: string }> = {
  commun: { label: 'Commun', classes: 'bg-emerald-400/15 text-emerald-300' },
  peu_commun: { label: 'Peu commun', classes: 'bg-glacier/15 text-glacier' },
  rare: { label: 'Rare', classes: 'bg-violet-400/15 text-violet-300' },
  legendaire: { label: 'Légendaire', classes: 'bg-ember/20 text-ember-soft' },
}

export const ANIMAUX: Animal[] = [
  // ---- Mammifères ----
  {
    id: 'elan',
    nom: 'Élan',
    nomLatin: 'Alces alces',
    emoji: '🫎',
    categorie: 'mammifere',
    rarete: 'peu_commun',
    lieux: ['Telemark & Numedal', 'Sognefjell & Lom', 'Valdresflye'],
    conseils:
      'Le roi de la forêt norvégienne. Meilleures chances à l’aube et au crépuscule, en lisière de forêt ou près des marais. Prudence au volant le soir : il traverse sans prévenir.',
  },
  {
    id: 'renne',
    nom: 'Renne sauvage',
    nomLatin: 'Rangifer tarandus',
    emoji: '🦌',
    categorie: 'mammifere',
    rarete: 'peu_commun',
    lieux: ['Hardangervidda', 'Valdresflye'],
    conseils:
      'La Hardangervidda abrite les plus grands troupeaux de rennes sauvages d’Europe. Scruter les plateaux aux jumelles — souvent des taches claires en mouvement au loin. Valdresflye est réputé pour les apercevoir depuis la route RV51.',
  },
  {
    id: 'cerf',
    nom: 'Cerf élaphe',
    nomLatin: 'Cervus elaphus',
    emoji: '🦌',
    categorie: 'mammifere',
    rarete: 'peu_commun',
    lieux: ['Hardangerfjord & Eidfjord', 'Voss', 'Nærøyfjord & Flåm'],
    conseils:
      'Le « hjort » est très présent sur les rives boisées des fjords de l’Ouest. Cherche-le en soirée dans les vergers et prairies au-dessus du Hardangerfjord.',
  },
  {
    id: 'renard',
    nom: 'Renard roux',
    nomLatin: 'Vulpes vulpes',
    emoji: '🦊',
    categorie: 'mammifere',
    rarete: 'commun',
    lieux: [],
    partout: true,
    conseils:
      'Partout, des parcs d’Oslo aux vallées de montagne. Souvent aperçu tôt le matin au bord des routes ou près des campings — ne pas le nourrir !',
  },
  {
    id: 'renard_arctique',
    nom: 'Renard polaire',
    nomLatin: 'Vulpes lagopus',
    emoji: '🦊',
    categorie: 'mammifere',
    rarete: 'legendaire',
    lieux: ['Hardangervidda', 'Jotunheimen & Besseggen'],
    conseils:
      'Extrêmement rare : réintroduit sur la Hardangervidda après avoir frôlé l’extinction en Norvège du Sud. L’apercevoir relève du miracle — le graal absolu de ce pokédex.',
  },
  {
    id: 'glouton',
    nom: 'Glouton (carcajou)',
    nomLatin: 'Gulo gulo',
    emoji: '🦡',
    categorie: 'mammifere',
    rarete: 'legendaire',
    lieux: ['Jotunheimen & Besseggen', 'Sognefjell & Lom'],
    conseils:
      'Le fantôme des hautes montagnes. Quelques individus rôdent dans le Jotunheimen mais il évite l’homme. Chercher plutôt ses traces dans les névés au petit matin.',
  },
  {
    id: 'lemming',
    nom: 'Lemming des toundras',
    nomLatin: 'Lemmus lemmus',
    emoji: '🐹',
    categorie: 'mammifere',
    rarete: 'peu_commun',
    lieux: ['Hardangervidda', 'Jotunheimen & Besseggen', 'Valdresflye'],
    conseils:
      'Petite boule orange et noire qui détale entre les pierres des plateaux. Les « années à lemmings », il y en a partout sur les sentiers — sinon il faut de la chance. Il « aboie » quand on s’approche !',
  },
  {
    id: 'lievre',
    nom: 'Lièvre variable',
    nomLatin: 'Lepus timidus',
    emoji: '🐇',
    categorie: 'mammifere',
    rarete: 'peu_commun',
    lieux: ['Hardangervidda', 'Sognefjell & Lom', 'Jotunheimen & Besseggen', 'Valdresflye'],
    conseils:
      'Brun-gris en été (blanc l’hiver). Détale dans les pierriers et les landes de bouleaux nains, souvent au petit matin sur les sentiers de rando.',
  },
  {
    id: 'ecureuil',
    nom: 'Écureuil roux',
    nomLatin: 'Sciurus vulgaris',
    emoji: '🐿️',
    categorie: 'mammifere',
    rarete: 'commun',
    lieux: ['Oslo & Oslofjord', 'Telemark & Numedal', 'Voss'],
    conseils:
      'Dans toutes les forêts de conifères et les parcs d’Oslo. Écouter les bruits de griffes sur l’écorce et les cônes d’épicéa grignotés au pied des arbres.',
  },
  {
    id: 'hermine',
    nom: 'Hermine',
    nomLatin: 'Mustela erminea',
    emoji: '🐾',
    categorie: 'mammifere',
    rarete: 'rare',
    lieux: ['Hardangervidda', 'Jotunheimen & Besseggen', 'Valdresflye'],
    conseils:
      'Furtive et ultra-rapide, elle zigzague entre les rochers des plateaux. Si un éclair brun-crème traverse le sentier de Besseggen, c’est probablement elle.',
  },
  {
    id: 'castor',
    nom: 'Castor d’Europe',
    nomLatin: 'Castor fiber',
    emoji: '🦫',
    categorie: 'mammifere',
    rarete: 'rare',
    lieux: ['Telemark & Numedal'],
    conseils:
      'Le Telemark est le pays du castor. Guetter au crépuscule sur les berges calmes des rivières du Numedal : sillage en V sur l’eau et claquement de queue en cas d’alerte.',
  },
  {
    id: 'loutre',
    nom: 'Loutre d’Europe',
    nomLatin: 'Lutra lutra',
    emoji: '🦦',
    categorie: 'mammifere',
    rarete: 'rare',
    lieux: ['Hardangerfjord & Eidfjord', 'Nærøyfjord & Flåm'],
    conseils:
      'Présente dans les fjords, active surtout à l’aube. Scruter les rives rocheuses tranquilles et les embouchures de rivières — elle laisse des restes de crabes sur les rochers.',
  },
  {
    id: 'chevre',
    nom: 'Chèvre d’Undredal',
    nomLatin: 'Capra hircus',
    emoji: '🐐',
    categorie: 'mammifere',
    rarete: 'commun',
    lieux: ['Nærøyfjord & Flåm', 'Lærdal & Aurlandsfjellet'],
    conseils:
      'Undredal compte plus de chèvres que d’habitants ! Impossible de les rater dans les ruelles du village. Goûter le fromage brun (brunost) local, c’est la quête bonus.',
  },
  {
    id: 'mouton',
    nom: 'Mouton en liberté',
    nomLatin: 'Ovis aries',
    emoji: '🐑',
    categorie: 'mammifere',
    rarete: 'commun',
    lieux: [],
    partout: true,
    conseils:
      'En été, les moutons paissent en totale liberté — y compris au milieu de la route. Le tintement des cloches accompagne toutes les randos. Capture facile pour démarrer le pokédex !',
  },
  // ---- Oiseaux ----
  {
    id: 'pygargue',
    nom: 'Pygargue à queue blanche',
    nomLatin: 'Haliaeetus albicilla',
    emoji: '🦅',
    categorie: 'oiseau',
    rarete: 'rare',
    lieux: ['Nærøyfjord & Flåm', 'Hardangerfjord & Eidfjord'],
    conseils:
      'Le plus grand rapace d’Europe du Nord (2,4 m d’envergure !). Meilleure chance pendant la croisière sur le Nærøyfjord : silhouette massive planant le long des parois.',
  },
  {
    id: 'aigle_royal',
    nom: 'Aigle royal',
    nomLatin: 'Aquila chrysaetos',
    emoji: '🦅',
    categorie: 'oiseau',
    rarete: 'rare',
    lieux: ['Jotunheimen & Besseggen', 'Valdresflye', 'Hardangervidda'],
    conseils:
      'Plane très haut au-dessus des crêtes du Jotunheimen. Se distingue du pygargue par sa queue plus longue et son vol en V léger. Jumelles indispensables.',
  },
  {
    id: 'lagopede',
    nom: 'Lagopède alpin',
    nomLatin: 'Lagopus muta',
    emoji: '🐦',
    categorie: 'oiseau',
    rarete: 'peu_commun',
    lieux: ['Jotunheimen & Besseggen', 'Sognefjell & Lom', 'Hardangervidda'],
    conseils:
      'Maître du camouflage : plumage brun moucheté en été, invisible entre les rochers jusqu’à ce qu’il s’envole dans un grand fracas à deux mètres de toi. Classique sur Besseggen.',
  },
  {
    id: 'tetras',
    nom: 'Tétras lyre',
    nomLatin: 'Lyrurus tetrix',
    emoji: '🐦‍⬛',
    categorie: 'oiseau',
    rarete: 'rare',
    lieux: ['Telemark & Numedal', 'Valdresflye'],
    conseils:
      'Gros oiseau noir aux reflets bleutés, dans les forêts claires et les tourbières. Souvent débusqué au bord des petites routes forestières tôt le matin.',
  },
  {
    id: 'cincle',
    nom: 'Cincle plongeur',
    nomLatin: 'Cinclus cinclus',
    emoji: '🐦',
    categorie: 'oiseau',
    rarete: 'peu_commun',
    lieux: ['Hardangerfjord & Eidfjord', 'Folgefonna & Odda', 'Voss'],
    conseils:
      'L’oiseau national de la Norvège ! Petit passereau brun à plastron blanc qui plonge dans les torrents glacés. Guetter les rochers au pied de Vøringsfossen et dans la vallée de Husedalen.',
  },
  {
    id: 'plongeon',
    nom: 'Plongeon arctique',
    nomLatin: 'Gavia arctica',
    emoji: '🦆',
    categorie: 'oiseau',
    rarete: 'peu_commun',
    lieux: ['Jotunheimen & Besseggen', 'Voss', 'Valdresflye'],
    conseils:
      'Sur les lacs de montagne (Gjende, Vangsvatnet). Son cri plaintif au crépuscule est l’un des sons les plus envoûtants de Scandinavie — à écouter depuis le bivouac.',
  },
  {
    id: 'pluvier',
    nom: 'Pluvier doré',
    nomLatin: 'Pluvialis apricaria',
    emoji: '🐦',
    categorie: 'oiseau',
    rarete: 'peu_commun',
    lieux: ['Hardangervidda', 'Valdresflye'],
    conseils:
      'La voix du haut plateau : un sifflement mélancolique « tluu » qui accompagne toute traversée de la Hardangervidda. Plumage doré pailleté, se tient droit sur les buttes.',
  },
  {
    id: 'traquet',
    nom: 'Traquet motteux',
    nomLatin: 'Oenanthe oenanthe',
    emoji: '🐦',
    categorie: 'oiseau',
    rarete: 'commun',
    lieux: ['Hardangervidda', 'Sognefjell & Lom', 'Jotunheimen & Besseggen'],
    conseils:
      'Le compagnon des pierriers : il sautille de rocher en rocher devant les randonneurs en montrant son croupion blanc. Quasi garanti sur Besseggen et le Sognefjell.',
  },
  {
    id: 'huitrier',
    nom: 'Huîtrier pie',
    nomLatin: 'Haematopus ostralegus',
    emoji: '🐦',
    categorie: 'oiseau',
    rarete: 'commun',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord', 'Nærøyfjord & Flåm'],
    conseils:
      'Impossible de le rater sur les rives : noir et blanc, long bec orange vif, et un cri perçant dès qu’on approche. Niche sur les pontons et les toits au bord des fjords.',
  },
  {
    id: 'sterne',
    nom: 'Sterne arctique',
    nomLatin: 'Sterna paradisaea',
    emoji: '🕊️',
    categorie: 'oiseau',
    rarete: 'peu_commun',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord'],
    conseils:
      'La championne du monde de migration (pôle Nord ↔ pôle Sud chaque année). Vol stationnaire élégant au-dessus de l’eau avant de piquer. Attention : elle défend son nid en piqué !',
  },
  {
    id: 'corbeau',
    nom: 'Grand corbeau',
    nomLatin: 'Corvus corax',
    emoji: '🐦‍⬛',
    categorie: 'oiseau',
    rarete: 'commun',
    lieux: ['Jotunheimen & Besseggen', 'Sognefjell & Lom', 'Hardangervidda'],
    conseils:
      'Les corbeaux d’Odin planent au-dessus de tous les sommets. Croassement grave et acrobaties aériennes — souvent en duo, comme Hugin et Munin.',
  },
  {
    id: 'goeland',
    nom: 'Goéland argenté',
    nomLatin: 'Larus argentatus',
    emoji: '🕊️',
    categorie: 'oiseau',
    rarete: 'commun',
    lieux: [],
    partout: true,
    conseils:
      'Le comité d’accueil de tous les ports et ferries. Capture garantie dès Oslo — surveille quand même tes tartines sur les quais d’Aker Brygge.',
  },
  // ---- Vie aquatique ----
  {
    id: 'phoque',
    nom: 'Phoque commun',
    nomLatin: 'Phoca vitulina',
    emoji: '🦭',
    categorie: 'aquatique',
    rarete: 'peu_commun',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord', 'Nærøyfjord & Flåm'],
    conseils:
      'Guetter les têtes rondes qui émergent près des ferries et les rochers plats à marée basse. Régulièrement vu depuis la croisière du Nærøyfjord et les îles de l’Oslofjord.',
  },
  {
    id: 'marsouin',
    nom: 'Marsouin commun',
    nomLatin: 'Phocoena phocoena',
    emoji: '🐬',
    categorie: 'aquatique',
    rarete: 'rare',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord', 'Nærøyfjord & Flåm'],
    conseils:
      'Petit cétacé discret : un aileron triangulaire qui roule à la surface, sans saut. Mer calme et silence recommandés — meilleures chances depuis le ferry ou la croisière fjord.',
  },
  {
    id: 'saumon',
    nom: 'Saumon atlantique',
    nomLatin: 'Salmo salar',
    emoji: '🐟',
    categorie: 'aquatique',
    rarete: 'rare',
    lieux: ['Lærdal & Aurlandsfjellet'],
    conseils:
      'La Lærdalselva est l’une des rivières à saumons les plus mythiques du monde. Le Centre norvégien du saumon sauvage à Lærdal permet de les voir à coup sûr (fenêtre sous la rivière).',
  },
  {
    id: 'truite',
    nom: 'Truite fario',
    nomLatin: 'Salmo trutta',
    emoji: '🎣',
    categorie: 'aquatique',
    rarete: 'peu_commun',
    lieux: ['Jotunheimen & Besseggen', 'Sognefjell & Lom', 'Valdresflye'],
    conseils:
      'Le lac Gjende est célèbre pour ses truites de montagne. Guetter les gobages à la surface le soir, ou tenter la pêche (permis fiskekort en ligne ou au camping).',
  },
  {
    id: 'meduse',
    nom: 'Méduse crinière de lion',
    nomLatin: 'Cyanea capillata',
    emoji: '🪼',
    categorie: 'aquatique',
    rarete: 'peu_commun',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord', 'Nærøyfjord & Flåm'],
    conseils:
      'Grande méduse rousse qui dérive dans les fjords en été. Superbe à observer depuis un ponton — mais ne pas toucher, même échouée : ça pique fort.',
  },
  {
    id: 'crabe',
    nom: 'Crabe vert',
    nomLatin: 'Carcinus maenas',
    emoji: '🦀',
    categorie: 'aquatique',
    rarete: 'commun',
    lieux: ['Oslo & Oslofjord', 'Hardangerfjord & Eidfjord'],
    conseils:
      'Sous les pierres au bord du fjord, à marée basse. La pêche au crabe avec un bout de ficelle et une moule est un sport national norvégien — à tenter depuis un ponton.',
  },
  {
    id: 'grenouille',
    nom: 'Grenouille rousse',
    nomLatin: 'Rana temporaria',
    emoji: '🐸',
    categorie: 'aquatique',
    rarete: 'commun',
    lieux: ['Hardangervidda', 'Telemark & Numedal', 'Valdresflye'],
    conseils:
      'Étonnamment présente jusqu’à 1 400 m d’altitude, dans les mares et tourbières des plateaux. Regarder dans les flaques le long des sentiers après la pluie.',
  },
]
