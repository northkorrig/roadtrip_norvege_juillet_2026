-- ============================================================
-- Norvège — Road Trip Fjords & Montagnes · Schéma Supabase
-- À exécuter dans le Dashboard Supabase : SQL Editor → New query
-- (puis exécuter scripts/seed.sql pour pré-remplir le voyage)
-- ============================================================
-- Conventions :
--   · tables et colonnes en FRANÇAIS (alignées avec src/types/db.ts)
--   · clés primaires uuid via gen_random_uuid()
--   · RLS activé partout avec une policy `public_all`
--     (projet privé sans auth utilisateur : l'accès se fait par la clé anon)

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.etapes (
  id                  uuid primary key default gen_random_uuid(),
  nom                 text not null,
  date                date,
  ordre               integer not null default 0,
  lat                 double precision,
  lng                 double precision,
  km_depuis_precedent numeric(7,1),
  duree_min           integer,
  nuit_type           text, -- camping | bivouac | parking | hotel | autre
  note                text,
  created_at          timestamptz not null default now()
);

create table if not exists public.pois (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  categorie  text not null default 'activite',
  -- randonnee | vue_panoramique | cascade | glacier | village | ferry | bivouac | activite
  lat        double precision not null,
  lng        double precision not null,
  note       text,
  ordre      integer not null default 0,
  jour       date,
  etape_id   uuid references public.etapes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  titre      text not null,
  contenu    text not null default '',
  date       date,
  poi_id     uuid references public.pois(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.taches (
  id         uuid primary key default gen_random_uuid(),
  texte      text not null,
  categorie  text not null default 'packing', -- packing | avant_depart
  completee  boolean not null default false,
  ordre      integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.depenses (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  montant    numeric(10,2) not null default 0,
  categorie  text not null default 'divers',
  -- transport | van | carburant | activites | nourriture | hebergement | divers
  date       date,
  personne   text,
  note       text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Index
-- ------------------------------------------------------------

create index if not exists etapes_ordre_idx  on public.etapes (ordre);
create index if not exists pois_ordre_idx    on public.pois (ordre);
create index if not exists pois_etape_idx    on public.pois (etape_id);
create index if not exists pois_jour_idx     on public.pois (jour);
create index if not exists notes_poi_idx     on public.notes (poi_id);
create index if not exists taches_ordre_idx  on public.taches (ordre);
create index if not exists depenses_date_idx on public.depenses (date);

-- ------------------------------------------------------------
-- updated_at automatique sur notes
-- ------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security : policy `public_all` sur chaque table
-- ------------------------------------------------------------

alter table public.etapes   enable row level security;
alter table public.pois     enable row level security;
alter table public.notes    enable row level security;
alter table public.taches   enable row level security;
alter table public.depenses enable row level security;

drop policy if exists public_all on public.etapes;
create policy public_all on public.etapes   for all using (true) with check (true);

drop policy if exists public_all on public.pois;
create policy public_all on public.pois     for all using (true) with check (true);

drop policy if exists public_all on public.notes;
create policy public_all on public.notes    for all using (true) with check (true);

drop policy if exists public_all on public.taches;
create policy public_all on public.taches   for all using (true) with check (true);

drop policy if exists public_all on public.depenses;
create policy public_all on public.depenses for all using (true) with check (true);

-- ------------------------------------------------------------
-- Realtime : publier les changements des 5 tables
-- ------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.etapes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.pois;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.taches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.depenses;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- MIGRATION AUTH — Supabase Auth + table profiles + RLS roles
-- À exécuter après le schéma initial
-- ============================================================

-- ------------------------------------------------------------
-- Table profiles (liée à auth.users)
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'invite' check (role in ('admin', 'invite'))
);

-- Création automatique d'un profil 'invite' à chaque inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'invite')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS sur profiles
alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ------------------------------------------------------------
-- Mise à jour des policies RLS des 5 tables
-- Lecture : tout utilisateur authentifié
-- Écriture : admin uniquement
-- ------------------------------------------------------------

-- etapes
drop policy if exists public_all on public.etapes;

create policy etapes_select on public.etapes
  for select using (auth.role() = 'authenticated');

create policy etapes_write on public.etapes
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- pois
drop policy if exists public_all on public.pois;

create policy pois_select on public.pois
  for select using (auth.role() = 'authenticated');

create policy pois_write on public.pois
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- notes
drop policy if exists public_all on public.notes;

create policy notes_select on public.notes
  for select using (auth.role() = 'authenticated');

create policy notes_write on public.notes
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- taches
drop policy if exists public_all on public.taches;

create policy taches_select on public.taches
  for select using (auth.role() = 'authenticated');

create policy taches_write on public.taches
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- depenses
drop policy if exists public_all on public.depenses;

create policy depenses_select on public.depenses
  for select using (auth.role() = 'authenticated');

create policy depenses_write on public.depenses
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- MIGRATION POKÉDEX — observations faune partagées
-- (déjà appliquée via MCP le 2026-07-04 ; conservée ici pour référence)
-- ============================================================

-- Une ligne par espèce (animal_id = id du catalogue statique
-- src/lib/pokedexData.ts). Partagée entre les deux voyageurs.

create table if not exists public.pokedex_observations (
  animal_id  text primary key,
  vu         boolean not null default true,
  date       date,
  lieu       text not null default '',
  note       text not null default '',
  created_at timestamptz not null default now()
);

alter table public.pokedex_observations enable row level security;

-- Contrairement aux autres tables (écriture admin), les DEUX voyageurs
-- cochent leurs observations : écriture pour tout utilisateur authentifié.
drop policy if exists pokedex_select on public.pokedex_observations;
create policy pokedex_select on public.pokedex_observations
  for select using (auth.role() = 'authenticated');

drop policy if exists pokedex_write on public.pokedex_observations;
create policy pokedex_write on public.pokedex_observations
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

do $$
begin
  alter publication supabase_realtime add table public.pokedex_observations;
exception when duplicate_object then null;
end $$;
