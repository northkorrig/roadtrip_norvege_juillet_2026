import type { Depense, Etape, Note, Poi, Reservation, Tache } from '../types/db'

// UUIDs fixes, identiques à scripts/seed.sql, pour que le mode local (sans
// Supabase) et le mode Supabase partagent les mêmes références etape_id/poi_id.
const eid = (n: number): string => `00000000-0000-4000-a000-${String(n).padStart(12, '0')}`
const pid = (n: number): string => `00000000-0000-4000-b000-${String(n).padStart(12, '0')}`
const nid = (n: number): string => `00000000-0000-4000-c000-${String(n).padStart(12, '0')}`
const tid = (n: number): string => `00000000-0000-4000-d000-${String(n).padStart(12, '0')}`
const did = (n: number): string => `00000000-0000-4000-e000-${String(n).padStart(12, '0')}`

const T0 = '2026-06-01T00:00:00.000Z'

export const SEED_ETAPES: Etape[] = [
  {
    id: eid(1), nom: 'Oslo — arrivée & prise du van', date: '2026-07-14', ordre: 0,
    lat: 59.8983, lng: 10.7689, km_depuis_precedent: 0, duree_min: 0, nuit_type: 'camping',
    note: 'Atterrissage 12h35 · navette gratuite Arctic Campers (entrée 7, Gardermoen).\n- Prise du van VW Transporter 4Motion\n- Aker Brygge, presqu’île de Bygdøy, toits de l’Opéra\n- Nuit : camping Ekeberg (vue sur la ville) ou bivouac collines est',
    created_at: T0,
  },
  {
    id: eid(2), nom: 'Oslo → Gaustatoppen par le Numedal', date: '2026-07-15', ordre: 1,
    lat: 59.8712, lng: 8.7041, km_depuis_precedent: 190, duree_min: 165, nuit_type: 'parking',
    note: '- RV40/RV36 par la vallée du Numedal\n- Arrêt à Kongsberg, ancienne ville minière (argent)\n- Montée au parking de Gaustatoppen (alt. 860 m)\n- Nuit : parking du départ de la rando',
    created_at: T0,
  },
  {
    id: eid(3), nom: 'Gaustatoppen & traversée de l’Hardangervidda', date: '2026-07-16', ordre: 2,
    lat: 60.4014, lng: 7.54, km_depuis_precedent: 80, duree_min: 90, nuit_type: 'bivouac',
    note: '- Randonnée Gaustatoppen : 7 km A/R, +400 m, 3-4 h — vue à 360° (1/6 de la Norvège par temps clair)\n- Traversée du plateau de l’Hardangervidda : rennes, lacs, toundra\n- Nuit : bivouac au bord d’un lac sur le plateau',
    created_at: T0,
  },
  {
    id: eid(4), nom: 'Vøringsfossen → Eidfjord', date: '2026-07-17', ordre: 3,
    lat: 60.4666, lng: 7.0741, km_depuis_precedent: 60, duree_min: 90, nuit_type: 'bivouac',
    note: '- Cascade de Vøringsfossen (182 m), belvédères + passerelle\n- Descente de la Måbødalen (lacets spectaculaires)\n- Nuit : bivouac au bord du fjord près d’Eidfjord',
    created_at: T0,
  },
  {
    id: eid(5), nom: 'Rive du Hardangerfjord → Odda', date: '2026-07-18', ordre: 4,
    lat: 60.0689, lng: 6.545, km_depuis_precedent: 70, duree_min: 120, nuit_type: 'camping',
    note: '- Kinsarvik et ses cascades (vallée de Husedalen)\n- Lofthus : vergers de cerisiers au-dessus du fjord\n- Ullensvang, village typique\n- Nuit : camping ou bivouac à Odda',
    created_at: T0,
  },
  {
    id: eid(6), nom: 'Glacier Folgefonna → ferry → Voss', date: '2026-07-19', ordre: 5,
    lat: 60.6282, lng: 6.4155, km_depuis_precedent: 120, duree_min: 150, nuit_type: 'bivouac',
    note: '- Glacier Folgefonna : point de vue libre ou tour guidé crampons\n- Ferry Jondal → Tørvikbygd (20 min, sans réservation)\n- Nuit : bivouac au lac Vangsvatnet ou camping à Voss',
    created_at: T0,
  },
  {
    id: eid(7), nom: 'Nærøyfjord → Flåm', date: '2026-07-20', ordre: 6,
    lat: 60.8629, lng: 7.1183, km_depuis_precedent: 60, duree_min: 90, nuit_type: 'camping',
    note: '- Croisière sur le Nærøyfjord, départ Gudvangen 9h00 — ⚠️ RÉSERVER sur norwaysbest.com\n- Route E16 Voss → Gudvangen\n- Nuit : camping de Flåm (le van reste posé J7 + J8)',
    created_at: T0,
  },
  {
    id: eid(8), nom: 'Flåmsbana, Stegastein & Borgund', date: '2026-07-21', ordre: 7,
    lat: 61.0997, lng: 7.4756, km_depuis_precedent: 90, duree_min: 120, nuit_type: 'bivouac',
    note: '- Flåmsbana, train panoramique 9h15 — ⚠️ RÉSERVER sur flamsbana.no\n- Stegastein : plateforme suspendue au-dessus de l’Aurlandsfjord\n- Borgund stavkirke, église en bois debout du XIIe siècle\n- Nuit : bivouac dans la vallée de Lærdal',
    created_at: T0,
  },
  {
    id: eid(9), nom: 'Sognefjellsvegen → Bøverdalen', date: '2026-07-22', ordre: 8,
    lat: 61.6333, lng: 8.35, km_depuis_precedent: 160, duree_min: 180, nuit_type: 'parking',
    note: '- RV55 Sognefjellsvegen : plus haute route de Norvège (1 434 m), paysage lunaire\n- Lom stavkirke + boulangerie culte\n- Nuit : parking Juvasshytta ou Spiterstulen',
    created_at: T0,
  },
  {
    id: eid(10), nom: 'Cap sur Gjendesheim', date: '2026-07-23', ordre: 9,
    lat: 61.4833, lng: 8.85, km_depuis_precedent: 80, duree_min: 90, nuit_type: 'parking',
    note: '- Reconnaissance de l’embarcadère du lac Gjende — ⚠️ RÉSERVER le bateau sur gjende.no (à faire en juin)\n- Nuit : parking de Gjendesheim — arriver tôt, départ bateau 7h30 le lendemain',
    created_at: T0,
  },
  {
    id: eid(11), nom: 'Besseggen Ridge — journée rando', date: '2026-07-24', ordre: 10,
    lat: 61.4833, lng: 8.85, km_depuis_precedent: 0, duree_min: 0, nuit_type: 'parking',
    note: '- Bateau Gjendesheim → Memurubu à 7h30\n- Besseggen : 15 km, +800 m, 6-7 h, niveau intermédiaire\n- Crête entre le lac Gjende (émeraude) et le Bessvatnet (bleu profond)\n- Jour de repli possible le 25 si mauvais temps',
    created_at: T0,
  },
  {
    id: eid(12), nom: 'Valdresflye → retour Oslo', date: '2026-07-25', ordre: 11,
    lat: 59.8983, lng: 10.7689, km_depuis_precedent: 250, duree_min: 210, nuit_type: 'camping',
    note: '- RV51 Valdresflye : plateau à 1 389 m, rennes sauvages\n- Descente du Hallingdal, arrivée à Oslo le soir\n- Nuit : camping Ekeberg ou parking Bygdøy',
    created_at: T0,
  },
  {
    id: eid(13), nom: 'Oslo — restitution & vol retour', date: '2026-07-26', ordre: 12,
    lat: 60.1939, lng: 11.1004, km_depuis_precedent: 50, duree_min: 45, nuit_type: null,
    note: '- Restitution du van Arctic Campers (navette gratuite, entrée 7 Gardermoen)\n- Temps libre à Oslo selon l’heure\n- Vol retour 18h30 → CDG',
    created_at: T0,
  },
]

