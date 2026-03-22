create table if not exists public.program_enrollments (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  program_slug text        not null,
  current_week int         not null default 1,
  status       text        not null default 'active',
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, program_slug)
);

alter table public.program_enrollments enable row level security;

create policy "Users can manage their own enrollments"
  on public.program_enrollments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
