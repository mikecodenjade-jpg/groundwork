create table if not exists family_activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  activity_name text not null,
  energy_level  text,        -- low | medium | high
  time_slot     text,        -- 15 | 30 | 60
  created_at  timestamptz not null default now()
);

alter table family_activities enable row level security;

create policy "Users manage own family activities"
  on family_activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
