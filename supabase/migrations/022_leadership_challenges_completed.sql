create table if not exists public.leadership_challenges_completed (
  id               uuid        default gen_random_uuid() primary key,
  user_id          uuid        not null references auth.users(id) on delete cascade,
  challenge_index  int         not null,
  completed_date   date        not null default current_date,
  created_at       timestamptz not null default now(),
  unique (user_id, challenge_index, completed_date)
);

alter table public.leadership_challenges_completed enable row level security;

create policy "Users can manage their own leadership challenge completions"
  on public.leadership_challenges_completed for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
