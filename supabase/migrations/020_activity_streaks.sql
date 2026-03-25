-- ── Activity-based streak tracking ───────────────────────────────────────────
-- user_streaks was created in 018 but was never written to.
-- This migration adds the missing created_at column and a comment clarifying
-- that streaks are now driven by ANY engagement (check-in, workout, meal,
-- journal) — not check-ins alone.

alter table public.user_streaks
  add column if not exists created_at timestamptz not null default now();

comment on table public.user_streaks is
  'Denormalized streak counters updated after any engagement activity
   (daily_checkins, workout_logs, meal_logs, journal_entries).
   Celebrate presence, never punish absence.';
