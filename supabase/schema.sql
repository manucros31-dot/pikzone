-- ─── Signalements ─────────────────────────────────────────────────────────────

create table if not exists signalements (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  latitude float not null,
  longitude float not null,
  niveau text not null check (niveau in ('infeste', 'beaucoup', 'peu', 'aucun')),
  created_at timestamp with time zone default now()
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
