-- Store vector embedding of uploaded document OCR text (same dim as document_templates).
-- Run in Supabase SQL Editor after pgvector extension exists (see rag_templates_schema.sql).

alter table public.documents add column if not exists content_embedding vector(768);

create index if not exists documents_content_embedding_hnsw
  on public.documents
  using hnsw (content_embedding vector_cosine_ops)
  where content_embedding is not null;
