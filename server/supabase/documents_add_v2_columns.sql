-- Run in Supabase → SQL Editor if `documents` was created from an older schema.
-- Fixes: "Could not find the 'assigned_to' column of 'documents' in the schema cache"

alter table public.documents add column if not exists assigned_to bigint;
alter table public.documents add column if not exists created_by_name text;
alter table public.documents add column if not exists creator_role text;
alter table public.documents add column if not exists validation_report jsonb;
alter table public.documents add column if not exists history jsonb not null default '[]'::jsonb;
