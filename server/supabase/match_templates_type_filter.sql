-- Optional category filter: prefer templates whose `type` matches document_type (case-insensitive).
-- Replaces the 3-arg match_templates function. Run in Supabase SQL Editor.

drop function if exists public.match_templates(vector(768), double precision, integer);

create or replace function public.match_templates(
  query_embedding vector(768),
  match_threshold double precision default 0.38,
  match_count int default 5,
  type_filter text default null
)
returns setof public.document_templates
language sql
stable
parallel safe
as $$
  select *
  from public.document_templates
  where embedding is not null
    and 1 - (embedding <=> query_embedding) >= match_threshold
    and (
      type_filter is null
      or trim(type_filter) = ''
      or lower(trim(coalesce(document_templates.type, ''))) = lower(trim(type_filter))
      or lower(trim(coalesce(document_templates.type, ''))) like '%' || lower(trim(type_filter)) || '%'
    )
  order by embedding <=> query_embedding asc
  limit greatest(coalesce(match_count, 5), 1);
$$;

grant execute on function public.match_templates(vector(768), double precision, integer, text) to anon, authenticated;