export const SEED_POIS: Poi[] = [
  { id: pid(1), nom: 'Oslo centre', categorie: 'village', lat: 59.9139, lng: 10.7522, jour: '2026-07-14', etape_id: eid(1), ordre: 0, note: 'Aker Brygge, Bygdøy, Opéra — premier soir norvégien.', created_at: T0 },
  { id: pid(2), nom: 'Kongsberg', categorie: 'village', lat: 59.6727, lng: 9.6503, jour: '2026-07-15', etape_id: eid(2), ordre: 1, note: 'Ancienne ville minière (argent), pause sur la route du Telemark.', created_at: T0 },
  { id: pid(3), nom: 'Gaustatoppen', categorie: 'randonnee', lat: 59.85, lng: 8.6583, jour: '2026-07-16', etape_id: eid(3), ordre: 2, note: '7 km A/R, +400 m, 3-4 h. Vue sur 1/6 de la Norvège par temps clair.', created_at: T0 },
  { id: pid(4), nom: 'Vøringsfossen', categorie: 'cascade', lat: 60.4108, lng: 7.21, jour: '2026-07-17', etape_id: eid(4), ordre: 3, note: 'Chute de 182 m, belvédères + passerelle au-dessus de la gorge.', created_at: T0 },
  { id: pid(5), nom: 'Eidfjord', categorie: 'village', lat: 60.4666, lng: 7.0741, jour: '2026-07-17', etape_id: eid(4), ordre: 4, note: 'Village au fond du Hardangerfjord. Épicerie + plein d’eau.', created_at: T0 },
  { id: pid(6), nom: 'Kinsarvik', categorie: 'village', lat: 60.3753, lng: 6.7261, jour: '2026-07-18', etape_id: eid(5), ordre: 5, note: 'Cascades de la vallée de Husedalen à proximité.', created_at: T0 },
  { id: pid(7), nom: 'Lofthus', categorie: 'village', lat: 60.3333, lng: 6.65, jour: '2026-07-18', etape_id: eid(5), ordre: 6, note: 'Vergers de cerisiers suspendus au-dessus du fjord.', created_at: T0 },
  { id: pid(8), nom: 'Ullensvang', categorie: 'village', lat: 60.3167, lng: 6.65, jour: '2026-07-18', etape_id: eid(5), ordre: 7, note: 'Village typique de la rive du Hardangerfjord.', created_at: T0 },
  { id: pid(9), nom: 'Odda', categorie: 'village', lat: 60.0689, lng: 6.545, jour: '2026-07-18', etape_id: eid(5), ordre: 8, note: 'Base pour Folgefonna (et Trolltunga). Ravitaillement.', created_at: T0 },
  { id: pid(10), nom: 'Glacier Folgefonna', categorie: 'glacier', lat: 60.05, lng: 6.3833, jour: '2026-07-19', etape_id: eid(6), ordre: 9, note: '3e plus grand glacier de Norvège. Tour crampons possible (réservation conseillée).', created_at: T0 },
  { id: pid(11), nom: 'Jondal — ferry', categorie: 'ferry', lat: 60.1167, lng: 6.1167, jour: '2026-07-19', etape_id: eid(6), ordre: 10, note: 'Embarcadère du ferry vers Tørvikbygd : ~20 min, sans réservation.', created_at: T0 },
  { id: pid(12), nom: 'Tørvikbygd — ferry', categorie: 'ferry', lat: 60.4167, lng: 5.9833, jour: '2026-07-19', etape_id: eid(6), ordre: 11, note: 'Débarcadère côté nord du Hardangerfjord.', created_at: T0 },
  { id: pid(13), nom: 'Voss', categorie: 'village', lat: 60.6282, lng: 6.4155, jour: '2026-07-19', etape_id: eid(6), ordre: 12, note: 'Capitale outdoor de la Norvège. Lac Vangsvatnet pour la nuit.', created_at: T0 },
  { id: pid(14), nom: 'Gudvangen', categorie: 'village', lat: 60.8747, lng: 6.8282, jour: '2026-07-20', etape_id: eid(7), ordre: 13, note: 'Départ de la croisière Nærøyfjord, village viking de Njardarheimr.', created_at: T0 },
  { id: pid(15), nom: 'Croisière Nærøyfjord', categorie: 'activite', lat: 60.9333, lng: 6.95, jour: '2026-07-20', etape_id: eid(7), ordre: 14, note: '⚠️ RÉSERVER sur [norwaysbest.com](https://www.norwaysbest.com) — départ 9h00. Fjord classé UNESCO.', created_at: T0 },
  { id: pid(16), nom: 'Flåm', categorie: 'village', lat: 60.8629, lng: 7.1183, jour: '2026-07-20', etape_id: eid(7), ordre: 15, note: 'Fond de l’Aurlandsfjord. Camping pour 2 nuits.', created_at: T0 },
  { id: pid(17), nom: 'Stegastein', categorie: 'vue_panoramique', lat: 60.8667, lng: 7.15, jour: '2026-07-21', etape_id: eid(8), ordre: 16, note: 'Plateforme en porte-à-faux 650 m au-dessus de l’Aurlandsfjord (route Aurlandsfjellet).', created_at: T0 },
  { id: pid(18), nom: 'Undredal', categorie: 'village', lat: 60.9167, lng: 7.0833, jour: '2026-07-21', etape_id: eid(8), ordre: 17, note: 'Minuscule village à chèvres, plus petite stavkirke de Norvège. Fromage brun !', created_at: T0 },
  { id: pid(19), nom: 'Lærdal', categorie: 'village', lat: 61.0997, lng: 7.4756, jour: '2026-07-21', etape_id: eid(8), ordre: 18, note: 'Vieux bourg en bois (Gamle Lærdalsøyri).', created_at: T0 },
  { id: pid(20), nom: 'Borgund stavkirke', categorie: 'activite', lat: 61.0422, lng: 7.8097, jour: '2026-07-21', etape_id: eid(8), ordre: 19, note: 'Église en bois debout du XIIe siècle, la mieux conservée du pays. Patrimoine.', created_at: T0 },
  { id: pid(21), nom: 'Sognefjellsvegen (RV55)', categorie: 'vue_panoramique', lat: 61.5667, lng: 8.2667, jour: '2026-07-22', etape_id: eid(9), ordre: 20, note: 'Plus haute route de Norvège : 1 434 m. Névés, lacs turquoise, paysage lunaire.', created_at: T0 },
  { id: pid(22), nom: 'Lom', categorie: 'village', lat: 61.8394, lng: 8.5661, jour: '2026-07-22', etape_id: eid(9), ordre: 21, note: 'Stavkirke + Bakeriet i Lom (boulangerie culte).', created_at: T0 },
  { id: pid(23), nom: 'Bøverdalen', categorie: 'village', lat: 61.6333, lng: 8.35, jour: '2026-07-22', etape_id: eid(9), ordre: 22, note: 'Vallée au pied du Jotunheimen, accès Juvasshytta / Galdhøpiggen.', created_at: T0 },
  { id: pid(24), nom: 'Gjendesheim', categorie: 'village', lat: 61.4833, lng: 8.85, jour: '2026-07-23', etape_id: eid(10), ordre: 23, note: 'Embarcadère du lac Gjende, parking pour 2 nuits.', created_at: T0 },
  { id: pid(25), nom: 'Besseggen Ridge', categorie: 'randonnee', lat: 61.5, lng: 8.9167, jour: '2026-07-24', etape_id: eid(11), ordre: 24, note: '★★★ L’arête mythique : 15 km, +800 m, 6-7 h. ⚠️ RÉSERVER le bateau sur [gjende.no](https://gjende.no).', created_at: T0 },
  { id: pid(26), nom: 'Valdresflye (RV51)', categorie: 'vue_panoramique', lat: 61.3, lng: 8.9, jour: '2026-07-25', etape_id: eid(12), ordre: 25, note: 'Plateau à 1 389 m, rennes sauvages, derniers panoramas avant Oslo.', created_at: T0 },
]

