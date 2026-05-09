-- ─────────────────────────────────────────────────────────────
-- HR Manager — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────

-- Workers
create table if not exists workers (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  role        text,
  hourly_rate numeric(8,2) not null default 0,
  phone       text,
  created_at  timestamptz default now()
);

-- Presence (one record per worker per day, enforced by unique constraint)
create table if not exists presence (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  worker_id   int references workers(id) on delete cascade,
  date        date not null,
  status      text not null check (status in ('present','late','absent','conge')),
  arrived     time,
  left_at     time,
  unique (worker_id, date)
);

-- Congés
create table if not exists conges (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  worker_id   int references workers(id) on delete cascade,
  type        text,
  date_from   date,
  date_to     date,
  days        int,
  note        text,
  created_at  timestamptz default now()
);

-- Acomptes
create table if not exists acomptes (
  id          serial primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  worker_id   int references workers(id) on delete cascade,
  montant     numeric(8,2),
  date        date,
  motif       text,
  created_at  timestamptz default now()
);

-- Settings (one row per user)
create table if not exists settings (
  id              serial primary key,
  user_id         uuid references auth.users(id) on delete cascade unique,
  company_name    text default 'Mon Entreprise',
  standard_hours  numeric(4,2) default 8,
  sup_multiplier  numeric(4,2) default 1.5
);

-- ── Row Level Security ───────────────────────────────────────
-- Each user only sees their own data

alter table workers  enable row level security;
alter table presence enable row level security;
alter table conges   enable row level security;
alter table acomptes enable row level security;
alter table settings enable row level security;

-- Workers
create policy "workers: own data" on workers
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Presence
create policy "presence: own data" on presence
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Congés
create policy "conges: own data" on conges
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Acomptes
create policy "acomptes: own data" on acomptes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Settings
create policy "settings: own data" on settings
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
