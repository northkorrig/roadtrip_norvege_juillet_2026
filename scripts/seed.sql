-- ============================================================
-- Seed du voyage « Norvège — Road Trip Fjords & Montagnes »
-- À exécuter APRÈS supabase_setup.sql (SQL Editor du Dashboard).
-- ⚠️  Ce script VIDE les 5 tables avant de les re-remplir.
-- Les UUIDs sont fixes et identiques à src/lib/seedData.ts
-- (mode démo localStorage), pour des références cohérentes.
-- ============================================================

truncate public.notes, public.pois, public.etapes, public.taches, public.depenses cascade;

-- ------------------------------------------------------------
-- Étapes (13 jours, Oslo → fjords → Jotunheimen → Oslo)
-- ------------------------------------------------------------

insert into public.etapes (id, nom, date, ordre, lat, lng, km_depuis_precedent, duree_min, nuit_type, note, created_at) values
('00000000-0000-4000-a000-000000000001', 'Oslo — arrivée & prise du van', '2026-07-14', 0, 59.8983, 10.7689, 0, 0, 'camping',
 E'Atterrissage 12h35 · navette gratuite Arctic Campers (entrée 7, Gardermoen).\n- Prise du van VW Transporter 4Motion\n- Aker Brygge, presqu’île de Bygdøy, toits de l’Opéra\n- Nuit : camping Ekeberg (vue sur la ville) ou bivouac collines est', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000002', 'Oslo → Gaustatoppen par le Numedal', '2026-07-15', 1, 59.8712, 8.7041, 190, 165, 'parking',
 E'- RV40/RV36 par la vallée du Numedal\n- Arrêt à Kongsberg, ancienne ville minière (argent)\n- Montée au parking de Gaustatoppen (alt. 860 m)\n- Nuit : parking du départ de la rando', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000003', 'Gaustatoppen & traversée de l’Hardangervidda', '2026-07-16', 2, 60.4014, 7.54, 80, 90, 'bivouac',
 E'- Randonnée Gaustatoppen : 7 km A/R, +400 m, 3-4 h — vue à 360° (1/6 de la Norvège par temps clair)\n- Traversée du plateau de l’Hardangervidda : rennes, lacs, toundra\n- Nuit : bivouac au bord d’un lac sur le plateau', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000004', 'Vøringsfossen → Eidfjord', '2026-07-17', 3, 60.4666, 7.0741, 60, 90, 'bivouac',
 E'- Cascade de Vøringsfossen (182 m), belvédères + passerelle\n- Descente de la Måbødalen (lacets spectaculaires)\n- Nuit : bivouac au bord du fjord près d’Eidfjord', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000005', 'Rive du Hardangerfjord → Odda', '2026-07-18', 4, 60.0689, 6.545, 70, 120, 'camping',
 E'- Kinsarvik et ses cascades (vallée de Husedalen)\n- Lofthus : vergers de cerisiers au-dessus du fjord\n- Ullensvang, village typique\n- Nuit : camping ou bivouac à Odda', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000006', 'Glacier Folgefonna → ferry → Voss', '2026-07-19', 5, 60.6282, 6.4155, 120, 150, 'bivouac',
 E'- Glacier Folgefonna : point de vue libre ou tour guidé crampons\n- Ferry Jondal → Tørvikbygd (20 min, sans réservation)\n- Nuit : bivouac au lac Vangsvatnet ou camping à Voss', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000007', 'Nærøyfjord → Flåm', '2026-07-20', 6, 60.8629, 7.1183, 60, 90, 'camping',
 E'- Croisière sur le Nærøyfjord, départ Gudvangen 9h00 — ⚠️ RÉSERVER sur norwaysbest.com\n- Route E16 Voss → Gudvangen\n- Nuit : camping de Flåm (le van reste posé J7 + J8)', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000008', 'Flåmsbana, Stegastein & Borgund', '2026-07-21', 7, 61.0997, 7.4756, 90, 120, 'bivouac',
 E'- Flåmsbana, train panoramique 9h15 — ⚠️ RÉSERVER sur flamsbana.no\n- Stegastein : plateforme suspendue au-dessus de l’Aurlandsfjord\n- Borgund stavkirke, église en bois debout du XIIe siècle\n- Nuit : bivouac dans la vallée de Lærdal', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000009', 'Sognefjellsvegen → Bøverdalen', '2026-07-22', 8, 61.6333, 8.35, 160, 180, 'parking',
 E'- RV55 Sognefjellsvegen : plus haute route de Norvège (1 434 m), paysage lunaire\n- Lom stavkirke + boulangerie culte\n- Nuit : parking Juvasshytta ou Spiterstulen', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000010', 'Cap sur Gjendesheim', '2026-07-23', 9, 61.4833, 8.85, 80, 90, 'parking',
 E'- Reconnaissance de l’embarcadère du lac Gjende — ⚠️ RÉSERVER le bateau sur gjende.no (à faire en juin)\n- Nuit : parking de Gjendesheim — arriver tôt, départ bateau 7h30 le lendemain', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000011', 'Besseggen Ridge — journée rando', '2026-07-24', 10, 61.4833, 8.85, 0, 0, 'parking',
 E'- Bateau Gjendesheim → Memurubu à 7h30\n- Besseggen : 15 km, +800 m, 6-7 h, niveau intermédiaire\n- Crête entre le lac Gjende (émeraude) et le Bessvatnet (bleu profond)\n- Jour de repli possible le 25 si mauvais temps', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000012', 'Valdresflye → retour Oslo', '2026-07-25', 11, 59.8983, 10.7689, 250, 210, 'camping',
 E'- RV51 Valdresflye : plateau à 1 389 m, rennes sauvages\n- Descente du Hallingdal, arrivée à Oslo le soir\n- Nuit : camping Ekeberg ou parking Bygdøy', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-a000-000000000013', 'Oslo — restitution & vol retour', '2026-07-26', 12, 60.1939, 11.1004, 50, 45, null,
 E'- Restitution du van Arctic Campers (navette gratuite, entrée 7 Gardermoen)\n- Temps libre à Oslo selon l’heure\n- Vol retour 18h30 → CDG', '2026-06-01T00:00:00Z');

