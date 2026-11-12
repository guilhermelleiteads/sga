-- Executar no SQL Editor do Supabase para armazenar data e hora da solicitação.
-- Datas existentes são preservadas como meia-noite no fuso de São Paulo.
alter table public.sugestoes_manutencao
  alter column criadoem drop default;

alter table public.sugestoes_manutencao
  alter column criadoem type timestamp with time zone
  using criadoem::timestamp at time zone 'America/Sao_Paulo';

alter table public.sugestoes_manutencao
  alter column criadoem set default now();
