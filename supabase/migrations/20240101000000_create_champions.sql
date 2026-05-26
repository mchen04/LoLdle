-- Champions table for LoLdle game data
create table if not exists public.champions (
  id text primary key,
  name text not null,
  title text not null,
  gender text not null,
  positions text[] not null default '{}',
  species text[] not null default '{}',
  resource text not null,
  range_type text not null,
  regions text[] not null default '{}',
  release_year integer not null,
  icon_url text not null,
  splash_url text not null,
  quote text not null default '',
  emoji_clue text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Abilities table
create table if not exists public.abilities (
  id serial primary key,
  champion_id text not null references public.champions(id) on delete cascade,
  name text not null,
  icon_url text not null,
  slot text not null check (slot in ('P', 'Q', 'W', 'E', 'R'))
);

create index if not exists idx_abilities_champion on public.abilities(champion_id);

-- Skins table
create table if not exists public.skins (
  id text primary key,
  champion_id text not null references public.champions(id) on delete cascade,
  name text not null,
  splash_url text not null
);

create index if not exists idx_skins_champion on public.skins(champion_id);

-- Game stats table (anonymous, per-device tracking)
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  mode text not null check (mode in ('classic', 'quote', 'ability', 'emoji', 'splash')),
  games_played integer not null default 0,
  games_won integer not null default 0,
  total_guesses integer not null default 0,
  best_score integer,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(device_id, mode)
);

-- Enable Row Level Security
alter table public.champions enable row level security;
alter table public.abilities enable row level security;
alter table public.skins enable row level security;
alter table public.game_stats enable row level security;

-- Public read access for game data
create policy "Champions are publicly readable"
  on public.champions for select
  using (true);

create policy "Abilities are publicly readable"
  on public.abilities for select
  using (true);

create policy "Skins are publicly readable"
  on public.skins for select
  using (true);

-- Game stats: users can read/write their own stats by device_id
create policy "Users can read own stats"
  on public.game_stats for select
  using (true);

create policy "Users can insert own stats"
  on public.game_stats for insert
  with check (true);

create policy "Users can update own stats"
  on public.game_stats for update
  using (true);

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger champions_updated_at
  before update on public.champions
  for each row execute function public.update_updated_at();

create trigger game_stats_updated_at
  before update on public.game_stats
  for each row execute function public.update_updated_at();
