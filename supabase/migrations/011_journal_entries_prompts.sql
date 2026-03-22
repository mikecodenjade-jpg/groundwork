-- Add directed prompt columns to journal_entries
alter table public.journal_entries
  add column if not exists pissed_off text;
alter table public.journal_entries
  add column if not exists handled_well text;
