-- Add meal_type column to existing meal_logs table
alter table public.meal_logs
  add column if not exists meal_type text not null default 'snack';
