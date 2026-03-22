create table if not exists public.badges (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  badge_slug text        not null,
  earned_at  timestamptz not null default now(),
  unique (user_id, badge_slug)
);

alter table public.badges enable row level security;

create policy "Users can manage their own badges"
  on public.badges for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
