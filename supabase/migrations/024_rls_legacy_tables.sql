-- ── Row-Level Security on legacy sensitive tables ─────────────────────────────
-- Tables created in migrations 001–004 (and the coach_conversations table that
-- exists in production but was never tracked in migrations) were created
-- without RLS. The anon key ships in the client bundle, so without RLS these
-- rows are world-readable. This migration enables RLS and adds owner-only
-- policies.
--
-- Pattern: auth.uid() must equal user_id (or id, for user_profiles).
-- Each table gets per-command policies (select / insert / update / delete) so
-- they remain scoped even if a future change adds a permissive blanket policy.
--
-- Idempotent: safe to re-run. Uses `drop policy if exists` before each create.

-- ── mood_checkins ─────────────────────────────────────────────────────────────
alter table public.mood_checkins enable row level security;

drop policy if exists "mood_checkins_select_own" on public.mood_checkins;
drop policy if exists "mood_checkins_insert_own" on public.mood_checkins;
drop policy if exists "mood_checkins_update_own" on public.mood_checkins;
drop policy if exists "mood_checkins_delete_own" on public.mood_checkins;

create policy "mood_checkins_select_own"
  on public.mood_checkins for select
  using (auth.uid() = user_id);

create policy "mood_checkins_insert_own"
  on public.mood_checkins for insert
  with check (auth.uid() = user_id);

create policy "mood_checkins_update_own"
  on public.mood_checkins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "mood_checkins_delete_own"
  on public.mood_checkins for delete
  using (auth.uid() = user_id);

-- ── journal_entries ───────────────────────────────────────────────────────────
alter table public.journal_entries enable row level security;

drop policy if exists "journal_entries_select_own" on public.journal_entries;
drop policy if exists "journal_entries_insert_own" on public.journal_entries;
drop policy if exists "journal_entries_update_own" on public.journal_entries;
drop policy if exists "journal_entries_delete_own" on public.journal_entries;

create policy "journal_entries_select_own"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "journal_entries_insert_own"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "journal_entries_update_own"
  on public.journal_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "journal_entries_delete_own"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- ── workout_logs ──────────────────────────────────────────────────────────────
alter table public.workout_logs enable row level security;

drop policy if exists "workout_logs_select_own" on public.workout_logs;
drop policy if exists "workout_logs_insert_own" on public.workout_logs;
drop policy if exists "workout_logs_update_own" on public.workout_logs;
drop policy if exists "workout_logs_delete_own" on public.workout_logs;

create policy "workout_logs_select_own"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "workout_logs_insert_own"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "workout_logs_update_own"
  on public.workout_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_logs_delete_own"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- ── user_profiles ─────────────────────────────────────────────────────────────
-- user_profiles uses `id` (PK) as the owner column — it references auth.users(id).
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
drop policy if exists "user_profiles_update_own" on public.user_profiles;
drop policy if exists "user_profiles_delete_own" on public.user_profiles;

create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "user_profiles_delete_own"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- ── coach_conversations ───────────────────────────────────────────────────────
-- This table is referenced by app/dashboard/coach/page.tsx but was never
-- tracked in supabase/migrations/. We create it idempotently with the schema
-- inferred from the upsert call, then enable RLS. If the table already exists
-- in production with a compatible schema, only the RLS + policies will apply.

create table if not exists public.coach_conversations (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  session_id  text        not null,
  title       text,
  messages    jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, session_id)
);

create index if not exists coach_conversations_user_updated
  on public.coach_conversations (user_id, updated_at desc);

alter table public.coach_conversations enable row level security;

drop policy if exists "coach_conversations_select_own" on public.coach_conversations;
drop policy if exists "coach_conversations_insert_own" on public.coach_conversations;
drop policy if exists "coach_conversations_update_own" on public.coach_conversations;
drop policy if exists "coach_conversations_delete_own" on public.coach_conversations;

create policy "coach_conversations_select_own"
  on public.coach_conversations for select
  using (auth.uid() = user_id);

create policy "coach_conversations_insert_own"
  on public.coach_conversations for insert
  with check (auth.uid() = user_id);

create policy "coach_conversations_update_own"
  on public.coach_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "coach_conversations_delete_own"
  on public.coach_conversations for delete
  using (auth.uid() = user_id);
