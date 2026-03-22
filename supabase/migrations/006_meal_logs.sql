create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_name text not null,
  calories integer default 0,
  protein_g integer default 0,
  carbs_g integer default 0,
  fat_g integer default 0,
  created_at timestamptz default now()
);

alter table meal_logs enable row level security;

create policy "Users can manage their own meal logs"
  on meal_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
