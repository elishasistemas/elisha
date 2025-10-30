-- Migration: Create Core Tables for Elisha System
-- Version: 0.3.0
-- Description: Creates all main tables (empresas, profiles, clientes, equipamentos, colaboradores, ordens_servico)

-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. CREATE EMPRESAS TABLE
-- ============================================

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  constraint empresas_cnpj_format check (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$')
);

-- Indexes
create index if not exists empresas_cnpj_idx on public.empresas (cnpj);
create index if not exists empresas_created_at_idx on public.empresas (created_at desc);

-- Comments
comment on table public.empresas is 'Empresas cadastradas no sistema';
comment on column public.empresas.cnpj is 'CNPJ no formato XX.XXX.XXX/XXXX-XX';
comment on column public.empresas.logo_url is 'URL pública do logo da empresa no Storage';

-- Enable RLS
alter table public.empresas enable row level security;

-- ============================================
-- 2. CREATE PROFILES TABLE
-- ============================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete set null,
  nome text,
  funcao text,
  role text not null default 'tecnico' check (role in ('admin', 'gestor', 'tecnico')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_empresa_id_idx on public.profiles (empresa_id);
create index if not exists profiles_role_idx on public.profiles (role);

-- Comments
comment on table public.profiles is 'Perfis de usuários com vínculo a empresas';
comment on column public.profiles.user_id is 'Referência ao usuário do Supabase Auth';
comment on column public.profiles.role is 'Papel do usuário: admin, gestor ou tecnico';

-- Enable RLS
alter table public.profiles enable row level security;

-- ============================================
-- 3. CREATE CLIENTES TABLE
-- ============================================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome_local text not null,
  cnpj text not null,
  endereco_completo text,
  responsavel_nome text,
  responsavel_telefone text,
  responsavel_email text,
  data_inicio_contrato date,
  data_fim_contrato date,
  status_contrato text not null default 'ativo' check (status_contrato in ('ativo', 'em_renovacao', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_cnpj_format check (cnpj ~ '^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$'),
  constraint clientes_email_format check (responsavel_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or responsavel_email is null)
);

-- Indexes
create index if not exists clientes_empresa_id_idx on public.clientes (empresa_id);
create index if not exists clientes_cnpj_idx on public.clientes (cnpj);
create index if not exists clientes_status_idx on public.clientes (status_contrato);
create index if not exists clientes_created_at_idx on public.clientes (created_at desc);

-- Comments
comment on table public.clientes is 'Clientes das empresas (multi-tenant por empresa_id)';
comment on column public.clientes.nome_local is 'Nome fantasia ou razão social do cliente';
comment on column public.clientes.status_contrato is 'Status do contrato: ativo, em_renovacao, encerrado';

-- Enable RLS
alter table public.clientes enable row level security;

-- ============================================
-- 4. CREATE EQUIPAMENTOS TABLE
-- ============================================

create table if not exists public.equipamentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete set null,
  tipo text,
  fabricante text,
  modelo text,
  numero_serie text,
  ano_instalacao integer,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipamentos_ano_valido check (ano_instalacao is null or (ano_instalacao >= 1900 and ano_instalacao <= extract(year from now()) + 1))
);

-- Indexes
create index if not exists equipamentos_cliente_id_idx on public.equipamentos (cliente_id);
create index if not exists equipamentos_empresa_id_idx on public.equipamentos (empresa_id);
create index if not exists equipamentos_ativo_idx on public.equipamentos (ativo);
create index if not exists equipamentos_numero_serie_idx on public.equipamentos (numero_serie);

-- Comments
comment on table public.equipamentos is 'Equipamentos dos clientes';
comment on column public.equipamentos.ativo is 'Indica se o equipamento está em operação';

-- Enable RLS
alter table public.equipamentos enable row level security;

-- ============================================
-- 5. CREATE COLABORADORES TABLE
-- ============================================

create table if not exists public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  funcao text,
  telefone text,
  whatsapp_numero text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists colaboradores_empresa_id_idx on public.colaboradores (empresa_id);
create index if not exists colaboradores_ativo_idx on public.colaboradores (ativo);
create index if not exists colaboradores_nome_idx on public.colaboradores (nome);

-- Comments
comment on table public.colaboradores is 'Técnicos e colaboradores das empresas';
comment on column public.colaboradores.ativo is 'Indica se o colaborador está ativo na empresa';
comment on column public.colaboradores.whatsapp_numero is 'Número do WhatsApp para contato';

-- Enable RLS
alter table public.colaboradores enable row level security;

-- ============================================
-- 6. CREATE ORDENS_SERVICO TABLE
-- ============================================

-- Enums como check constraints
create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  equipamento_id uuid not null references public.equipamentos (id) on delete cascade,
  tecnico_id uuid references public.colaboradores (id) on delete set null,
  empresa_id uuid references public.empresas (id) on delete set null,
  tipo text not null check (tipo in ('preventiva', 'corretiva', 'emergencial', 'chamado')),
  prioridade text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  status text not null default 'novo' check (status in ('novo', 'em_andamento', 'aguardando_assinatura', 'concluido', 'cancelado', 'parado')),
  data_abertura timestamptz not null default now(),
  data_inicio timestamptz,
  data_fim timestamptz,
  data_programada timestamptz,
  observacoes text,
  origem text not null default 'painel' check (origem in ('whatsapp', 'painel')),
  numero_os text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ordens_servico_datas_logicas check (
    (data_inicio is null or data_inicio >= data_abertura) and
    (data_fim is null or data_inicio is null or data_fim >= data_inicio)
  )
);

