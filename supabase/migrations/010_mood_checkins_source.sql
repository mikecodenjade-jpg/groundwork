-- Add source column to mood_checkins
alter table public.mood_checkins
  add column if not exists source text;
