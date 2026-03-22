create table if not exists public.program_progress (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  program_slug text        not null,
  week_num     int         not null,
  day_num      int         not null,
  completed_at timestamptz not null default now(),
  unique (user_id, program_slug, week_num, day_num)
);

alter table public.program_progress enable row level security;

create policy "Users can manage their own program progress"
  on public.program_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