export const SEED_NOTES: Note[] = [
  {
    id: nid(1), titre: 'Ferries & traversées', date: '2026-07-19', poi_id: pid(11),
    contenu: 'Jondal → Tørvikbygd : ~20 min, départs réguliers en journée, **sans réservation**.\n- Paiement automatique par plaque (AutoPASS ferry) ou CB\n- Arriver ~15 min avant\n- File pleine ? La suivante part vite',
    created_at: T0, updated_at: T0,
  },
  {
    id: nid(2), titre: 'Bivouac & allemannsretten', date: null, poi_id: null,
    contenu: 'Le droit d’accès à la nature (*allemannsretten*) autorise le bivouac :\n- À **150 m minimum** des habitations\n- 2 nuits max au même endroit\n- **Feux interdits** du 15/4 au 15/9 près des forêts\n- Aucune trace : tout remporter\n- Vidanges uniquement aux stations équipées',
    created_at: T0, updated_at: T0,
  },
  {
    id: nid(3), titre: 'Urgences & numéros utiles', date: null, poi_id: null,
    contenu: '- **112** police · **113** ambulance · **110** pompiers\n- Secours en montagne : via le 112\n- Météo de référence : [yr.no](https://www.yr.no)\n- État des routes : [175.no](https://www.175.no)\n- Arctic Campers : numéro sur le contrat de location',
    created_at: T0, updated_at: T0,
  },
  {
    id: nid(4), titre: 'Besseggen — plan de journée', date: '2026-07-24', poi_id: pid(25),
    contenu: '- Bateau **7h30** Gjendesheim → Memurubu (réservé ?)\n- Sens recommandé : Memurubu → Gjendesheim\n- 1,5 L d’eau/pers minimum, coupe-vent, bâtons\n- Fenêtre météo : vérifier la veille sur yr.no — repli possible le 25',
    created_at: T0, updated_at: T0,
  },
  {
    id: nid(5), titre: 'Van & conduite en Norvège', date: null, poi_id: null,
    contenu: '- Limites : 80 km/h hors agglomération, radars fréquents\n- Péages : flat fee Arctic Campers (103 €) — rien à faire sur place\n- Gasoil ~1,60 €/L : faire le plein avant les zones isolées\n- Ferries : monter au moteur, frein à main, rester près du van',
    created_at: T0, updated_at: T0,
  },
]

