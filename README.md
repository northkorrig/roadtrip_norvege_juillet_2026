# 🇳🇴 Norvège — Road Trip Fjords & Montagnes

Application web pour préparer, gérer et partager un road trip en van en Norvège
(**14 → 26 juillet 2026**, Oslo → fjords de l'Ouest → Jotunheimen → Oslo, ~1 500 km).

**Stack** : React 18 · Vite · TypeScript strict · Tailwind CSS · Framer Motion ·
Google Maps (Maps JS + Places + Directions) · Supabase (PostgreSQL + Realtime) · Vercel.

## ✨ Fonctionnalités

- **Hero** plein écran : carte Google Maps, trace du trip dessinée en animé, survol caméra Oslo → Oslo
- **Itinéraire** split-screen : timeline des 13 jours ⇄ carte synchronisées, drag & drop,
  recalcul km/durées et **optimisation du trajet** via Directions API
- **POIs** : 26 spots pré-remplis, filtres par catégorie, vue liste/carte, ajout par clic carte,
  recherche **Google Places**, collage d'URL Google Maps, **import/export KML · GPX · CSV**,
  liens Street View / Google Maps / Waze
- **Bivouacs & spots** (`/bivouacs`) : carte plein écran + recherche communautaire **OpenStreetMap**
  (autour d'une étape, de ma position GPS ou de la zone visible). Au-delà des campings et refuges :
  **points de vue, plages/baignade, aires de pique-nique & foyers, aires de repos van, emplacements
  informels, gapahuks/abris**, réseau **DNT**, équipements (eau/feu/WC), avis **Google Maps** croisés
  par proximité, Street View, ajout direct aux POIs
- **Budget** : budget total éditable (localStorage `total_budget`), donut par catégorie,
  filtre par personne, conversion **EUR ⇄ NOK**, réservations à faire avec statuts
- **Notes & logistique** : notes Markdown liées aux jours/POIs, checklist packing + avant-départ,
  météo par étape (Open-Meteo, sans clé), infos pratiques (ferries, bivouac, urgences)
- **Partage** : lien lecture seule `/trip/:code` · **Roadbook** imprimable → PDF (`/roadbook`)
- **Temps réel** : changements synchronisés entre téléphones via Supabase Realtime
- **Mode démo** : sans variables d'env, l'app tourne sur les données seed en localStorage

## 🚀 Démarrage local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # http://localhost:5173
```

Sans `.env.local`, l'app démarre en **mode démo** (badge « Démo locale ») :
données seed persistées en localStorage, carte remplacée par un décor animé.

### Variables d'environnement (`.env.local`, jamais commité)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Clé `anon` publique du projet |
| `VITE_GOOGLE_MAPS_API_KEY` | Clé Google Cloud avec **Maps JavaScript API**, **Places API** et **Directions API** activées |

### Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. SQL Editor → coller et exécuter [`supabase_setup.sql`](./supabase_setup.sql)
   (tables FR, RLS `public_all`, trigger `updated_at`, Realtime)
3. SQL Editor → exécuter [`scripts/seed.sql`](./scripts/seed.sql) pour pré-remplir
   les 13 étapes, 26 POIs, notes, checklist et budget initial (⚠️ vide les tables avant)
4. Reporter l'URL et la clé anon dans `.env.local`

> Le projet est privé et sans authentification : la policy RLS `public_all` donne
> tous les droits à la clé anon. Ne pas exposer l'URL publiquement si les données sont sensibles.

## 🗄️ Schéma de données (noms en français)

| Table | Colonnes |
|---|---|
| `etapes` | `id, nom, date, ordre, lat, lng, km_depuis_precedent, duree_min, nuit_type, note, created_at` |
| `pois` | `id, nom, categorie, lat, lng, note, ordre, jour, etape_id (fk), created_at` |
| `notes` | `id, titre, contenu, date, poi_id (fk), created_at, updated_at` |
| `taches` | `id, texte, categorie, completee, ordre, created_at` |
| `depenses` | `id, label, montant, categorie, date, personne, note, created_at` |

Hors BDD (choix volontaire, schéma figé) :
- **budget total** → localStorage `total_budget` (défaut 6 000 €)
- **jours du voyage** → générés côté client (`TRIP_DAYS`, 13 jours depuis le 14/07/2026)
- **réservations** → localStorage `reservations` (statuts À faire / En cours / Confirmé)
- **taux NOK** → localStorage `nok_par_eur` (défaut 11,5)

## 📁 Structure

```
├── index.html · vite.config.ts · tailwind.config.ts · vercel.json
├── supabase_setup.sql        # schéma + RLS + Realtime
├── scripts/seed.sql          # données du voyage (mêmes UUIDs que le mode démo)
└── src/
    ├── config/constants.ts   # TRIP_DAYS, métadonnées, catégories, palette
    ├── types/db.ts           # types alignés sur le schéma SQL
    ├── lib/                  # repo (Supabase ⇄ localStorage), Google Maps,
    │                         # directions, import/export, markdown, météo…
    ├── state/TripDataContext.tsx  # données globales + realtime + lecture seule
    ├── hooks/                # useLocalStorage
    ├── components/
    │   ├── ui.tsx            # primitives (modal, drawer, toasts, donut…)
    │   ├── map/              # MapCanvas, markers/cluster/polyline/survol, fallback
    │   ├── itinerary/ · pois/ · budget/ · notes/ · layout/
    └── pages/                # Home, Itinéraire, POIs, Budget, Notes, Share, Roadbook
```

## 🧞 Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Typecheck strict (`tsc --noEmit`) + build production |
| `npm run preview` | Prévisualisation du build |

## ☁️ Déploiement Vercel

```bash
npm i -g vercel
vercel              # preview
vercel --prod       # production
```

Ou via le dashboard : **Add New Project** → importer le repo GitHub → framework *Vite*
(le `vercel.json` gère la réécriture SPA). Renseigner les 3 variables d'environnement
dans *Settings → Environment Variables*, puis redéployer.

Pour Google Maps en production : restreindre la clé API au domaine Vercel
(*Google Cloud Console → Credentials → restrictions HTTP referrers*).

## 📐 Choix techniques & limites assumées

- **Aucun backend custom** : appels directs `@supabase/supabase-js` v2 depuis React
- **Couche repo interchangeable** (`src/lib/repo.ts`) : Supabase quand configuré,
  sinon localStorage seedé — l'app reste démontrable et utilisable hors ligne
- **Directions API économisée** : routes mises en cache en localStorage, repli en
  segments droits si l'API échoue
- **Donut budget en SVG maison** (pas de lib de charts) — léger et animable
- **Export PDF via impression navigateur** (`/roadbook` + styles print) plutôt qu'une
  lib PDF lourde ; rendu propre en A4
- **Badges d'étapes** (réservation/rando/ferry) dérivés du texte de la note — le
  schéma imposé ne prévoit pas de colonnes dédiées
- **Photos de POIs non implémentées** : pas de colonne ni de bucket Storage dans le
  schéma imposé ; les liens externes passent par le Markdown des notes
- **Lien de partage `/trip/:code`** : le code est décoratif (pas d'auth) — la policy
  RLS étant `public_all`, toute personne ayant l'URL du site peut lire les données
- **Météo Open-Meteo** : prévisions à ~15 jours max ; avant cela, normales de juillet
