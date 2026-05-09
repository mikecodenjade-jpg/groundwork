-- ── Production RLS hardening (production_rls_hardening_20260509) ─────────────
-- Applied to production project `kmnqpargwdxtozknswzk` on 2026-05-09 via the
-- Supabase SQL editor. Captured here so the repo migration history matches the
-- live database.
--
-- Important context: production schema diverges from the older repo migrations.
-- The legacy migrations 001–024 use names like `user_profiles` and
-- `mood_checkins`, while production uses `profiles` and `mood_logs` (plus the
-- additional tables touched below: `crew_posts`, `email_preferences`,
-- `journal_entries`, `gratitude_entries`, `connection_checkins`, `injuries`,
-- `user_submitted_foods`, `activity_embeddings`, `generation_runs`,
-- `_temp_deploy`). See `supabase/SCHEMA_DRIFT.md` for the full picture.
--
-- This migration is idempotent and only operates on tables/policies that exist
-- in production. It is safe to re-run, and it is safe to apply against a fresh
-- deploy: `drop policy if exists` is a no-op when the policy is absent, and the
-- `create policy` blocks only run after the drop.
--
-- The earlier `024_rls_legacy_tables.sql` migration is intentionally retained:
-- it covers the legacy table names that some fresh-deploy paths still use.

-- 1) Tighten crew_posts: posts should only be visible to the author or members
--    of the same crew, not every anon/authenticated caller.
do $$
begin
  if to_regclass('public.crew_posts') is not null then
    drop policy if exists "crew members can read posts" on public.crew_posts;
    drop policy if exists "crew_members_can_read_posts" on public.crew_posts;

    create policy "crew_members_can_read_posts"
      on public.crew_posts
      for select
      using (
        auth.uid() = user_id
        or (
          crew_id is not null
          and crew_id in (
            select cm.crew_id
            from public.crew_members cm
            where cm.user_id = auth.uid()
          )
        )
      );
  end if;
end$$;

-- 2) Remove broad direct table updates for email unsubscribe.
--    Service-role/server code can still bypass RLS when needed. For public
--    unsubscribe links, expose a constrained SECURITY DEFINER function that
--    only flips unsubscribe flags for the matching token.
do $$
begin
  if to_regclass('public.email_preferences') is not null then
    drop policy if exists "Public unsubscribe via token" on public.email_preferences;
  end if;
end$$;

create or replace function public.unsubscribe_email_by_token(token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.email_preferences
     set unsubscribe_all = true,
         marketing_emails = false,
         workout_reminders = false,
         weekly_progress = false,
         coach_alerts = false,
         product_updates = false,
         updated_at = now()
   where unsubscribe_token = token;

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

revoke all on function public.unsubscribe_email_by_token(uuid) from public;
grant execute on function public.unsubscribe_email_by_token(uuid) to anon, authenticated;

-- 3) Remove misleading/dangerous "service role" RLS policy. The Supabase
--    service_role bypasses RLS by design, so this policy only widens client
--    access.
do $$
begin
  if to_regclass('public.user_submitted_foods') is not null then
    drop policy if exists "Service role can update submissions" on public.user_submitted_foods;
  end if;
end$$;

-- 4) Remove broad reads of non-reference/internal tables. Static catalog/
--    reference tables such as usda_foods, activities, programs, and exercise
--    libraries are intentionally left readable.
do $$
begin
  if to_regclass('public.activity_embeddings') is not null then
    drop policy if exists "Authenticated users can read embeddings" on public.activity_embeddings;
  end if;
  if to_regclass('public.generation_runs') is not null then
    drop policy if exists "Authenticated users can read generation runs" on public.generation_runs;
  end if;
end$$;

-- 5) Lock down leftover temp deploy table access. Keep the table to avoid
--    accidental dependency breakage, but remove client-side read access.
do $$
begin
  if to_regclass('public._temp_deploy') is not null then
    drop policy if exists "temp_read" on public._temp_deploy;
    revoke all on table public._temp_deploy from anon, authenticated;
  end if;
end$$;

-- 6) Add missing owner-scoped update/delete policies on sensitive user tables
--    that currently only had select/insert in production.
do $$
begin
  if to_regclass('public.journal_entries') is not null then
    drop policy if exists "Users can update their own journal entries" on public.journal_entries;
    create policy "Users can update their own journal entries"
      on public.journal_entries
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    drop policy if exists "Users can delete their own journal entries" on public.journal_entries;
    create policy "Users can delete their own journal entries"
      on public.journal_entries
      for delete
      using (auth.uid() = user_id);
  end if;

  if to_regclass('public.gratitude_entries') is not null then
    drop policy if exists "Users can update own gratitude entries" on public.gratitude_entries;
    create policy "Users can update own gratitude entries"
      on public.gratitude_entries
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    drop policy if exists "Users can delete own gratitude entries" on public.gratitude_entries;
    create policy "Users can delete own gratitude entries"
      on public.gratitude_entries
      for delete
      using (auth.uid() = user_id);
  end if;

  if to_regclass('public.connection_checkins') is not null then
    drop policy if exists "Users can update own connection checkins" on public.connection_checkins;
    create policy "Users can update own connection checkins"
      on public.connection_checkins
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);

    drop policy if exists "Users can delete own connection checkins" on public.connection_checkins;
    create policy "Users can delete own connection checkins"
      on public.connection_checkins
      for delete
      using (auth.uid() = user_id);
  end if;

  if to_regclass('public.injuries') is not null then
    drop policy if exists "Users can delete own injuries" on public.injuries;
    create policy "Users can delete own injuries"
      on public.injuries
      for delete
      using (auth.uid() = user_id);
  end if;
end$$;