export const SEED_TACHES: Tache[] = [
  { id: tid(1), texte: 'Duvets + kit literie (fournis Arctic Campers — vérifier)', categorie: 'packing', completee: false, ordre: 0, created_at: T0 },
  { id: tid(2), texte: 'Vêtements de pluie (veste + surpantalon)', categorie: 'packing', completee: false, ordre: 1, created_at: T0 },
  { id: tid(3), texte: 'Couches chaudes : polaire + doudoune (soirées à 5-10 °C)', categorie: 'packing', completee: false, ordre: 2, created_at: T0 },
  { id: tid(4), texte: 'Chaussures de rando montantes (Besseggen)', categorie: 'packing', completee: false, ordre: 3, created_at: T0 },
  { id: tid(5), texte: 'Bâtons de marche', categorie: 'packing', completee: false, ordre: 4, created_at: T0 },
  { id: tid(6), texte: 'Maillot de bain + serviette microfibre', categorie: 'packing', completee: false, ordre: 5, created_at: T0 },
  { id: tid(7), texte: 'Batterie externe + câble allume-cigare USB', categorie: 'packing', completee: false, ordre: 6, created_at: T0 },
  { id: tid(8), texte: 'Cartes hors-ligne (Organic Maps / Google Maps offline)', categorie: 'packing', completee: false, ordre: 7, created_at: T0 },
  { id: tid(9), texte: 'Crème solaire + lunettes (≈ 19 h de jour en juillet)', categorie: 'packing', completee: false, ordre: 8, created_at: T0 },
  { id: tid(10), texte: 'Anti-moustiques (Hardangervidda)', categorie: 'packing', completee: false, ordre: 9, created_at: T0 },
  { id: tid(11), texte: 'Thermos + gourdes 1,5 L', categorie: 'packing', completee: false, ordre: 10, created_at: T0 },
  { id: tid(12), texte: 'Passeports / CNI valides ×2', categorie: 'avant_depart', completee: false, ordre: 11, created_at: T0 },
  { id: tid(13), texte: 'Permis de conduire ×2 (les deux conducteurs au contrat)', categorie: 'avant_depart', completee: false, ordre: 12, created_at: T0 },
  { id: tid(14), texte: 'Plafond CB relevé (caution van)', categorie: 'avant_depart', completee: false, ordre: 13, created_at: T0 },
  { id: tid(15), texte: 'Carte européenne d’assurance maladie ×2', categorie: 'avant_depart', completee: false, ordre: 14, created_at: T0 },
  { id: tid(16), texte: 'Check-in vols + cartes d’embarquement hors-ligne', categorie: 'avant_depart', completee: false, ordre: 15, created_at: T0 },
  { id: tid(17), texte: 'Imprimer contrat Arctic Campers + bons de réservation', categorie: 'avant_depart', completee: false, ordre: 16, created_at: T0 },
  { id: tid(18), texte: 'Exporter le roadbook PDF sur les téléphones', categorie: 'avant_depart', completee: false, ordre: 17, created_at: T0 },
]