-- Indexes
create index if not exists ordens_servico_cliente_id_idx on public.ordens_servico (cliente_id);
create index if not exists ordens_servico_equipamento_id_idx on public.ordens_servico (equipamento_id);
create index if not exists ordens_servico_tecnico_id_idx on public.ordens_servico (tecnico_id);
create index if not exists ordens_servico_empresa_id_idx on public.ordens_servico (empresa_id);
create index if not exists ordens_servico_status_idx on public.ordens_servico (status);
create index if not exists ordens_servico_tipo_idx on public.ordens_servico (tipo);
create index if not exists ordens_servico_prioridade_idx on public.ordens_servico (prioridade);
create index if not exists ordens_servico_created_at_idx on public.ordens_servico (created_at desc);
create index if not exists ordens_servico_numero_os_idx on public.ordens_servico (numero_os);

-- Comments
comment on table public.ordens_servico is 'Ordens de serviço para manutenção de equipamentos';
comment on column public.ordens_servico.tipo is 'Tipo de serviço: preventiva, corretiva, emergencial, chamado';
comment on column public.ordens_servico.prioridade is 'Prioridade: alta, media, baixa';
comment on column public.ordens_servico.status is 'Status: novo, em_andamento, aguardando_assinatura, concluido, cancelado, parado';
comment on column public.ordens_servico.origem is 'Origem da OS: whatsapp, painel';
comment on column public.ordens_servico.numero_os is 'Número sequencial da OS (gerado pela empresa)';

-- Enable RLS
alter table public.ordens_servico enable row level security;

-- ============================================
-- 7. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================

-- Função para atualizar updated_at automaticamente
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers para cada tabela com updated_at
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_clientes_updated_at on public.clientes;
create trigger update_clientes_updated_at before update on public.clientes
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_equipamentos_updated_at on public.equipamentos;
create trigger update_equipamentos_updated_at before update on public.equipamentos
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_colaboradores_updated_at on public.colaboradores;
create trigger update_colaboradores_updated_at before update on public.colaboradores
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_ordens_servico_updated_at on public.ordens_servico;
create trigger update_ordens_servico_updated_at before update on public.ordens_servico
  for each row execute function public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

grant usage on schema public to anon, authenticated;
grant all on public.empresas to authenticated;
grant all on public.profiles to authenticated;
grant all on public.clientes to authenticated;
grant all on public.equipamentos to authenticated;
grant all on public.colaboradores to authenticated;
grant all on public.ordens_servico to authenticated;

-- ============================================
-- 9. CREATE FUNCTION TO AUTO-CREATE PROFILE
-- ============================================

-- Função para criar profile automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, created_at, updated_at)
  values (new.id, now(), now());
  return new;
end;
$$;

-- Trigger para criar profile ao criar usuário
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verificação rápida
do $$
begin
  raise notice '✅ Migration 002 completed successfully!';
  raise notice 'Tables created: empresas, profiles, clientes, equipamentos, colaboradores, ordens_servico';
  raise notice 'RLS enabled on all tables';
  raise notice 'Triggers created for updated_at columns';
end $$;

