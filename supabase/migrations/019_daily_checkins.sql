-- ── Daily Check-Ins ────────────────────────────────────────────────────────────
-- Richer daily check-in: mood + sleep + energy + optional note
-- Separate from legacy mood_checkins which tracks raw mood strings

create table if not exists public.daily_checkins (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  mood       smallint    not null check (mood between 1 and 5),
  sleep      smallint    not null check (sleep between 1 and 5),
  energy     smallint    not null check (energy between 1 and 5),
  note       text,
  created_at timestamptz not null default now()
);

alter table public.daily_checkins enable row level security;

create policy "Users can manage their own daily_checkins"
  on public.daily_checkins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists daily_checkins_user_created
  on public.daily_checkins (user_id, created_at desc);

-- ── Check-In Streaks ───────────────────────────────────────────────────────────
-- Denormalized streak counters — updated client-side after each check-in

create table if not exists public.checkin_streaks (
  id                 uuid        primary key default gen_random_uuid(),
  user_id            uuid        not null references auth.users(id) on delete cascade,
  current_streak     integer     not null default 0,
  longest_streak     integer     not null default 0,
  last_checkin_date  date,
  updated_at         timestamptz not null default now(),
  unique (user_id)
);

alter table public.checkin_streaks enable row level security;

create policy "Users can manage their own checkin_streaks"
  on public.checkin_streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