export const SEED_DEPENSES: Depense[] = [
  { id: did(1), label: 'Train Rennes → Paris CDG (×2)', montant: 150, categorie: 'transport', date: '2026-07-13', personne: 'Commun', note: null, etape_id: null, created_at: T0 },
  { id: did(2), label: 'Hôtel Paris — nuit du 13 juillet', montant: 150, categorie: 'hebergement', date: '2026-07-13', personne: 'Commun', note: null, etape_id: null, created_at: T0 },
  { id: did(3), label: 'Vols CDG ↔ Oslo A/R (×2)', montant: 600, categorie: 'transport', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(4), label: 'Location van 12 jours — Arctic Campers', montant: 2078, categorie: 'van', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(5), label: 'Péages — flat fee Arctic Campers', montant: 103, categorie: 'van', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(6), label: 'Frais de service van', montant: 55, categorie: 'van', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(7), label: 'Assurance MAX CV', montant: 284, categorie: 'van', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(8), label: 'Kit literie', montant: 59, categorie: 'van', date: '2026-07-14', personne: 'Commun', note: null, etape_id: eid(1), created_at: T0 },
  { id: did(9), label: 'Sacs de couchage', montant: 42, categorie: 'divers', date: '2026-07-01', personne: 'Commun', note: 'Achat avant départ', etape_id: null, created_at: T0 },
  { id: did(10), label: 'Carburant (~1 500 km à 9 L/100, 1,60 €/L)', montant: 216, categorie: 'carburant', date: '2026-07-20', personne: 'Commun', note: 'Estimation à répartir sur le voyage', etape_id: null, created_at: T0 },
  { id: did(11), label: 'Croisière Nærøyfjord (2 pers)', montant: 70, categorie: 'activites', date: '2026-07-20', personne: 'Commun', note: null, etape_id: eid(7), created_at: T0 },
  { id: did(12), label: 'Flåmsbana (2 pers)', montant: 70, categorie: 'activites', date: '2026-07-21', personne: 'Commun', note: null, etape_id: eid(8), created_at: T0 },
  { id: did(13), label: 'Bateau Gjende (2 pers)', montant: 40, categorie: 'activites', date: '2026-07-24', personne: 'Commun', note: null, etape_id: eid(11), created_at: T0 },
]

export const SEED_RESERVATIONS: Reservation[] = [
  { id: 'r-naeroyfjord', label: 'Croisière Nærøyfjord — Gudvangen 9h00', statut: 'a_faire', url: 'https://www.norwaysbest.com', echeance: '2026-07-01', note: '2 adultes, traversée Gudvangen → Flåm ou A/R' },
  { id: 'r-flamsbana', label: 'Flåmsbana — train panoramique 9h15', statut: 'a_faire', url: 'https://www.flamsbana.no', echeance: '2026-07-01', note: 'Aller simple + retour à vélo possible' },
  { id: 'r-gjende', label: 'Bateau Gjende 7h30 (Besseggen)', statut: 'a_faire', url: 'https://gjende.no', echeance: '2026-06-30', note: '⚠️ Réserver en juin — places limitées' },
  { id: 'r-camping-flam', label: 'Camping Flåm (2 nuits, 20-21 juillet)', statut: 'a_faire', url: 'https://www.flaacamping.no', echeance: null, note: 'Facultatif mais juillet = souvent complet' },
]
