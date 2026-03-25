-- ── Decline Detection Tables ──────────────────────────────────────────────────
-- Server-side mood decline scoring. Written by the decline-detection Edge Function
-- after each mood check-in.

-- Add numeric score to legacy mood_checkins (created as text-only in 001)
alter table public.mood_checkins
  add column if not exists score int check (score between 1 and 5);

-- ── Decline Scores ────────────────────────────────────────────────────────────
-- Each row is one scoring event. The Edge Function uses the service role key
-- (bypasses RLS on write); users can only read their own rows.

create table if not exists public.decline_scores (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  score         int         not null check (score between 0 and 100),
  tier          text        not null check (tier in ('green', 'yellow', 'orange', 'red')),
  factors       jsonb       not null default '{}',
  calculated_at timestamptz not null default now()
);

alter table public.decline_scores enable row level security;

create policy "Users can read their own decline scores"
  on public.decline_scores for select
  using (auth.uid() = user_id);

-- Service role writes bypass RLS — no insert/update policy needed.

create index if not exists decline_scores_user_calculated
  on public.decline_scores (user_id, calculated_at desc);
