-- Execute este SQL no SQL Editor do Supabase.
-- A service role key deve ficar somente no backend, nunca no frontend.
create table if not exists sugestoes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists turmas (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists docentes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists ambientes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists aulas (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists utilizacao (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);