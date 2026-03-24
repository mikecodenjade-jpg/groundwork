-- Transition Plan: one row per user, upserted on save
create table if not exists transition_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null unique,
  two_year_goal    text,
  blocking         text,
  skill_1          text,
  skill_2          text,
  skill_3          text,
  who_can_help     text,
  next_move        text,
  next_move_date   date,
  updated_at       timestamptz default now()
);

alter table transition_plans enable row level security;

create policy "Users manage their own transition plan"
  on transition_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
