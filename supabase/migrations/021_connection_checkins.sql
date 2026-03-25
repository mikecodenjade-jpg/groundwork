create table if not exists public.connection_checkins (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  score      smallint    not null check (score between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.connection_checkins enable row level security;

create policy "Users can manage their own connection checkins"
  on public.connection_checkins for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
