create table if not exists public.gratitude_entries (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  prompt     text,
  entry      text        not null,
  created_at timestamptz not null default now()
);

alter table public.gratitude_entries enable row level security;

create policy "Users can manage their own gratitude entries"
  on public.gratitude_entries for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
