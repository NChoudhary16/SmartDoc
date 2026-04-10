create extension if not exists "pgcrypto";
create extension if not exists vector;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by bigint,
  created_by_name text,
  creator_role text,
  approved_by bigint,
  assigned_to bigint,
  original_file text,
  status text not null default 'uploaded',
  document_type text,
  extracted_json jsonb not null default '{}'::jsonb,
  template_id text,
  template_name text,
  verification_report jsonb,
  validation_report jsonb,
  version int not null default 1,
  department text,
  artifacts jsonb not null default '{}'::jsonb,
  summary text,
  review_comments text,
  history jsonb not null default '[]'::jsonb,
  -- Keep this in sync with OPENAI_EMBED_DIMENSIONS in server/.env
  content_embedding vector(768)
);

create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

create index if not exists documents_content_embedding_hnsw
  on public.documents
  using hnsw (content_embedding vector_cosine_ops)
  where content_embedding is not null;
