create table if not exists public.run_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  distance_miles   float not null default 0,
  duration_seconds int   not null default 0,
  avg_pace         text  not null default '--:--',
  route_data       jsonb,
  created_at       timestamptz not null default now()
);

alter table public.run_logs enable row level security;

create policy "Users can insert their own run logs"
  on public.run_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can select their own run logs"
  on public.run_logs for select
  using (auth.uid() = user_id);
