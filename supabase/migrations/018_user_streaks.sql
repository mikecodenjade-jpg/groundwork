create table if not exists public.user_streaks (
  user_id           uuid        primary key references auth.users(id) on delete cascade,
  current_streak    int         not null default 0,
  longest_streak    int         not null default 0,
  last_activity_date date,
  updated_at        timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

create policy "Users can manage their own streaks"
  on public.user_streaks for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
