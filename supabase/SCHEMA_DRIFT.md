# Schema drift — tables referenced by code but not in `supabase/migrations/`

Generated 2026-05-09 as part of the critical-fixes pass on the audit (item C-6).

## ⚠️ Production schema diverges from this repo's migrations (2026-05-09)

After the original PR #3 hardening, the live Supabase project
`kmnqpargwdxtozknswzk` was inspected and **does not exactly match** the
migrations in this folder. In particular:

- Production uses `profiles` and `mood_logs`. The repo migrations use
  `user_profiles` and `mood_checkins`.
- Production has additional tables that were never migrated through this
  repo: `crew_posts`, `crew_members`, `email_preferences`, `gratitude_entries`
  (with extra columns), `connection_checkins`, `injuries`,
  `user_submitted_foods`, `activity_embeddings`, `generation_runs`, and
  `_temp_deploy`.
- Production already had `journal_entries` with select/insert RLS but was
  missing owner-scoped update/delete policies on several user tables.

A production-specific hardening migration named
**`production_rls_hardening_20260509`** was applied directly to production
via the Supabase SQL editor on 2026-05-09 and verified working. The repo
copy of that migration is `supabase/migrations/025_production_rls_hardening.sql`.
It is wrapped in `to_regclass(...) is not null` guards so it is safe to run
against either schema (production or a fresh deploy from migrations 001–024).

**What this means in practice:**

- The earlier `024_rls_legacy_tables.sql` migration is still useful for fresh
  deploys that follow the legacy table names. We are keeping it.
- Migration `025_production_rls_hardening.sql` is the source of truth for
  what's currently live in production.
- Until the rest of the production schema is captured in migrations (see
  "Concrete next steps" at the bottom), a fresh deploy from this repo will
  not be byte-identical to production. That is a known gap, not a bug
  introduced by this PR.
- **No further deploy is required for the production hardening itself** —
  it is already applied and verified. The repo changes in this PR are
  documentation/parity only. The unsubscribe page change does need a normal
  app redeploy (Vercel) so the browser starts calling the new RPC.

The audit found ~10 tables that the app code reads or writes but that have
no matching migration file in `supabase/migrations/`. Either the production
database has tables that aren't tracked in source control (so a fresh deploy
can't reproduce the schema and we cannot verify their RLS state), or the code
references tables that don't exist in production (so those features silently
fail at runtime).

The right way to close this is:

```bash
# From a machine that has the production Supabase DB password:
pg_dump --schema-only \
  "postgres://postgres:<DB_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres" \
  > supabase/dump_prod_schema.sql

# Then create migrations for tables we don't already have, ensure each one
# has RLS + owner-only policies (use migration 024 as the template).
```

This document inventories the gap so Michael (or whoever has prod access)
can run that command and knows exactly which tables need migrations + RLS.

## ✅ Tracked (have migrations)

`activity_streaks`, `badges`, `connection_checkins`, `daily_checkins`,
`decline_scores`, `family_activities`, `gratitude_entries`, `journal_entries`,
`leadership_challenges_completed`, `meal_logs`, `mood_checkins`,
`program_enrollments`, `program_progress`, `relationship_challenges`,
`run_logs`, `transition_plans`, `user_profiles`, `user_streaks`,
`workout_logs`.

RLS for the legacy 001–004 tables and `coach_conversations` is added in
migration `024_rls_legacy_tables.sql` (this PR).

## ❌ Referenced by code, missing from migrations

| Table | Where it's used | Risk |
|---|---|---|
| `coach_conversations` | `app/dashboard/coach/page.tsx` | **Highest** — full AI conversation history (mental-health disclosures). Migration 024 in this PR creates it idempotently with RLS. |
| `crew_posts` | crew feature | Social posts — depends on whether posts are intended to be visible across users. Need migration + RLS policy decision. |
| `team_challenges` | challenges feature | Likely shared/public; needs explicit policy. |
| `challenge_participants` | challenges feature | Owner-only on `user_id`. |
| `body_measurements` | body page | Owner-only on `user_id`; sensitive. |
| `body_measurement_goals` | body page | Owner-only on `user_id`. |
| `injuries` | body page | Owner-only on `user_id`; sensitive (medical). |
| `meditation_sessions` | mind page | Owner-only on `user_id`. |
| `email_preferences` | settings | Owner-only on `user_id`. |
| `notification_preferences` | settings | Owner-only on `user_id`. |
| `usda_foods` | nutrition page | Public reference table — read-only for everyone is fine, but the migration should still exist and policies should be explicit. |
| `wearable_connections` | body/devices page | Owner-only on `user_id`; OAuth tokens may live here. |
| `user_training_preferences` | onboarding | Owner-only on `user_id`. |
| `workout_sessions` | train pages | Owner-only on `user_id`. |

## ❌ Column drift (referenced by code, may not exist in migrations)

| Table | Column | Where | Notes |
|---|---|---|---|
| `user_profiles` | `initial_mood` | `app/onboarding/page.tsx:176` | No migration adds this column. Either the upsert silently drops it, or someone added it in Studio without committing. |
| `journal_entries` | `pissed_off`, `handled_well` | `app/dashboard/today/page.tsx`, `app/dashboard/heart/page.tsx` | Migration 011 adds these — confirmed tracked. |
| `mood_checkins` | `source`, `score` | mind page, decline detection | Migrations 010 and 023 add these — confirmed tracked. |

## What we couldn't fix without prod access

This branch can't safely guess the column shape of tables that don't have
migrations. Adding a migration with the wrong shape would either fail to
apply (different column types) or, worse, silently mask the real prod
schema.

The only things this PR does about schema drift are:

1. Add the RLS migration for the four legacy tables explicitly named in the
   audit (C-1).
2. Add an idempotent `coach_conversations` `CREATE TABLE IF NOT EXISTS` so
   that branch is at least RLS-protected with a defensible default schema —
   but if production already has a different schema, only the RLS block
   takes effect, the `CREATE TABLE` is a no-op.
3. Document the rest here so the next person with prod access can finish.

## Concrete next steps for Michael (or whoever has prod access)

1. Run the `pg_dump --schema-only` command above.
2. For each table in the **❌ Referenced by code, missing from migrations**
   list, copy its `CREATE TABLE` block out of the dump and into a new
   `supabase/migrations/0XX_<table>.sql` file.
3. After each `CREATE TABLE`, append:
   ```sql
   alter table public.<table> enable row level security;

   create policy "<table>_select_own"
     on public.<table> for select using (auth.uid() = user_id);
   create policy "<table>_insert_own"
     on public.<table> for insert with check (auth.uid() = user_id);
   create policy "<table>_update_own"
     on public.<table> for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
   create policy "<table>_delete_own"
     on public.<table> for delete using (auth.uid() = user_id);
   ```
   ... or whatever per-table variant fits (e.g. `usda_foods` is a public
   reference table and just needs a `for select using (true)` policy).
4. Apply migration `024_rls_legacy_tables.sql` to production via the Supabase
   SQL editor or the CLI. Verify with:
   ```sql
   select tablename, rowsecurity
     from pg_tables
     where schemaname = 'public'
       and tablename in (
         'mood_checkins', 'journal_entries', 'workout_logs',
         'user_profiles', 'coach_conversations'
       );
   ```
   All five rows should show `rowsecurity = true`.
