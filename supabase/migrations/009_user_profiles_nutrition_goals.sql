-- Add nutrition_goals jsonb column to user_profiles
alter table public.user_profiles
  add column if not exists nutrition_goals jsonb;
