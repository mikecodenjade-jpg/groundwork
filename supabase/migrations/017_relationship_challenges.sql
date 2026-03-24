-- Tracks which weekly relationship challenges the user has completed
create table if not exists relationship_challenge_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  week_number  integer not null,
  completed_at timestamptz default now(),
  unique (user_id, week_number)
);

alter table relationship_challenge_completions enable row level security;

create policy "Users manage their own relationship challenge completions"
  on relationship_challenge_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
