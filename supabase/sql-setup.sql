-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents (使用 embeddings 表名以匹配代码)
create table if not exists embeddings (
  id bigserial primary key,
  content text, -- corresponds to Document.pageContent
  metadata jsonb, -- corresponds to Document.metadata
  embedding vector(1536) -- 1536 works for OpenAI embeddings, change if needed
);

-- Create a function to search for documents (使用 match_embeddings 函数名以匹配代码)
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_count int DEFAULT null,
  filter jsonb DEFAULT '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  embedding jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    (embedding::text)::jsonb as embedding,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where metadata @> filter
  order by embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;