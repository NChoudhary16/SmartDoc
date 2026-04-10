-- RAG template store + vector similarity search for DocuFlow.
-- Run this in the Supabase SQL Editor after documents_schema.sql (or merge into one migration).
-- Requires: OpenAI embedding vectors with dimensions=768 (must match embedding column).

create extension if not exists vector;

-- OPENAI_EMBED_DIMENSIONS should be 768 to match this vector column.
create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  type text,
  description text,
  file_path text not null,
  embedding vector(768) not null
);

create index if not exists document_templates_type_idx on public.document_templates (type);

-- Cosine similarity search (pgvector)
create index if not exists document_templates_embedding_hnsw
  on public.document_templates
  using hnsw (embedding vector_cosine_ops);

alter table public.document_templates enable row level security;

-- Server uses SUPABASE_ANON_KEY; allow read/write for API-driven seeding & matching.
drop policy if exists "document_templates_select" on public.document_templates;
create policy "document_templates_select"
  on public.document_templates for select
  to anon, authenticated
  using (true);

drop policy if exists "document_templates_insert" on public.document_templates;
create policy "document_templates_insert"
  on public.document_templates for insert
  to anon, authenticated
  with check (true);

drop policy if exists "document_templates_update" on public.document_templates;
create policy "document_templates_update"
  on public.document_templates for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "document_templates_delete" on public.document_templates;
create policy "document_templates_delete"
  on public.document_templates for delete
  to anon, authenticated
  using (true);

-- Cosine distance: <=> ; cosine similarity approximated as 1 - distance for normalized embeddings.
-- type_filter: when set, only templates whose type matches (equals or contains) the document category.
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
