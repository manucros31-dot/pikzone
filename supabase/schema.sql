-- ─── Signalements ─────────────────────────────────────────────────────────────

create table if not exists signalements (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  latitude float not null,
  longitude float not null,
  niveau text not null check (niveau in ('infeste', 'beaucoup', 'peu', 'aucun')),
  date_signalement date,
  periode varchar(10) check (periode in ('matin', 'aprem', 'soir')),
  mode_signalement varchar(10) check (mode_signalement in ('direct', 'distant')),
  created_at timestamp with time zone default now()
);

-- Sessions (suivi durée d'utilisation)
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  duration_minutes integer
);

alter table signalements enable row level security;

create policy "Lecture publique" on signalements
  for select using (true);

create policy "Insertion publique" on signalements
  for insert with check (true);

create policy "Mise a jour rattachement" on signalements
  for update using (true) with check (true);

-- ─── Profils ───────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  pseudo text unique not null,
  prenom text not null,
  nom text not null,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Lecture publique profils" on profiles
  for select using (true);

create policy "Insertion propre profil" on profiles
  for insert with check (auth.uid() = id);

create policy "Modification propre profil" on profiles
  for update using (auth.uid() = id);

-- ─── Contestations ─────────────────────────────────────────────────────────────

create table if not exists contestations (
  id uuid default gen_random_uuid() primary key,
  zone_id uuid references signalements(id) on delete set null,
  latitude float not null,
  longitude float not null,
  niveau text,
  motif text not null,
  commentaire text check (char_length(commentaire) <= 300),
  email text,
  statut text not null default 'en_attente',
  created_at timestamp with time zone default now()
);

alter table contestations enable row level security;

create policy "Insertion publique contestations" on contestations
  for insert with check (true);

create policy "Lecture admin contestations" on contestations
  for select using (true);