-- ------------------------------------------------------------
-- POIs (26 points avec coordonnées GPS)
-- ------------------------------------------------------------

insert into public.pois (id, nom, categorie, lat, lng, note, ordre, jour, etape_id, created_at) values
('00000000-0000-4000-b000-000000000001', 'Oslo centre', 'village', 59.9139, 10.7522, 'Aker Brygge, Bygdøy, Opéra — premier soir norvégien.', 0, '2026-07-14', '00000000-0000-4000-a000-000000000001', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000002', 'Kongsberg', 'village', 59.6727, 9.6503, 'Ancienne ville minière (argent), pause sur la route du Telemark.', 1, '2026-07-15', '00000000-0000-4000-a000-000000000002', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000003', 'Gaustatoppen', 'randonnee', 59.85, 8.6583, '7 km A/R, +400 m, 3-4 h. Vue sur 1/6 de la Norvège par temps clair.', 2, '2026-07-16', '00000000-0000-4000-a000-000000000003', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000004', 'Vøringsfossen', 'cascade', 60.4108, 7.21, 'Chute de 182 m, belvédères + passerelle au-dessus de la gorge.', 3, '2026-07-17', '00000000-0000-4000-a000-000000000004', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000005', 'Eidfjord', 'village', 60.4666, 7.0741, E'Village au fond du Hardangerfjord. Épicerie + plein d’eau.', 4, '2026-07-17', '00000000-0000-4000-a000-000000000004', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000006', 'Kinsarvik', 'village', 60.3753, 6.7261, 'Cascades de la vallée de Husedalen à proximité.', 5, '2026-07-18', '00000000-0000-4000-a000-000000000005', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000007', 'Lofthus', 'village', 60.3333, 6.65, 'Vergers de cerisiers suspendus au-dessus du fjord.', 6, '2026-07-18', '00000000-0000-4000-a000-000000000005', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000008', 'Ullensvang', 'village', 60.3167, 6.65, 'Village typique de la rive du Hardangerfjord.', 7, '2026-07-18', '00000000-0000-4000-a000-000000000005', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000009', 'Odda', 'village', 60.0689, 6.545, 'Base pour Folgefonna (et Trolltunga). Ravitaillement.', 8, '2026-07-18', '00000000-0000-4000-a000-000000000005', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000010', 'Glacier Folgefonna', 'glacier', 60.05, 6.3833, '3e plus grand glacier de Norvège. Tour crampons possible (réservation conseillée).', 9, '2026-07-19', '00000000-0000-4000-a000-000000000006', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000011', 'Jondal — ferry', 'ferry', 60.1167, 6.1167, 'Embarcadère du ferry vers Tørvikbygd : ~20 min, sans réservation.', 10, '2026-07-19', '00000000-0000-4000-a000-000000000006', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000012', 'Tørvikbygd — ferry', 'ferry', 60.4167, 5.9833, 'Débarcadère côté nord du Hardangerfjord.', 11, '2026-07-19', '00000000-0000-4000-a000-000000000006', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000013', 'Voss', 'village', 60.6282, 6.4155, 'Capitale outdoor de la Norvège. Lac Vangsvatnet pour la nuit.', 12, '2026-07-19', '00000000-0000-4000-a000-000000000006', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000014', 'Gudvangen', 'village', 60.8747, 6.8282, 'Départ de la croisière Nærøyfjord, village viking de Njardarheimr.', 13, '2026-07-20', '00000000-0000-4000-a000-000000000007', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000015', 'Croisière Nærøyfjord', 'activite', 60.9333, 6.95, '⚠️ RÉSERVER sur [norwaysbest.com](https://www.norwaysbest.com) — départ 9h00. Fjord classé UNESCO.', 14, '2026-07-20', '00000000-0000-4000-a000-000000000007', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000016', 'Flåm', 'village', 60.8629, 7.1183, E'Fond de l’Aurlandsfjord. Camping pour 2 nuits.', 15, '2026-07-20', '00000000-0000-4000-a000-000000000007', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000017', 'Stegastein', 'vue_panoramique', 60.8667, 7.15, E'Plateforme en porte-à-faux 650 m au-dessus de l’Aurlandsfjord (route Aurlandsfjellet).', 16, '2026-07-21', '00000000-0000-4000-a000-000000000008', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000018', 'Undredal', 'village', 60.9167, 7.0833, 'Minuscule village à chèvres, plus petite stavkirke de Norvège. Fromage brun !', 17, '2026-07-21', '00000000-0000-4000-a000-000000000008', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000019', 'Lærdal', 'village', 61.0997, 7.4756, 'Vieux bourg en bois (Gamle Lærdalsøyri).', 18, '2026-07-21', '00000000-0000-4000-a000-000000000008', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000020', 'Borgund stavkirke', 'activite', 61.0422, 7.8097, 'Église en bois debout du XIIe siècle, la mieux conservée du pays. Patrimoine.', 19, '2026-07-21', '00000000-0000-4000-a000-000000000008', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000021', 'Sognefjellsvegen (RV55)', 'vue_panoramique', 61.5667, 8.2667, 'Plus haute route de Norvège : 1 434 m. Névés, lacs turquoise, paysage lunaire.', 20, '2026-07-22', '00000000-0000-4000-a000-000000000009', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000022', 'Lom', 'village', 61.8394, 8.5661, 'Stavkirke + Bakeriet i Lom (boulangerie culte).', 21, '2026-07-22', '00000000-0000-4000-a000-000000000009', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000023', 'Bøverdalen', 'village', 61.6333, 8.35, 'Vallée au pied du Jotunheimen, accès Juvasshytta / Galdhøpiggen.', 22, '2026-07-22', '00000000-0000-4000-a000-000000000009', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000024', 'Gjendesheim', 'village', 61.4833, 8.85, 'Embarcadère du lac Gjende, parking pour 2 nuits.', 23, '2026-07-23', '00000000-0000-4000-a000-000000000010', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000025', 'Besseggen Ridge', 'randonnee', 61.5, 8.9167, E'★★★ L’arête mythique : 15 km, +800 m, 6-7 h. ⚠️ RÉSERVER le bateau sur [gjende.no](https://gjende.no).', 24, '2026-07-24', '00000000-0000-4000-a000-000000000011', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-b000-000000000026', 'Valdresflye (RV51)', 'vue_panoramique', 61.3, 8.9, 'Plateau à 1 389 m, rennes sauvages, derniers panoramas avant Oslo.', 25, '2026-07-25', '00000000-0000-4000-a000-000000000012', '2026-06-01T00:00:00Z');

-- ------------------------------------------------------------
-- Notes
-- ------------------------------------------------------------

insert into public.notes (id, titre, contenu, date, poi_id, created_at, updated_at) values
('00000000-0000-4000-c000-000000000001', 'Ferries & traversées',
 E'Jondal → Tørvikbygd : ~20 min, départs réguliers en journée, **sans réservation**.\n- Paiement automatique par plaque (AutoPASS ferry) ou CB\n- Arriver ~15 min avant\n- File pleine ? La suivante part vite',
 '2026-07-19', '00000000-0000-4000-b000-000000000011', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-c000-000000000002', 'Bivouac & allemannsretten',
 E'Le droit d’accès à la nature (*allemannsretten*) autorise le bivouac :\n- À **150 m minimum** des habitations\n- 2 nuits max au même endroit\n- **Feux interdits** du 15/4 au 15/9 près des forêts\n- Aucune trace : tout remporter\n- Vidanges uniquement aux stations équipées',
 null, null, '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-c000-000000000003', 'Urgences & numéros utiles',
 E'- **112** police · **113** ambulance · **110** pompiers\n- Secours en montagne : via le 112\n- Météo de référence : [yr.no](https://www.yr.no)\n- État des routes : [175.no](https://www.175.no)\n- Arctic Campers : numéro sur le contrat de location',
 null, null, '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-c000-000000000004', 'Besseggen — plan de journée',
 E'- Bateau **7h30** Gjendesheim → Memurubu (réservé ?)\n- Sens recommandé : Memurubu → Gjendesheim\n- 1,5 L d’eau/pers minimum, coupe-vent, bâtons\n- Fenêtre météo : vérifier la veille sur yr.no — repli possible le 25',
 '2026-07-24', '00000000-0000-4000-b000-000000000025', '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-c000-000000000005', 'Van & conduite en Norvège',
 E'- Limites : 80 km/h hors agglomération, radars fréquents\n- Péages : flat fee Arctic Campers (103 €) — rien à faire sur place\n- Gasoil ~1,60 €/L : faire le plein avant les zones isolées\n- Ferries : monter au moteur, frein à main, rester près du van',
 null, null, '2026-06-01T00:00:00Z', '2026-06-01T00:00:00Z');

-- ------------------------------------------------------------
-- Tâches (packing + avant-départ)
-- ------------------------------------------------------------

insert into public.taches (id, texte, categorie, completee, ordre, created_at) values
('00000000-0000-4000-d000-000000000001', 'Duvets + kit literie (fournis Arctic Campers — vérifier)', 'packing', false, 0, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000002', 'Vêtements de pluie (veste + surpantalon)', 'packing', false, 1, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000003', 'Couches chaudes : polaire + doudoune (soirées à 5-10 °C)', 'packing', false, 2, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000004', 'Chaussures de rando montantes (Besseggen)', 'packing', false, 3, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000005', 'Bâtons de marche', 'packing', false, 4, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000006', 'Maillot de bain + serviette microfibre', 'packing', false, 5, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000007', 'Batterie externe + câble allume-cigare USB', 'packing', false, 6, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000008', 'Cartes hors-ligne (Organic Maps / Google Maps offline)', 'packing', false, 7, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000009', 'Crème solaire + lunettes (≈ 19 h de jour en juillet)', 'packing', false, 8, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000010', 'Anti-moustiques (Hardangervidda)', 'packing', false, 9, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000011', 'Thermos + gourdes 1,5 L', 'packing', false, 10, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000012', 'Passeports / CNI valides ×2', 'avant_depart', false, 11, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000013', 'Permis de conduire ×2 (les deux conducteurs au contrat)', 'avant_depart', false, 12, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000014', 'Plafond CB relevé (caution van)', 'avant_depart', false, 13, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000015', E'Carte européenne d’assurance maladie ×2', 'avant_depart', false, 14, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000016', E'Check-in vols + cartes d’embarquement hors-ligne', 'avant_depart', false, 15, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000017', 'Imprimer contrat Arctic Campers + bons de réservation', 'avant_depart', false, 16, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-d000-000000000018', 'Exporter le roadbook PDF sur les téléphones', 'avant_depart', false, 17, '2026-06-01T00:00:00Z');

-- ------------------------------------------------------------
-- Dépenses (budget initial estimé : 3 917 €)
-- ------------------------------------------------------------

insert into public.depenses (id, label, montant, categorie, date, personne, note, created_at) values
('00000000-0000-4000-e000-000000000001', 'Train Rennes → Paris CDG (×2)', 150, 'transport', '2026-07-13', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000002', 'Hôtel Paris — nuit du 13 juillet', 150, 'hebergement', '2026-07-13', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000003', 'Vols CDG ↔ Oslo A/R (×2)', 600, 'transport', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000004', 'Location van 12 jours — Arctic Campers', 2078, 'van', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000005', 'Péages — flat fee Arctic Campers', 103, 'van', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000006', 'Frais de service van', 55, 'van', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000007', 'Assurance MAX CV', 284, 'van', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000008', 'Kit literie', 59, 'van', '2026-07-14', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000009', 'Sacs de couchage', 42, 'divers', '2026-07-01', 'Commun', 'Achat avant départ', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000010', 'Carburant (~1 500 km à 9 L/100, 1,60 €/L)', 216, 'carburant', '2026-07-20', 'Commun', 'Estimation à répartir sur le voyage', '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000011', 'Croisière Nærøyfjord (2 pers)', 70, 'activites', '2026-07-20', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000012', 'Flåmsbana (2 pers)', 70, 'activites', '2026-07-21', 'Commun', null, '2026-06-01T00:00:00Z'),
('00000000-0000-4000-e000-000000000013', 'Bateau Gjende (2 pers)', 40, 'activites', '2026-07-24', 'Commun', null, '2026-06-01T00:00:00Z');
