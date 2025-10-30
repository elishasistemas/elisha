-- ============================================
-- TODAS AS MIGRATIONS DA BRANCH DEV (v2 - IDEMPOTENTE)
-- Pode ser executado múltiplas vezes sem erros
-- ============================================


-- ============================================
-- Migration: 001_create_core_tables.sql
-- ============================================

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



-- ============================================
-- Migration: 002_create_rls_policies.sql
-- ============================================

-- Migration: Create RLS Policies for Multi-Tenant Isolation
-- Version: 0.3.0
-- Description: Implements Row Level Security policies for all core tables

-- ============================================
-- 1. RLS POLICIES FOR EMPRESAS
-- ============================================

-- Usuários autenticados podem ver empresas às quais pertencem
create policy "Users can view their own empresa"
on public.empresas for select
to authenticated
using (
  id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
);

-- Apenas admins podem criar empresas (via convite do sistema)
create policy "Only admins can create empresas"
on public.empresas for insert
to authenticated
with check (
  exists (
    select 1 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- Apenas admins da empresa podem atualizar
create policy "Admins can update their empresa"
on public.empresas for update
to authenticated
using (
  id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
)
with check (
  id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- Apenas admins podem deletar (raro, cuidado!)
create policy "Admins can delete their empresa"
on public.empresas for delete
to authenticated
using (
  id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- ============================================
-- 2. RLS POLICIES FOR PROFILES
-- ============================================

-- Usuários podem ver perfis da mesma empresa
create policy "Users can view profiles from same empresa"
on public.profiles for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
  or user_id = auth.uid()
);

-- Usuários podem atualizar o próprio perfil (não pode mudar empresa_id ou role)
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid() 
  and empresa_id = (select empresa_id from public.profiles where user_id = auth.uid())
  and role = (select role from public.profiles where user_id = auth.uid())
);

-- Admins podem atualizar perfis da mesma empresa
create policy "Admins can update profiles from same empresa"
on public.profiles for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- Perfis são criados automaticamente via trigger ou via sistema de convites
-- Não permitir insert manual
create policy "Profiles created via trigger or invite system only"
on public.profiles for insert
to authenticated
with check (false);

-- ============================================
-- 3. RLS POLICIES FOR CLIENTES
-- ============================================

-- Usuários podem ver clientes da mesma empresa
create policy "Users can view clientes from same empresa"
on public.clientes for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
);

-- Admin e gestor podem criar clientes
create policy "Admins and gestores can create clientes"
on public.clientes for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
);

-- Admin e gestor podem atualizar clientes da mesma empresa
create policy "Admins and gestores can update clientes"
on public.clientes for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
);

-- Apenas admins podem deletar clientes
create policy "Only admins can delete clientes"
on public.clientes for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- ============================================
-- 4. RLS POLICIES FOR EQUIPAMENTOS
-- ============================================

-- Usuários podem ver equipamentos dos clientes da mesma empresa
create policy "Users can view equipamentos from same empresa"
on public.equipamentos for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
  or cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
);

-- Admin e gestor podem criar equipamentos
create policy "Admins and gestores can create equipamentos"
on public.equipamentos for insert
to authenticated
with check (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and role in ('admin', 'gestor')
    )
  )
);

-- Admin, gestor e técnico podem atualizar equipamentos
create policy "Users can update equipamentos from same empresa"
on public.equipamentos for update
to authenticated
using (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
)
with check (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
);

-- Apenas admins podem deletar equipamentos
create policy "Only admins can delete equipamentos"
on public.equipamentos for delete
to authenticated
using (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and role = 'admin'
    )
  )
);

-- ============================================
-- 5. RLS POLICIES FOR COLABORADORES
-- ============================================

-- Usuários podem ver colaboradores da mesma empresa
create policy "Users can view colaboradores from same empresa"
on public.colaboradores for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
);

-- Admin e gestor podem criar colaboradores
create policy "Admins and gestores can create colaboradores"
on public.colaboradores for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
);

-- Admin e gestor podem atualizar colaboradores
create policy "Admins and gestores can update colaboradores"
on public.colaboradores for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role in ('admin', 'gestor')
  )
);

-- Apenas admins podem deletar colaboradores
create policy "Only admins can delete colaboradores"
on public.colaboradores for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- ============================================
-- 6. RLS POLICIES FOR ORDENS_SERVICO
-- ============================================

-- Usuários podem ver OS da mesma empresa
create policy "Users can view ordens_servico from same empresa"
on public.ordens_servico for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
  )
  or cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
);

-- Admin, gestor e técnico podem criar OS
create policy "Users can create ordens_servico"
on public.ordens_servico for insert
to authenticated
with check (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
);

-- Admin, gestor e técnico atribuído podem atualizar OS
create policy "Users can update ordens_servico from same empresa"
on public.ordens_servico for update
to authenticated
using (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
  or tecnico_id in (
    select id 
    from public.colaboradores 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
)
with check (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
    )
  )
);

-- Apenas admins e gestores podem deletar OS
create policy "Admins and gestores can delete ordens_servico"
on public.ordens_servico for delete
to authenticated
using (
  cliente_id in (
    select id 
    from public.clientes 
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and role in ('admin', 'gestor')
    )
  )
);

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

do $$
declare
  policy_count integer;
begin
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'public'
  and tablename in ('empresas', 'profiles', 'clientes', 'equipamentos', 'colaboradores', 'ordens_servico');
  
  raise notice '✅ Migration 003 completed successfully!';
  raise notice 'Total RLS policies created: %', policy_count;
  raise notice 'Tables protected: empresas, profiles, clientes, equipamentos, colaboradores, ordens_servico';
  raise notice 'Multi-tenant isolation: ✓ Enabled';
  raise notice 'Role-based access: ✓ Enabled (admin, gestor, tecnico)';
end $$;



-- ============================================
-- Migration: 003_create_invites_system.sql
-- ============================================

-- Migration: Create Invites System for Multi-tenant Onboarding
-- Version: 0.2.1
-- Description: Implements invite-only signup with role assignment

-- Enable required extension
create extension if not exists pgcrypto;

-- ============================================
-- 1. CREATE INVITES TABLE
-- ============================================

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','gestor','tecnico')),
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  created_by uuid not null references auth.users (id),
  accepted_by uuid,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Add indexes for performance
create index if not exists invites_empresa_id_idx on public.invites (empresa_id);
create index if not exists invites_email_idx on public.invites (email);
create index if not exists invites_token_idx on public.invites (token);
create index if not exists invites_expires_at_idx on public.invites (expires_at);

-- Enable RLS
alter table public.invites enable row level security;

-- ============================================
-- 2. CREATE RLS POLICIES
-- ============================================

-- Admins da mesma empresa podem ver convites da sua empresa
drop policy if exists invites_select_same_empresa on public.invites;
create policy invites_select_same_empresa
on public.invites for select
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.empresa_id = invites.empresa_id
  )
);

-- Apenas admin da empresa cria convites
drop policy if exists invites_insert_admin on public.invites;
create policy invites_insert_admin
on public.invites for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.empresa_id = invites.empresa_id
      and p.role = 'admin'
  )
);

-- Admin da empresa pode revogar/alterar convites da sua empresa
drop policy if exists invites_update_admin on public.invites;
create policy invites_update_admin
on public.invites for update
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.empresa_id = invites.empresa_id
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.empresa_id = invites.empresa_id
      and p.role = 'admin'
  )
);

-- Apenas admin pode deletar
drop policy if exists invites_delete_admin on public.invites;
create policy invites_delete_admin
on public.invites for delete
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and p.empresa_id = invites.empresa_id
      and p.role = 'admin'
  )
);

-- ============================================
-- 3. CREATE RPC: create_invite
-- ============================================

create or replace function public.create_invite(
  p_empresa_id uuid, 
  p_email text, 
  p_role text, 
  p_expires_days int default 7
)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_is_admin boolean;
begin
  -- Checa admin da empresa
  select exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid())
      and pr.empresa_id = p_empresa_id
      and pr.role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can create invites for this empresa';
  end if;

  -- Valida role
  if p_role not in ('admin', 'gestor', 'tecnico') then
    raise exception 'Invalid role: must be admin, gestor, or tecnico';
  end if;

  -- Cria convite
  insert into public.invites (empresa_id, email, role, created_by, expires_at)
  values (
    p_empresa_id, 
    trim(lower(p_email)), 
    p_role, 
    (select auth.uid()), 
    now() + (p_expires_days || ' days')::interval
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

-- ============================================
-- 4. CREATE RPC: accept_invite
-- ============================================

create or replace function public.accept_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_user uuid := (select auth.uid());
  v_profile_exists boolean;
begin
  -- Valida usuário autenticado
  if v_user is null then
    raise exception 'User not authenticated';
  end if;

  -- Pega convite válido
  select * into v_invite
  from public.invites
  where token = p_token
    and status = 'pending'
  limit 1;

  if v_invite.id is null then
    raise exception 'Invalid or already used token';
  end if;

  if v_invite.expires_at < now() then
    update public.invites set status = 'expired' where id = v_invite.id;
    raise exception 'Invite expired';
  end if;

  -- Garante profile
  select exists(
    select 1 from public.profiles pr where pr.user_id = v_user
  ) into v_profile_exists;

  if not v_profile_exists then
    -- Cria profile novo
    insert into public.profiles (user_id, empresa_id, role, created_at)
    values (v_user, v_invite.empresa_id, v_invite.role, now())
    on conflict (user_id) do update 
    set empresa_id = excluded.empresa_id, 
        role = excluded.role;
  else
    -- Atualiza profile existente
    update public.profiles
    set empresa_id = v_invite.empresa_id,
        role = v_invite.role
    where user_id = v_user;
  end if;

  -- Marca convite como aceito
  update public.invites
  set status = 'accepted',
      accepted_by = v_user,
      accepted_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'success', true,
    'empresa_id', v_invite.empresa_id,
    'role', v_invite.role
  );
end;
$$;

-- ============================================
-- 5. CREATE RPC: revoke_invite (optional)
-- ============================================

create or replace function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_is_admin boolean;
begin
  -- Busca convite
  select * into v_invite
  from public.invites
  where id = p_invite_id;

  if v_invite.id is null then
    raise exception 'Invite not found';
  end if;

  -- Checa se usuário é admin da empresa
  select exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid())
      and pr.empresa_id = v_invite.empresa_id
      and pr.role = 'admin'
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can revoke invites';
  end if;

  -- Revoga convite
  update public.invites
  set status = 'revoked'
  where id = p_invite_id;
end;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

grant usage on schema public to anon, authenticated;
grant all on public.invites to authenticated;
grant execute on function public.create_invite to authenticated;
grant execute on function public.accept_invite to authenticated;
grant execute on function public.revoke_invite to authenticated;

comment on table public.invites is 'Convites para cadastro de usuários por empresa';
comment on function public.create_invite is 'Cria convite para novo usuário (apenas admin)';
comment on function public.accept_invite is 'Aceita convite e associa usuário à empresa';
comment on function public.revoke_invite is 'Revoga um convite pendente (apenas admin)';



-- ============================================
-- Migration: 004_create_checklist_system.sql
-- ============================================

-- Migration: Create Checklist System with Immutable Snapshots
-- Version: 1.0.0
-- Description: Implements checklist system for OS with ABNT-ready structure

-- Enable required extensions (idempotent)
create extension if not exists pgcrypto;

-- ============================================
-- 1. HELPER FUNCTION FOR CURRENT_EMPRESA_ID
-- ============================================

-- Create function to get current user's empresa_id (if not exists)
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
as $$
  select empresa_id 
  from public.profiles 
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================
-- 2. CREATE CHECKLISTS TABLE (TEMPLATES)
-- ============================================

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  tipo_servico text not null check (tipo_servico in ('preventiva', 'corretiva', 'emergencial', 'chamado', 'todos')),
  itens jsonb not null default '[]'::jsonb,
  versao integer not null default 1,
  origem text not null default 'custom' check (origem in ('abnt', 'custom', 'elisha')),
  abnt_refs text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklists_versao_min check (versao >= 1)
);

-- Indexes
create index if not exists idx_checklists_empresa_id on public.checklists(empresa_id);
create index if not exists idx_checklists_empresa_tipo_ativo on public.checklists(empresa_id, tipo_servico, ativo);
create index if not exists idx_checklists_tipo_servico on public.checklists(tipo_servico);
create index if not exists idx_checklists_ativo on public.checklists(ativo);

-- Comments
comment on table public.checklists is 'Templates de checklists reutilizáveis';
comment on column public.checklists.itens is 'Array JSON com itens do checklist [{ordem, secao, descricao, tipo, obrigatorio, critico, ...}]';
comment on column public.checklists.versao is 'Versão do template (incrementa a cada alteração)';
comment on column public.checklists.origem is 'Origem: abnt (normas), custom (customizado), elisha (padrão sistema)';
comment on column public.checklists.abnt_refs is 'Referências às normas ABNT aplicáveis';

-- Enable RLS
alter table public.checklists enable row level security;

-- ============================================
-- 3. CREATE OS_CHECKLISTS TABLE (SNAPSHOTS)
-- ============================================

create table if not exists public.os_checklists (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  checklist_id uuid null references public.checklists(id) on delete set null,
  template_snapshot jsonb not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  responsavel_id uuid null references public.colaboradores(id) on delete set null,
  empresa_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint os_checklists_completed_after_started check (completed_at is null or completed_at >= started_at)
);

-- Unique constraint: one checklist snapshot per OS
create unique index if not exists os_checklists_os_uidx on public.os_checklists(os_id);

-- Indexes
create index if not exists os_checklists_empresa_idx on public.os_checklists(empresa_id);
create index if not exists os_checklists_checklist_idx on public.os_checklists(checklist_id);
create index if not exists os_checklists_os_idx on public.os_checklists(os_id);
create index if not exists os_checklists_completed_idx on public.os_checklists(completed_at);

-- Comments
comment on table public.os_checklists is 'Snapshots imutáveis de checklists vinculados a OS';
comment on column public.os_checklists.template_snapshot is 'Snapshot completo do template no momento da vinculação';
comment on column public.os_checklists.checklist_id is 'Referência ao template original (pode ser null se template for deletado)';

-- Enable RLS
alter table public.os_checklists enable row level security;

-- ============================================
-- 4. CREATE CHECKLIST_RESPOSTAS TABLE
-- ============================================

create table if not exists public.checklist_respostas (
  id uuid primary key default gen_random_uuid(),
  os_checklist_id uuid null references public.os_checklists(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  item_ordem integer not null,
  descricao text not null,
  status_item text not null default 'pendente' check (status_item in ('pendente', 'conforme', 'nao_conforme', 'na')),
  valor_boolean boolean null,
  valor_text text null,
  valor_number numeric null,
  observacoes text null,
  fotos_urls text[] not null default '{}',
  assinatura_url text null,
  respondido_por uuid null references public.colaboradores(id) on delete set null,
  respondido_em timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_respostas_ordem_min check (item_ordem >= 1)
);

-- Drop old unique constraint if exists and create new one
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name='checklist_respostas'
      and constraint_name='checklist_respostas_os_id_item_ordem_key'
  ) then
    alter table public.checklist_respostas
      drop constraint checklist_respostas_os_id_item_ordem_key;
  end if;
end$$;

-- New unique constraint per snapshot
create unique index if not exists checklist_respostas_unique_item 
  on public.checklist_respostas(os_checklist_id, item_ordem) 
  where os_checklist_id is not null;

-- Indexes
create index if not exists checklist_respostas_os_checklist_idx on public.checklist_respostas(os_checklist_id);
create index if not exists checklist_respostas_os_idx on public.checklist_respostas(os_id);
create index if not exists checklist_respostas_status_idx on public.checklist_respostas(status_item);
create index if not exists checklist_respostas_respondido_idx on public.checklist_respostas(respondido_por);

-- Comments
comment on table public.checklist_respostas is 'Respostas dos itens de checklist por OS';
comment on column public.checklist_respostas.os_checklist_id is 'Referência ao snapshot do checklist';
comment on column public.checklist_respostas.status_item is 'Status: pendente, conforme, nao_conforme, na (não aplicável)';
comment on column public.checklist_respostas.fotos_urls is 'URLs das fotos de evidência';

-- Enable RLS
alter table public.checklist_respostas enable row level security;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger to auto-populate empresa_id from OS
create or replace function public.osc_set_empresa_id()
returns trigger 
language plpgsql 
as $$
begin
  if new.empresa_id is null then
    select o.empresa_id into new.empresa_id
    from public.ordens_servico o
    where o.id = new.os_id;
  end if;
  return new;
end$$;

drop trigger if exists t_bi_osc on public.os_checklists;
create trigger t_bi_osc 
  before insert on public.os_checklists
  for each row 
  execute function public.osc_set_empresa_id();

-- Trigger for updated_at on checklists
drop trigger if exists update_checklists_updated_at on public.checklists;
create trigger update_checklists_updated_at 
  before update on public.checklists
  for each row 
  execute function public.update_updated_at_column();

-- Trigger for updated_at on os_checklists
drop trigger if exists update_os_checklists_updated_at on public.os_checklists;
create trigger update_os_checklists_updated_at 
  before update on public.os_checklists
  for each row 
  execute function public.update_updated_at_column();

-- Trigger for updated_at on checklist_respostas
drop trigger if exists update_checklist_respostas_updated_at on public.checklist_respostas;
create trigger update_checklist_respostas_updated_at 
  before update on public.checklist_respostas
  for each row 
  execute function public.update_updated_at_column();

-- ============================================
-- 6. RLS POLICIES FOR CHECKLISTS
-- ============================================

-- Users can view checklists from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_sel_emp' and tablename = 'checklists'
  ) then
    create policy checklists_sel_emp on public.checklists
      for select using (empresa_id = current_empresa_id());
  end if;
end$$;

-- Admins and gestores can create checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_ins_emp' and tablename = 'checklists'
  ) then
    create policy checklists_ins_emp on public.checklists
      for insert with check (
        empresa_id = current_empresa_id() 
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- Admins and gestores can update checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_upd_emp' and tablename = 'checklists'
  ) then
    create policy checklists_upd_emp on public.checklists
      for update using (
        empresa_id = current_empresa_id()
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- Admins can delete checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_del_emp' and tablename = 'checklists'
  ) then
    create policy checklists_del_emp on public.checklists
      for delete using (
        empresa_id = current_empresa_id()
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role = 'admin'
        )
      );
  end if;
end$$;

-- ============================================
-- 7. RLS POLICIES FOR OS_CHECKLISTS
-- ============================================

-- Users can view snapshots from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_sel_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_sel_emp on public.os_checklists
      for select using (empresa_id = current_empresa_id());
  end if;
end$$;

-- Users can create snapshots for OS of their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_ins_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_ins_emp on public.os_checklists
      for insert with check (empresa_id = current_empresa_id());
  end if;
end$$;

-- Users can update snapshots from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_upd_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_upd_emp on public.os_checklists
      for update using (empresa_id = current_empresa_id());
  end if;
end$$;

-- ============================================
-- 8. RLS POLICIES FOR CHECKLIST_RESPOSTAS
-- ============================================

-- Users can view responses from their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_sel_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_sel_emp on public.checklist_respostas
      for select using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Users can create responses for their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_ins_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_ins_emp on public.checklist_respostas
      for insert with check (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Users can update responses from their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_upd_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_upd_emp on public.checklist_respostas
      for update using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Admins and gestores can delete responses
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_del_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_del_emp on public.checklist_respostas
      for delete using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

grant usage on schema public to anon, authenticated;
grant all on public.checklists to authenticated;
grant all on public.os_checklists to authenticated;
grant all on public.checklist_respostas to authenticated;

-- ============================================
-- 10. VERIFICATION & SUMMARY
-- ============================================

do $$
declare
  checklist_count integer;
  snapshot_count integer;
  resposta_count integer;
begin
  -- Count tables
  select count(*) into checklist_count from information_schema.tables where table_name = 'checklists';
  select count(*) into snapshot_count from information_schema.tables where table_name = 'os_checklists';
  select count(*) into resposta_count from information_schema.tables where table_name = 'checklist_respostas';
  
  raise notice '✅ Migration 004 completed successfully!';
  raise notice 'Tables created/updated:';
  raise notice '  - checklists (templates): %', checklist_count;
  raise notice '  - os_checklists (snapshots): %', snapshot_count;
  raise notice '  - checklist_respostas (responses): %', resposta_count;
  raise notice 'Features:';
  raise notice '  ✓ Immutable snapshots per OS';
  raise notice '  ✓ ABNT-ready structure (versão, origem, refs)';
  raise notice '  ✓ RLS enabled on all tables';
  raise notice '  ✓ Multi-tenant isolation by empresa_id';
  raise notice '  ✓ Idempotent migration';
end $$;



-- ============================================
-- Migration: 20251021000000_empresa_dual_approval.sql
-- ============================================

-- Campo opcional para exigir dupla aprovação em empresas
alter table public.empresas
  add column if not exists require_dual_approval boolean not null default false;



-- ============================================
-- Migration: 20251021000001_os_ordering_view.sql
-- ============================================

-- View com pesos de status e prioridade para ordenação custom
create or replace view public.ordens_servico_enriquecida as
select
  os.*,
  case os.status
    when 'parado' then 0
    when 'novo' then 1
    when 'em_andamento' then 2
    when 'aguardando_assinatura' then 3
    when 'concluido' then 4
    when 'cancelado' then 5
    else 6
  end as peso_status,
  case os.prioridade
    when 'alta' then 1
    when 'media' then 2
    when 'baixa' then 3
    else 4
  end as peso_prioridade
from public.ordens_servico os;

-- Garantir que a view respeite RLS da base (por padrão, views respeitam RLS das tabelas subjacentes)

-- Config extra: habilitar RLS já feito na migration anterior.



-- ============================================
-- Migration: 20251021000002_rls_more_tables.sql
-- ============================================

-- RLS adicionais seguindo padrão do brief

-- os_checklists
alter table if exists public.os_checklists enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='os_checklists' and polname='os_checklists_select') then
    create policy os_checklists_select on public.os_checklists for select
      using (
        empresa_id = public.current_empresa_id()
        and (
          public.current_active_role() = 'gestor'
          or (
            public.current_active_role() = 'tecnico'
            and exists (
              select 1 from public.ordens_servico os
              where os.id = os_checklists.os_id
                and os.tecnico_id = public.current_tecnico_id()
            )
          )
        )
      );
  end if;
end$$;

-- checklist_respostas
alter table if exists public.checklist_respostas enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='checklist_respostas' and polname='checklist_respostas_select') then
    create policy checklist_respostas_select on public.checklist_respostas for select
      using (
        exists (
          select 1 from public.os_checklists oc
          join public.ordens_servico os on os.id = oc.os_id
          where oc.id = checklist_respostas.os_checklist_id
            and oc.empresa_id = public.current_empresa_id()
            and (
              public.current_active_role() = 'gestor' or (
                public.current_active_role() = 'tecnico' and os.tecnico_id = public.current_tecnico_id()
              )
            )
        )
      );
  end if;
end$$;

-- clientes (acesso por empresa)
alter table if exists public.clientes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='clientes' and polname='clientes_select') then
    create policy clientes_select on public.clientes for select
      using (
        empresa_id = public.current_empresa_id()
      );
  end if;
end$$;



-- ============================================
-- Migration: 20251021000003_roles_active_role.sql
-- ============================================

-- Perfis com papéis múltiplos e modo ativo (adaptado para tabela 'profiles')
alter table public.profiles
  add column if not exists roles text[] not null default '{}',
  add column if not exists active_role text check (active_role in ('gestor','tecnico') or active_role is null),
  add column if not exists tecnico_id uuid;

-- Helpers de contexto (JWT claims)
create or replace function public.current_active_role() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'active_role','')
$$;

create or replace function public.current_tecnico_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'tecnico_id','')::uuid
$$;

create or replace function public.current_empresa_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'empresa_id','')::uuid
$$;

-- RLS nas ordens de serviço (exemplo)
alter table public.ordens_servico enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='ordens_servico' and polname='os_select') then
    create policy os_select on public.ordens_servico for select
      using (
        empresa_id = public.current_empresa_id()
        and (
          public.current_active_role() = 'gestor'
          or (public.current_active_role() = 'tecnico' and tecnico_id = public.current_tecnico_id())
        )
      );
  end if;
end$$;

-- Replicar o padrão de RLS conforme necessário:
--   os_checklists, checklist_respostas, orcamentos, clientes, contratos, sites



-- ============================================
-- Migration: 20251022000000_add_user_id_to_profiles.sql
-- ============================================

-- Migration: Adicionar coluna user_id à tabela profiles
-- Data: 2025-10-22
-- Descrição: A tabela profiles atualmente usa 'id' como FK para auth.users
--            Esta migration adiciona 'user_id' como coluna explícita e popula com dados do 'id'

-- Passo 1: Adicionar coluna user_id (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- Adicionar coluna user_id como cópia do id
    ALTER TABLE public.profiles 
    ADD COLUMN user_id uuid;
    
    -- Popular user_id com o valor do id
    UPDATE public.profiles 
    SET user_id = id;
    
    -- Tornar coluna NOT NULL
    ALTER TABLE public.profiles 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Adicionar constraint UNIQUE
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    
    -- Adicionar FK para auth.users
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    -- Criar índice
    CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
    
    RAISE NOTICE 'Coluna user_id adicionada e populada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna user_id já existe. Nada a fazer.';
  END IF;
END $$;

-- Passo 2: Atualizar comentários
COMMENT ON COLUMN public.profiles.id IS 'Chave primária do registro (pode ser diferente de user_id em casos especiais)';
COMMENT ON COLUMN public.profiles.user_id IS 'FK para auth.users - ID do usuário no sistema de autenticação';

-- Passo 3: Verificar consistência dos dados
DO $$
DECLARE
  v_count_inconsistent integer;
BEGIN
  -- Verificar se há registros onde id != user_id
  SELECT COUNT(*) INTO v_count_inconsistent
  FROM public.profiles
  WHERE id != user_id;
  
  IF v_count_inconsistent > 0 THEN
    RAISE WARNING 'Atenção: % registros com id != user_id encontrados', v_count_inconsistent;
  ELSE
    RAISE NOTICE 'Todos os registros estão consistentes (id = user_id)';
  END IF;
END $$;



-- ============================================
-- Migration: 20251022000001_fix_active_role_constraint.sql
-- ============================================

-- Fix active_role constraint to allow admin and elisha_admin
-- Migration: 2025-10-22-fix-active-role-constraint.sql

-- 1. Drop existing constraint
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_active_role_check;

-- 2. Add new constraint with all valid roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_role_check 
  CHECK (active_role IN ('admin', 'gestor', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- 3. Update comment
COMMENT ON COLUMN public.profiles.active_role IS 'Papel ativo do usuário: admin, gestor, tecnico, ou elisha_admin';



-- ============================================
-- Migration: 20251022000002_fix_empresas_select_for_anon.sql
-- ============================================

-- Allow anonymous users to read empresas table (for signup page)
-- The existing policy calls is_elisha_admin() which tries to access profiles
-- This fails for anonymous users

-- Create a simple policy for anonymous users
CREATE POLICY empresas_select_anon
ON public.empresas FOR SELECT
TO anon
USING (true);  -- Allow reading all empresas for signup page

COMMENT ON POLICY empresas_select_anon ON public.empresas IS 
  'Allow anonymous users to read empresa names for signup page (not sensitive data)';



-- ============================================
-- Migration: 20251022000003_fix_invite_permissions.sql
-- ============================================

-- Fix create_invite function to check active_role and is_elisha_admin
-- Also fix RLS policies

-- ============================================
-- 1. Fix RPC: create_invite
-- ============================================

create or replace function public.create_invite(
  p_empresa_id uuid, 
  p_email text, 
  p_role text, 
  p_expires_days int default 7
)
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_is_admin boolean;
begin
  -- Checa admin da empresa (active_role OU roles array OU is_elisha_admin)
  select exists (
    select 1 from public.profiles pr
    where pr.id = (select auth.uid())
      and (
        -- Super admin pode criar convites para qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode criar convites
        (
          pr.empresa_id = p_empresa_id
          and (
            pr.active_role = 'admin' 
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode criar convites
        (
          pr.is_elisha_admin = true
          and pr.impersonating_empresa_id = p_empresa_id
          and (
            pr.active_role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
      )
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can create invites for this empresa';
  end if;

  -- Valida role
  if p_role not in ('admin', 'gestor', 'tecnico') then
    raise exception 'Invalid role: must be admin, gestor, or tecnico';
  end if;

  -- Cria convite
  insert into public.invites (empresa_id, email, role, created_by, expires_at)
  values (
    p_empresa_id, 
    trim(lower(p_email)), 
    p_role, 
    (select auth.uid()), 
    now() + (p_expires_days || ' days')::interval
  )
  returning * into v_invite;

  return v_invite;
end;
$$;

-- ============================================
-- 2. Fix RLS Policies
-- ============================================

-- Drop old policies
drop policy if exists invites_insert_admin on public.invites;
drop policy if exists invites_update_admin on public.invites;
drop policy if exists invites_delete_admin on public.invites;

-- Recreate with correct checks
create policy invites_insert_admin
on public.invites for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and (
        -- Super admin
        p.is_elisha_admin = true
        OR
        -- Admin da mesma empresa
        (
          p.empresa_id = invites.empresa_id
          and (
            p.active_role = 'admin' 
            OR p.role = 'admin'
            OR 'admin' = ANY(p.roles)
          )
        )
        OR
        -- Super admin impersonando
        (
          p.is_elisha_admin = true
          and p.impersonating_empresa_id = invites.empresa_id
          and (
            p.active_role = 'admin'
            OR 'admin' = ANY(p.roles)
          )
        )
      )
  )
);

create policy invites_update_admin
on public.invites for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.is_elisha_admin = true
        OR
        (
          p.empresa_id = invites.empresa_id
          and (
            p.active_role = 'admin' 
            OR p.role = 'admin'
            OR 'admin' = ANY(p.roles)
          )
        )
        OR
        (
          p.is_elisha_admin = true
          and p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.is_elisha_admin = true
        OR
        (
          p.empresa_id = invites.empresa_id
          and (
            p.active_role = 'admin' 
            OR p.role = 'admin'
            OR 'admin' = ANY(p.roles)
          )
        )
        OR
        (
          p.is_elisha_admin = true
          and p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
);

create policy invites_delete_admin
on public.invites for delete
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and (
        p.is_elisha_admin = true
        OR
        (
          p.empresa_id = invites.empresa_id
          and (
            p.active_role = 'admin' 
            OR p.role = 'admin'
            OR 'admin' = ANY(p.roles)
          )
        )
        OR
        (
          p.is_elisha_admin = true
          and p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
);

-- Add comment
comment on function public.create_invite is 
  'Create invite for empresa. Allows: super admin, empresa admin (by active_role/roles), or super admin impersonating.';



-- ============================================
-- Migration: 20251022000004_fix_invites_created_by.sql
-- ============================================

-- Fix created_by constraint to allow NULL for super admin invites
-- Super admins can create invites without being part of the company

-- Remove NOT NULL constraint from created_by
ALTER TABLE public.invites 
  ALTER COLUMN created_by DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.invites.created_by IS 
  'User who created the invite. Can be NULL for super admin invites.';



-- ============================================
-- Migration: 20251022000005_fix_invites_public_select.sql
-- ============================================

-- Allow public (unauthenticated) users to read invites by token
-- This is needed for the signup page where users don't have an account yet

-- Create policy for anonymous users to read invites
CREATE POLICY invites_select_anonymous
ON public.invites FOR SELECT
TO anon
USING (
  -- Anonymous users can only see pending invites
  status = 'pending'
  -- No other restrictions needed - they need the UUID token anyway
);

COMMENT ON POLICY invites_select_anonymous ON public.invites IS 
  'Allow anonymous users to read pending invites for signup page';



-- ============================================
-- Migration: 20251022000006_fix_invites_select_policies_roles.sql
-- ============================================

-- Fix: Separate policies for authenticated vs anonymous users
-- The issue: invites_select_same_empresa tries to access profiles table
-- which anonymous users don't have permission to read

-- Drop existing policies
DROP POLICY IF EXISTS invites_select_same_empresa ON public.invites;
DROP POLICY IF EXISTS invites_select_anonymous ON public.invites;

-- Policy for AUTHENTICATED users (can access profiles table)
CREATE POLICY invites_select_authenticated
ON public.invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        -- Super admin pode ver convites de qualquer empresa
        p.is_elisha_admin = true
        OR
        -- Usuários da mesma empresa
        p.empresa_id = invites.empresa_id
        OR
        -- Super admin impersonando pode ver convites da empresa impersonada
        (
          p.is_elisha_admin = true
          AND p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
);

-- Policy for ANONYMOUS users (signup page)
-- Simple condition, no access to profiles table needed
CREATE POLICY invites_select_anonymous
ON public.invites FOR SELECT
TO anon
USING (
  status = 'pending'
);

COMMENT ON POLICY invites_select_authenticated ON public.invites IS 
  'Allow authenticated users to see invites from their empresa or if super admin';

COMMENT ON POLICY invites_select_anonymous ON public.invites IS 
  'Allow anonymous users to read pending invites for signup page';



-- ============================================
-- Migration: 20251022000007_fix_invites_select_rls.sql
-- ============================================

-- Fix SELECT RLS policy for invites table
-- Allow super admin and impersonating super admin to see invites

-- Drop old policy
DROP POLICY IF EXISTS invites_select_same_empresa ON public.invites;

-- Create new policy with proper checks
CREATE POLICY invites_select_same_empresa
ON public.invites FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND (
        -- Super admin pode ver convites de qualquer empresa
        p.is_elisha_admin = true
        OR
        -- Usuários da mesma empresa
        p.empresa_id = invites.empresa_id
        OR
        -- Super admin impersonando pode ver convites da empresa impersonada
        (
          p.is_elisha_admin = true
          AND p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
);

COMMENT ON POLICY invites_select_same_empresa ON public.invites IS 
  'Allow users to see invites from their empresa, or super admin (including when impersonating)';



-- ============================================
-- Migration: 20251022000008_fix_revoke_invite_permissions.sql
-- ============================================

-- Fix revoke_invite function to check active_role and is_elisha_admin
-- Similar to fix applied to create_invite

create or replace function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_is_admin boolean;
begin
  -- Busca convite
  select * into v_invite
  from public.invites
  where id = p_invite_id;

  if v_invite.id is null then
    raise exception 'Invite not found';
  end if;

  -- Checa se usuário é admin (active_role OU roles array OU is_elisha_admin)
  select exists (
    select 1 from public.profiles pr
    where pr.id = (select auth.uid())
      and (
        -- Super admin pode revogar convites de qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode revogar convites
        (
          pr.empresa_id = v_invite.empresa_id
          and (
            pr.active_role = 'admin' 
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode revogar convites
        (
          pr.is_elisha_admin = true
          and pr.impersonating_empresa_id = v_invite.empresa_id
        )
      )
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can revoke invites';
  end if;

  -- Marca convite como revogado
  update public.invites
  set status = 'revoked'
  where id = p_invite_id;
end;
$$;

comment on function public.revoke_invite is 
  'Revoke invite. Allows: super admin, empresa admin (by active_role/roles), or super admin impersonating.';



-- ============================================
-- Migration: 20251022000009_grant_empresas_select_to_anon.sql
-- ============================================

-- Grant SELECT permission on empresas table to anon role
-- This is needed in addition to the RLS policy

GRANT SELECT ON public.empresas TO anon;

COMMENT ON TABLE public.empresas IS 
  'Tabela de empresas - leitura permitida para anônimos (signup page)';



-- ============================================
-- Migration: 20251022000010_remove_gestor_role.sql
-- ============================================

-- Migration: Remover role "gestor" do sistema
-- Data: 2025-10-22
-- Descrição: Simplificação - Deixar apenas elisha_admin, admin e tecnico

-- ========================================
-- 1. ATUALIZAR USUÁRIOS GESTOR → ADMIN
-- ========================================

-- Converter todos os gestores para admin
UPDATE public.profiles
SET 
  role = 'admin',
  active_role = CASE 
    WHEN active_role = 'gestor' THEN 'admin'
    ELSE active_role
  END
WHERE role = 'gestor';

-- Atualizar array roles (remover gestor, adicionar admin se necessário)
UPDATE public.profiles
SET roles = array_remove(roles, 'gestor')
WHERE 'gestor' = ANY(roles);

UPDATE public.profiles
SET roles = array_append(roles, 'admin')
WHERE role = 'admin' AND NOT ('admin' = ANY(roles));

-- ========================================
-- 2. ATUALIZAR CONSTRAINTS
-- ========================================

-- Remover constraint antiga do role
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Adicionar constraint nova (sem gestor)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'tecnico', 'elisha_admin'));

-- Remover constraint antiga do active_role
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_active_role_check;

-- Adicionar constraint nova (sem gestor)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_role_check
CHECK (active_role IN ('admin', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- ========================================
-- 3. ATUALIZAR FUNÇÃO create_invite
-- ========================================

CREATE OR REPLACE FUNCTION public.create_invite(
  p_empresa_id uuid,
  p_email text,
  p_role text,
  p_expires_days int default 7
)
RETURNS public.invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites;
  v_is_admin boolean;
BEGIN
  -- Validar role (apenas admin e tecnico)
  IF p_role NOT IN ('admin', 'tecnico') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or tecnico';
  END IF;

  -- Checa admin da empresa (active_role OU roles array OU is_elisha_admin)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = (SELECT auth.uid())
      AND (
        -- Super admin pode criar convites para qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode criar convites
        (
          pr.empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode criar convites
        (
          pr.is_elisha_admin = true
          AND pr.impersonating_empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not allowed: only admin can create invites for this empresa';
  END IF;

  -- Cria convite
  INSERT INTO public.invites (empresa_id, email, role, token, expires_at, status, created_at)
  VALUES (
    p_empresa_id,
    lower(p_email),
    p_role,
    gen_random_uuid(),
    now() + (p_expires_days || ' days')::interval,
    'pending',
    now()
  )
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$;

-- ========================================
-- 4. ATUALIZAR COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário: admin, tecnico ou elisha_admin';
COMMENT ON COLUMN public.profiles.active_role IS 'Papel ativo do usuário: admin, tecnico ou elisha_admin';

-- ========================================
-- 5. ATUALIZAR INVITES CONSTRAINT
-- ========================================

ALTER TABLE public.invites
DROP CONSTRAINT IF EXISTS invites_role_check;

ALTER TABLE public.invites
ADD CONSTRAINT invites_role_check
CHECK (role IN ('admin', 'tecnico'));

-- ========================================
-- 6. VERIFICAÇÃO
-- ========================================

-- Verificar se ainda existem gestores
SELECT 
  COUNT(*) as total_gestores,
  COUNT(CASE WHEN role = 'gestor' THEN 1 END) as role_gestor,
  COUNT(CASE WHEN active_role = 'gestor' THEN 1 END) as active_role_gestor,
  COUNT(CASE WHEN 'gestor' = ANY(roles) THEN 1 END) as array_roles_gestor
FROM public.profiles;

-- Mostrar constraints atualizadas
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%role%'
ORDER BY conname;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

/*
VERIFICAÇÃO:
  total_gestores: X
  role_gestor: 0 ✅
  active_role_gestor: 0 ✅
  array_roles_gestor: 0 ✅

CONSTRAINTS:
  profiles_role_check: CHECK (role IN ('admin', 'tecnico', 'elisha_admin'))
  profiles_active_role_check: CHECK (active_role IN ('admin', 'tecnico', 'elisha_admin') OR active_role IS NULL)
  invites_role_check: CHECK (role IN ('admin', 'tecnico'))
*/



-- ============================================
-- Migration: 20251024000000_add_client_contract_and_equipment_fields.sql
-- ============================================

-- =====================================================
-- Migration: Add contract and equipment fields
-- Data: 2025-10-24
-- Descrição: Adicionar campos de contrato em clientes
--            e campos detalhados em equipamentos
-- =====================================================

-- ==========================================
-- 1. CLIENTES - Adicionar campos de contrato
-- ==========================================

-- Adicionar valor mensal do contrato
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS valor_mensal_contrato NUMERIC(10, 2);

-- Adicionar número da ART
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS numero_art TEXT;

-- Comentários
COMMENT ON COLUMN public.clientes.valor_mensal_contrato IS 'Valor mensal do contrato de manutenção';
COMMENT ON COLUMN public.clientes.numero_art IS 'Número da Anotação de Responsabilidade Técnica';

-- ==========================================
-- 2. EQUIPAMENTOS - Adicionar campos detalhados
-- ==========================================

-- Adicionar nome do equipamento
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS nome TEXT;

-- Adicionar pavimentos
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS pavimentos TEXT;

-- Adicionar capacidade
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS capacidade TEXT;

-- Comentários
COMMENT ON COLUMN public.equipamentos.nome IS 'Nome identificador do equipamento';
COMMENT ON COLUMN public.equipamentos.pavimentos IS 'Pavimentos atendidos pelo equipamento';
COMMENT ON COLUMN public.equipamentos.capacidade IS 'Capacidade do equipamento (ex: 8 pessoas, 600kg)';

-- ==========================================
-- COMENTÁRIO FINAL
-- ==========================================
COMMENT ON TABLE public.clientes IS 'Tabela de clientes - atualizada em 2025-10-24 com campos de contrato';
COMMENT ON TABLE public.equipamentos IS 'Tabela de equipamentos - atualizada em 2025-10-24 com campos detalhados';



-- ============================================
-- Migration: 20251024000001_add_quem_solicitou_to_ordens_servico.sql
-- ============================================

-- Migration: Add quem_solicitou column to ordens_servico
-- Description: Adiciona campo dedicado para armazenar quem solicitou a ordem de serviço
-- Date: 2025-10-24

-- Add the column
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS quem_solicitou text;

-- Add comment
COMMENT ON COLUMN public.ordens_servico.quem_solicitou IS 'Nome da pessoa que solicitou a ordem de serviço';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS ordens_servico_quem_solicitou_idx 
ON public.ordens_servico (quem_solicitou);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: quem_solicitou column added to ordens_servico';
END $$;



-- ============================================
-- Migration: 20251024000002_fix_all_rls_policies_active_role.sql
-- ============================================

-- =====================================================
-- Migration: Fix ALL RLS Policies to use active_role
-- Data: 2025-10-24
-- Descrição: Corrigir todas as policies para usar active_role
--            ao invés de role, e remover referências a gestor
-- =====================================================

-- ==========================================
-- 1. CLIENTES (clientes)
-- ==========================================

-- DROP old policies
drop policy if exists "Users can view clientes from same empresa" on public.clientes;
drop policy if exists "Admins and gestores can create clientes" on public.clientes;
drop policy if exists "Admins and gestores can update clientes" on public.clientes;
drop policy if exists "Only admins can delete clientes" on public.clientes;
drop policy if exists "clientes_select" on public.clientes;

-- CREATE new policies with active_role
create policy "Users can view clientes from same empresa"
on public.clientes for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
    or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
  )
);

create policy "Admins can create clientes"
on public.clientes for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can update clientes"
on public.clientes for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can delete clientes"
on public.clientes for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

-- ==========================================
-- 2. COLABORADORES (tecnicos)
-- ==========================================

drop policy if exists "Users can view colaboradores from same empresa" on public.colaboradores;
drop policy if exists "Admins and gestores can create colaboradores" on public.colaboradores;
drop policy if exists "Admins and gestores can update colaboradores" on public.colaboradores;
drop policy if exists "Only admins can delete colaboradores" on public.colaboradores;
drop policy if exists "colaboradores_select" on public.colaboradores;

create policy "Users can view colaboradores from same empresa"
on public.colaboradores for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
    or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
  )
);

create policy "Admins can create colaboradores"
on public.colaboradores for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can update colaboradores"
on public.colaboradores for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can delete colaboradores"
on public.colaboradores for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

-- ==========================================
-- 3. EQUIPAMENTOS
-- ==========================================

drop policy if exists "Users can view equipamentos from same empresa" on public.equipamentos;
drop policy if exists "Admins and gestores can create equipamentos" on public.equipamentos;
drop policy if exists "Admins and gestores can update equipamentos" on public.equipamentos;
drop policy if exists "Only admins can delete equipamentos" on public.equipamentos;
drop policy if exists "equipamentos_select" on public.equipamentos;

create policy "Users can view equipamentos from same empresa"
on public.equipamentos for select
to authenticated
using (
  cliente_id in (
    select id from public.clientes
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
      or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
    )
  )
);

create policy "Admins can create equipamentos"
on public.equipamentos for insert
to authenticated
with check (
  cliente_id in (
    select id from public.clientes
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and (active_role = 'admin' or is_elisha_admin = true)
    )
    or empresa_id in (
      select impersonating_empresa_id
      from public.profiles
      where user_id = auth.uid()
      and is_elisha_admin = true
      and impersonating_empresa_id is not null
    )
  )
);

create policy "Admins can update equipamentos"
on public.equipamentos for update
to authenticated
using (
  cliente_id in (
    select id from public.clientes
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and (active_role = 'admin' or is_elisha_admin = true)
    )
    or empresa_id in (
      select impersonating_empresa_id
      from public.profiles
      where user_id = auth.uid()
      and is_elisha_admin = true
      and impersonating_empresa_id is not null
    )
  )
)
with check (
  cliente_id in (
    select id from public.clientes
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and (active_role = 'admin' or is_elisha_admin = true)
    )
    or empresa_id in (
      select impersonating_empresa_id
      from public.profiles
      where user_id = auth.uid()
      and is_elisha_admin = true
      and impersonating_empresa_id is not null
    )
  )
);

create policy "Admins can delete equipamentos"
on public.equipamentos for delete
to authenticated
using (
  cliente_id in (
    select id from public.clientes
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid() 
      and (active_role = 'admin' or is_elisha_admin = true)
    )
    or empresa_id in (
      select impersonating_empresa_id
      from public.profiles
      where user_id = auth.uid()
      and is_elisha_admin = true
      and impersonating_empresa_id is not null
    )
  )
);

-- ==========================================
-- 4. ORDENS DE SERVIÇO
-- ==========================================

drop policy if exists "Users can view OS from same empresa" on public.ordens_servico;
drop policy if exists "Admins and gestores can create OS" on public.ordens_servico;
drop policy if exists "Admins and gestores can update OS" on public.ordens_servico;
drop policy if exists "Only admins can delete OS" on public.ordens_servico;
drop policy if exists "ordens_servico_select" on public.ordens_servico;

create policy "Users can view OS from same empresa"
on public.ordens_servico for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
    or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
  )
);

create policy "Admins and tecnicos can create OS"
on public.ordens_servico for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role in ('admin', 'tecnico') or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins and tecnicos can update OS"
on public.ordens_servico for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role in ('admin', 'tecnico') or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role in ('admin', 'tecnico') or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can delete OS"
on public.ordens_servico for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

-- ==========================================
-- 5. CHECKLISTS
-- ==========================================

drop policy if exists "Users can view checklists from same empresa" on public.checklists;
drop policy if exists "Admins and gestores can create checklists" on public.checklists;
drop policy if exists "Admins and gestores can update checklists" on public.checklists;
drop policy if exists "Only admins can delete checklists" on public.checklists;
drop policy if exists "checklists_select" on public.checklists;

create policy "Users can view checklists from same empresa"
on public.checklists for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
    or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
  )
  or origem = 'elisha' -- Checklists Elisha são públicos
);

create policy "Admins can create checklists"
on public.checklists for insert
to authenticated
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can update checklists"
on public.checklists for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

create policy "Admins can delete checklists"
on public.checklists for delete
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role = 'admin' or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

-- ==========================================
-- COMENTÁRIO FINAL
-- ==========================================
comment on table public.clientes is 'Policies atualizadas para usar active_role em 2025-10-24';
comment on table public.colaboradores is 'Policies atualizadas para usar active_role em 2025-10-24';
comment on table public.equipamentos is 'Policies atualizadas para usar active_role em 2025-10-24';
comment on table public.ordens_servico is 'Policies atualizadas para usar active_role em 2025-10-24';
comment on table public.checklists is 'Policies atualizadas para usar active_role em 2025-10-24';



-- ============================================
-- Migration: 20251024000003_fix_profiles_roles_active_role.sql
-- ============================================

-- =====================================================
-- Migration: Fix profiles roles and active_role
-- Data: 2025-10-24
-- Descrição: Garantir que roles e active_role sejam
--            sempre preenchidos corretamente
-- =====================================================

-- 1. Corrigir todos os perfis existentes que estão sem roles/active_role
UPDATE public.profiles
SET 
  roles = ARRAY[role]::text[],
  active_role = role
WHERE is_elisha_admin = false
  AND role IN ('admin', 'tecnico')
  AND (roles IS NULL OR roles = '{}' OR active_role IS NULL);

-- 2. Criar função para garantir que roles e active_role sejam definidos
CREATE OR REPLACE FUNCTION public.ensure_roles_and_active_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um usuário normal (não elisha_admin)
  IF NEW.is_elisha_admin = false THEN
    -- Se roles está vazio ou null, preencher com o role
    IF NEW.roles IS NULL OR array_length(NEW.roles, 1) IS NULL THEN
      NEW.roles := ARRAY[NEW.role]::text[];
    END IF;
    
    -- Se active_role está null, preencher com o role
    IF NEW.active_role IS NULL THEN
      NEW.active_role := NEW.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para INSERT
DROP TRIGGER IF EXISTS ensure_roles_and_active_role_on_insert ON public.profiles;
CREATE TRIGGER ensure_roles_and_active_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_roles_and_active_role();

-- 4. Criar trigger para UPDATE
DROP TRIGGER IF EXISTS ensure_roles_and_active_role_on_update ON public.profiles;
CREATE TRIGGER ensure_roles_and_active_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.roles IS DISTINCT FROM NEW.roles OR
    OLD.active_role IS DISTINCT FROM NEW.active_role
  )
  EXECUTE FUNCTION public.ensure_roles_and_active_role();

-- 5. Recriar view ordens_servico_enriquecida (caso não exista)
CREATE OR REPLACE VIEW public.ordens_servico_enriquecida AS
SELECT
  os.*,
  CASE os.status
    WHEN 'parado' THEN 0
    WHEN 'novo' THEN 1
    WHEN 'em_andamento' THEN 2
    WHEN 'aguardando_assinatura' THEN 3
    WHEN 'concluido' THEN 4
    WHEN 'cancelado' THEN 5
    ELSE 6
  END AS peso_status,
  CASE os.prioridade
    WHEN 'alta' THEN 1
    WHEN 'media' THEN 2
    WHEN 'baixa' THEN 3
    ELSE 4
  END AS peso_prioridade
FROM public.ordens_servico os;

-- ==========================================
-- COMENTÁRIO FINAL
-- ==========================================
COMMENT ON FUNCTION public.ensure_roles_and_active_role() IS 'Garante que roles e active_role sejam sempre preenchidos corretamente para usuários normais';



-- ============================================
-- Migration: 20251027000000_create_os_status_history_and_accept_decline_rpcs.sql
-- ============================================

-- =====================================================
-- Migration: OS Status History + Accept/Decline RPCs
-- Data: 2025-10-27
-- Descrição: Implementa histórico de status da OS e 
--            RPCs para técnico aceitar/recusar ordens
-- =====================================================

-- =====================================================
-- 1. Tabela de Histórico de Status
-- =====================================================

CREATE TABLE IF NOT EXISTS public.os_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  
  -- Status transition
  status_anterior text,  -- Pode ser null no primeiro registro
  status_novo text NOT NULL,
  
  -- Audit fields
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  
  -- Context
  action_type text,  -- 'accept', 'decline', 'status_change', 'create'
  reason text,  -- Motivo (usado em decline)
  metadata jsonb DEFAULT '{}'::jsonb,  -- Dados extras (localização, etc)
  
  -- Multi-tenancy
  empresa_id uuid REFERENCES empresas(id),
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS os_status_history_os_id_idx ON os_status_history(os_id);
CREATE INDEX IF NOT EXISTS os_status_history_changed_at_idx ON os_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS os_status_history_empresa_id_idx ON os_status_history(empresa_id);
CREATE INDEX IF NOT EXISTS os_status_history_action_type_idx ON os_status_history(action_type);

COMMENT ON TABLE os_status_history IS 'Histórico completo de mudanças de status das ordens de serviço';
COMMENT ON COLUMN os_status_history.action_type IS 'Tipo da ação: accept, decline, status_change, create';
COMMENT ON COLUMN os_status_history.metadata IS 'Dados extras como localização, observações técnicas, etc';

-- =====================================================
-- 2. Trigger para Log Automático de Mudanças de Status
-- =====================================================

CREATE OR REPLACE FUNCTION log_os_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Pegar empresa_id da OS
  v_empresa_id := NEW.empresa_id;
  
  -- Registrar mudança de status (somente se status mudou)
  IF (TG_OP = 'INSERT') THEN
    -- Primeira inserção - registro de criação
    INSERT INTO os_status_history (
      os_id,
      status_anterior,
      status_novo,
      changed_by,
      changed_at,
      action_type,
      empresa_id,
      metadata
    ) VALUES (
      NEW.id,
      NULL,
      NEW.status,
      auth.uid(),
      NEW.created_at,
      'create',
      v_empresa_id,
      jsonb_build_object(
        'tipo', NEW.tipo,
        'prioridade', NEW.prioridade,
        'cliente_id', NEW.cliente_id,
        'equipamento_id', NEW.equipamento_id
      )
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Mudança de status
    INSERT INTO os_status_history (
      os_id,
      status_anterior,
      status_novo,
      changed_by,
      changed_at,
      action_type,
      empresa_id,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status::text,
      NEW.status::text,
      auth.uid(),
      now(),
      'status_change',
      v_empresa_id,
      jsonb_build_object(
        'tecnico_id', NEW.tecnico_id,
        'data_inicio', NEW.data_inicio,
        'data_fim', NEW.data_fim
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trg_os_status_change ON ordens_servico;
CREATE TRIGGER trg_os_status_change
  AFTER INSERT OR UPDATE OF status ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION log_os_status_change();

COMMENT ON FUNCTION log_os_status_change() IS 'Registra automaticamente mudanças de status na tabela os_status_history';

-- =====================================================
-- 3. RPC: os_accept (Técnico aceita uma OS)
-- =====================================================

CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_result jsonb;
BEGIN
  -- 1. Validações iniciais
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar perfil do usuário
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil do usuário não encontrado'
    );
  END IF;

  -- 3. Verificar se é técnico
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authorized',
      'message', 'Apenas técnicos podem aceitar ordens de serviço'
    );
  END IF;

  -- 4. Pegar tecnico_id (se for técnico real, não admin)
  v_tecnico_id := v_profile.tecnico_id;
  
  IF v_tecnico_id IS NULL AND v_profile.active_role = 'tecnico' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'tecnico_not_linked',
      'message', 'Técnico não está vinculado a um colaborador'
    );
  END IF;

  -- 5. Determinar empresa ativa (considera impersonation)
  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  -- 6. Buscar OS
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada'
    );
  END IF;

  -- 7. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 8. Validar status
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Esta OS não está disponível para aceite (status: ' || v_os.status || ')'
    );
  END IF;

  -- 9. Validar se já tem técnico (exceto se for o mesmo)
  IF v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Esta OS já está atribuída a outro técnico'
    );
  END IF;

  -- 10. Atualizar OS
  UPDATE ordens_servico
  SET 
    tecnico_id = v_tecnico_id,
    status = 'em_andamento',
    data_inicio = COALESCE(data_inicio, now()),
    updated_at = now()
  WHERE id = p_os_id;

  -- 11. Registrar no histórico (com action_type específico)
  INSERT INTO os_status_history (
    os_id,
    status_anterior,
    status_novo,
    changed_by,
    changed_at,
    action_type,
    empresa_id,
    metadata
  ) VALUES (
    p_os_id,
    v_os.status::text,
    'em_andamento',
    auth.uid(),
    now(),
    'accept',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'previous_tecnico_id', v_os.tecnico_id,
      'data_inicio', COALESCE(v_os.data_inicio, now())
    )
  );

  -- 12. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'OS aceita com sucesso! Você pode começar o atendimento.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'em_andamento',
      'tecnico_id', v_tecnico_id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao aceitar OS: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_accept(uuid) IS 'Permite que um técnico aceite uma OS disponível e inicie o atendimento';

-- =====================================================
-- 4. RPC: os_decline (Técnico recusa uma OS)
-- =====================================================

CREATE OR REPLACE FUNCTION os_decline(
  p_os_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_empresa_id uuid;
BEGIN
  -- 1. Validações iniciais
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar perfil
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil não encontrado'
    );
  END IF;

  -- 3. Verificar se é técnico
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authorized',
      'message', 'Apenas técnicos podem recusar ordens de serviço'
    );
  END IF;

  -- 4. Determinar empresa ativa
  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  -- 5. Buscar OS
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada'
    );
  END IF;

  -- 6. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 7. Validar status
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Esta OS não pode ser recusada (status: ' || v_os.status || ')'
    );
  END IF;

  -- 8. Registrar recusa no histórico (sem mudar status da OS)
  INSERT INTO os_status_history (
    os_id,
    status_anterior,
    status_novo,
    changed_by,
    changed_at,
    action_type,
    reason,
    empresa_id,
    metadata
  ) VALUES (
    p_os_id,
    v_os.status::text,
    v_os.status::text,  -- Mantém mesmo status
    auth.uid(),
    now(),
    'decline',
    p_reason,
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_profile.tecnico_id,
      'tecnico_nome', v_profile.nome_completo
    )
  );

  -- 9. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recusa registrada. Esta OS continuará disponível para outros técnicos.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', v_os.status,
      'reason', p_reason
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao recusar OS: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_decline(uuid, text) IS 'Permite que um técnico recuse uma OS disponível, registrando o motivo';

-- =====================================================
-- 5. Políticas RLS para os_status_history
-- =====================================================

-- Habilitar RLS
ALTER TABLE os_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (authenticated users da mesma empresa)
CREATE POLICY os_status_history_select_authenticated
  ON os_status_history
  FOR SELECT
  TO authenticated
  USING (
    -- Elisha Admin vê tudo
    (SELECT is_elisha_admin()) OR
    -- Usuários da mesma empresa
    empresa_id = (SELECT current_empresa_id())
  );

-- Policy: INSERT (apenas via funções SECURITY DEFINER ou admins)
CREATE POLICY os_status_history_insert_authenticated
  ON os_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Elisha Admin pode inserir
    (SELECT is_elisha_admin()) OR
    -- Admins da empresa podem inserir
    (
      empresa_id = (SELECT current_empresa_id()) AND
      (SELECT current_active_role()) = 'admin'
    )
  );

-- Policy: Não permite UPDATE ou DELETE (histórico é imutável)
CREATE POLICY os_status_history_no_update
  ON os_status_history
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY os_status_history_no_delete
  ON os_status_history
  FOR DELETE
  TO authenticated
  USING (false);

-- =====================================================
-- 6. Grants de Permissão
-- =====================================================

-- Permitir que authenticated execute os RPCs
GRANT EXECUTE ON FUNCTION os_accept(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION os_decline(uuid, text) TO authenticated;

-- Permitir acesso à tabela
GRANT SELECT ON os_status_history TO authenticated;
GRANT INSERT ON os_status_history TO authenticated;

-- =====================================================
-- 7. Comentários e Documentação
-- =====================================================

COMMENT ON TABLE os_status_history IS 'Histórico imutável de todas as mudanças de status e ações nas ordens de serviço';
COMMENT ON COLUMN os_status_history.action_type IS 'Tipos: create (criação), accept (aceite), decline (recusa), status_change (mudança manual)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================



-- ============================================
-- Migration: 20251027000001_fix_os_accept_decline_rls_and_functions.sql
-- ============================================

-- Patch: Relax RLS for os_status_history and fix os_decline metadata column
-- Date: 2025-10-27

-- 1) Ensure technicians can insert history entries via RPCs/trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'os_status_history' AND polname = 'os_status_history_insert_authenticated'
  ) THEN
    EXECUTE 'DROP POLICY os_status_history_insert_authenticated ON public.os_status_history';
  END IF;
END$$;

-- New policy: any authenticated user from same empresa can insert history rows
CREATE POLICY os_status_history_insert_authenticated
  ON public.os_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    OR (SELECT coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb->>'is_elisha_admin',''), 'false'))::boolean = true
    OR (SELECT public.current_active_role()) IN ('admin','tecnico')
  );

-- 2) Fix os_decline to use profile.nome instead of nome_completo (compat with current schema)
CREATE OR REPLACE FUNCTION os_decline(
  p_os_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_empresa_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated', 'message', 'Usuário não autenticado');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found', 'message', 'Perfil do usuário não encontrado');
  END IF;

  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'os_not_found', 'message', 'Ordem de serviço não encontrada');
  END IF;

  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa', 'message', 'Esta OS pertence a outra empresa');
  END IF;

  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'message', 'Esta OS não pode ser recusada (status: ' || v_os.status || ')');
  END IF;

  INSERT INTO os_status_history (
    os_id, status_anterior, status_novo, changed_by, changed_at, action_type, reason, empresa_id, metadata
  ) VALUES (
    p_os_id,
    v_os.status::text,
    v_os.status::text,
    auth.uid(),
    now(),
    'decline',
    p_reason,
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_profile.tecnico_id,
      'tecnico_nome', coalesce(v_profile.nome, NULL)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recusa registrada. Esta OS continuará disponível para outros técnicos.',
    'data', jsonb_build_object('os_id', p_os_id, 'status', v_os.status, 'reason', p_reason)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'internal_error', 'message', 'Erro ao recusar OS: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- ============================================
-- Migration: 20251028000000_create_evidencias_and_laudo.sql
-- ============================================

-- =====================================================
-- Migration: Create OS Evidencias and Laudo System
-- Description: Tabela de evidências, laudo com autosave e RLS
-- Author: Elisha AI
-- Date: 2025-10-28
-- Task: 4 (Checklist + Laudo + Evidências)
-- =====================================================

-- =====================================================
-- ENUM: Tipos de Evidência
-- =====================================================
DO $$ BEGIN
  CREATE TYPE evidencia_tipo AS ENUM ('foto', 'video', 'audio', 'nota');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: os_evidencias
-- Description: Armazena evidências vinculadas às OS
-- =====================================================
CREATE TABLE IF NOT EXISTS os_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo evidencia_tipo NOT NULL,
  
  -- Storage path (para foto/video/audio)
  storage_path text,
  
  -- Conteúdo direto (para notas de texto)
  conteudo text,
  
  -- Metadata adicional
  titulo text,
  descricao text,
  tamanho_bytes bigint,
  mime_type text,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT evidencia_storage_or_content CHECK (
    (tipo IN ('foto', 'video', 'audio') AND storage_path IS NOT NULL) OR
    (tipo = 'nota' AND conteudo IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_os_evidencias_os_id ON os_evidencias(os_id);
CREATE INDEX IF NOT EXISTS idx_os_evidencias_empresa_id ON os_evidencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_os_evidencias_tipo ON os_evidencias(tipo);

-- =====================================================
-- TABLE: os_laudos
-- Description: Laudo técnico com autosave
-- =====================================================
CREATE TABLE IF NOT EXISTS os_laudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL UNIQUE REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Conteúdo do laudo
  descricao text,
  diagnostico text,
  solucao_aplicada text,
  recomendacoes text,
  
  -- Metadata
  versao int NOT NULL DEFAULT 1,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_os_laudos_os_id ON os_laudos(os_id);
CREATE INDEX IF NOT EXISTS idx_os_laudos_empresa_id ON os_laudos(empresa_id);

-- =====================================================
-- RLS: os_evidencias
-- =====================================================
ALTER TABLE os_evidencias ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura
CREATE POLICY "evidencias_select_authenticated" ON os_evidencias
  FOR SELECT TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Inserção
CREATE POLICY "evidencias_insert_authenticated" ON os_evidencias
  FOR INSERT TO authenticated
  WITH CHECK (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Atualização (somente criador ou admin)
CREATE POLICY "evidencias_update_owner_or_admin" ON os_evidencias
  FOR UPDATE TO authenticated
  USING (
    is_elisha_admin() = true OR
    (empresa_id = current_empresa_id() AND created_by = auth.uid())
  );

-- Policy: Deleção (somente criador ou admin)
CREATE POLICY "evidencias_delete_owner_or_admin" ON os_evidencias
  FOR DELETE TO authenticated
  USING (
    is_elisha_admin() = true OR
    (empresa_id = current_empresa_id() AND created_by = auth.uid())
  );

-- =====================================================
-- RLS: os_laudos
-- =====================================================
ALTER TABLE os_laudos ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura
CREATE POLICY "laudos_select_authenticated" ON os_laudos
  FOR SELECT TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Inserção
CREATE POLICY "laudos_insert_authenticated" ON os_laudos
  FOR INSERT TO authenticated
  WITH CHECK (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Atualização
CREATE POLICY "laudos_update_authenticated" ON os_laudos
  FOR UPDATE TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- =====================================================
-- TRIGGER: Atualizar updated_at em os_laudos
-- =====================================================
CREATE OR REPLACE FUNCTION update_os_laudo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  NEW.versao = OLD.versao + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_os_laudos_updated_at
  BEFORE UPDATE ON os_laudos
  FOR EACH ROW
  EXECUTE FUNCTION update_os_laudo_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE os_evidencias IS 'Evidências (foto/vídeo/áudio/nota) vinculadas a OS';
COMMENT ON TABLE os_laudos IS 'Laudo técnico com autosave e versionamento';
COMMENT ON COLUMN os_evidencias.tipo IS 'Tipo de evidência: foto, video, audio ou nota';
COMMENT ON COLUMN os_evidencias.storage_path IS 'Caminho no storage (para foto/video/audio)';
COMMENT ON COLUMN os_evidencias.conteudo IS 'Conteúdo direto (para notas de texto)';
COMMENT ON COLUMN os_laudos.versao IS 'Versão do laudo (incrementada a cada update)';



-- ============================================
-- Migration: 20251028000001_create_os_checkin_rpc.sql
-- ============================================

-- =====================================================
-- Migration: Create os_checkin RPC
-- Description: Permite que técnico registre chegada no local (check-in)
-- Author: Elisha AI
-- Date: 2025-10-28
-- Task: 3 (Check-in com Timestamp)
-- =====================================================

-- =====================================================
-- RPC: os_checkin
-- Description: Registra chegada do técnico no local da OS
-- =====================================================
CREATE OR REPLACE FUNCTION os_checkin(
  p_os_id uuid,
  p_location jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os ordens_servico%ROWTYPE;
BEGIN
  -- =====================================================
  -- 1) Validar autenticação
  -- =====================================================
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Você precisa estar autenticado para fazer check-in.'
    );
  END IF;

  -- =====================================================
  -- 2) Buscar perfil do usuário
  -- =====================================================
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil de usuário não encontrado.'
    );
  END IF;

  -- =====================================================
  -- 3) Validar se é técnico ou admin
  -- =====================================================
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_role',
      'message', 'Apenas técnicos podem fazer check-in.'
    );
  END IF;

  -- =====================================================
  -- 4) Buscar empresa ativa (impersonation-aware)
  -- =====================================================
  SELECT COALESCE(
    v_profile.impersonating_empresa_id,
    v_profile.empresa_id
  ) INTO v_empresa_id;

  IF v_empresa_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'empresa_not_found',
      'message', 'Empresa não identificada.'
    );
  END IF;

  -- =====================================================
  -- 5) Buscar e validar OS
  -- =====================================================
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada.'
    );
  END IF;

  -- =====================================================
  -- 6) Validar empresa da OS
  -- =====================================================
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS não pertence à sua empresa.'
    );
  END IF;

  -- =====================================================
  -- 7) Determinar técnico_id
  --    - Admin: usa tecnico_id da OS
  --    - Técnico: usa seu próprio colaborador vinculado
  -- =====================================================
  IF v_profile.active_role = 'admin' THEN
    -- Admin usa o técnico já atribuído à OS
    v_tecnico_id := v_os.tecnico_id;
    
    IF v_tecnico_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'no_tecnico_assigned',
        'message', 'Esta OS não tem técnico atribuído.'
      );
    END IF;
  ELSE
    -- Técnico usa seu próprio colaborador vinculado
    SELECT id INTO v_tecnico_id
    FROM colaboradores
    WHERE user_id = auth.uid()
      AND ativo = true
    LIMIT 1;

    IF v_tecnico_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'tecnico_not_found',
        'message', 'Você não está vinculado a um técnico ativo.'
      );
    END IF;

    -- Validar se OS está atribuída ao técnico
    IF v_os.tecnico_id != v_tecnico_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'os_not_assigned',
        'message', 'Esta OS não está atribuída a você.'
      );
    END IF;
  END IF;

  -- =====================================================
  -- 8) Validar status atual (deve estar em deslocamento)
  -- =====================================================
  IF v_os.status != 'em_deslocamento' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', format('Só é possível fazer check-in em OS "Em Deslocamento". Status atual: %s', v_os.status)
    );
  END IF;

  -- =====================================================
  -- 9) Atualizar status da OS para 'checkin'
  -- =====================================================
  UPDATE ordens_servico
  SET 
    status = 'checkin',
    updated_at = now()
  WHERE id = p_os_id;

  -- =====================================================
  -- 10) Registrar no histórico com metadata
  -- =====================================================
  INSERT INTO os_status_history (
    os_id,
    status_anterior,
    status_novo,
    changed_by,
    changed_at,
    action_type,
    empresa_id,
    metadata
  ) VALUES (
    p_os_id,
    v_os.status,
    'checkin',
    auth.uid(),
    now(),
    'checkin',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'tecnico_nome', v_profile.nome,
      'location', p_location,
      'data_checkin', now()
    )
  );

  -- =====================================================
  -- 11) Retornar sucesso
  -- =====================================================
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Check-in realizado com sucesso! Você chegou ao local da OS %s.', v_os.numero_os),
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'checkin',
      'tecnico_id', v_tecnico_id,
      'checkin_at', now(),
      'location', p_location
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', format('Erro ao fazer check-in: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- Grant EXECUTE to authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION os_checkin(uuid, jsonb) TO authenticated;

-- =====================================================
-- Add comment
-- =====================================================
COMMENT ON FUNCTION os_checkin IS 'Registra chegada do técnico no local da OS (transição: em_deslocamento → checkin)';



-- ============================================
-- Migration: 20251029000000_seed_roles_existing_users.sql
-- ============================================

-- Script para popular roles em usuários existentes
-- Execute este script APÓS aplicar a migração de roles

-- ==================================================
-- 1. CONFIGURAR ADMINISTRADORES E GESTORES
-- ==================================================

-- Adicionar role 'gestor' para todos os admins
UPDATE public.profiles
SET 
  roles = ARRAY['gestor']::text[],
  active_role = 'gestor'
WHERE 
  (role = 'admin' OR funcao = 'admin' OR role = 'gestor' OR funcao = 'gestor')
  AND roles = '{}'; -- Só atualiza se ainda não foi configurado

-- ==================================================
-- 2. CONFIGURAR TÉCNICOS
-- ==================================================

-- OPÇÃO A: Se profiles.nome corresponde a colaboradores.nome
UPDATE public.profiles p
SET 
  roles = ARRAY['tecnico']::text[],
  active_role = 'tecnico',
  tecnico_id = c.id
FROM public.colaboradores c
WHERE 
  (p.role = 'tecnico' OR p.funcao = 'tecnico')
  AND LOWER(TRIM(p.nome)) = LOWER(TRIM(c.nome))
  AND c.empresa_id = p.empresa_id
  AND p.roles = '{}'; -- Só atualiza se ainda não foi configurado

-- OPÇÃO B: Se houver uma coluna colaborador_id em profiles
-- Descomente se aplicável:
/*
UPDATE public.profiles p
SET 
  roles = ARRAY['tecnico']::text[],
  active_role = 'tecnico',
  tecnico_id = p.colaborador_id
WHERE 
  (p.role = 'tecnico' OR p.funcao = 'tecnico')
  AND p.colaborador_id IS NOT NULL
  AND p.roles = '{}';
*/

-- ==================================================
-- 3. USUÁRIOS COM MÚLTIPLOS ROLES
-- ==================================================

-- Se houver usuários que são gestores E técnicos:
-- Identifique manualmente e configure assim:
/*
UPDATE public.profiles
SET 
  roles = ARRAY['gestor', 'tecnico']::text[],
  active_role = 'gestor', -- Role padrão ao fazer login
  tecnico_id = 'uuid-do-colaborador' -- Se aplicável
WHERE id = 'uuid-do-usuario';
*/

-- ==================================================
-- 4. VERIFICAÇÃO
-- ==================================================

-- Ver todos os profiles configurados
SELECT 
  p.id,
  p.nome,
  p.email,
  e.nome as empresa,
  p.role as old_role,
  p.roles as new_roles,
  p.active_role,
  CASE 
    WHEN p.tecnico_id IS NOT NULL THEN c.nome
    ELSE NULL
  END as tecnico_nome
FROM public.profiles p
LEFT JOIN public.empresas e ON e.id = p.empresa_id
LEFT JOIN public.colaboradores c ON c.id = p.tecnico_id
ORDER BY e.nome, p.nome;

-- Ver quantos por tipo
SELECT 
  active_role,
  COUNT(*) as total,
  COUNT(CASE WHEN 'gestor' = ANY(roles) THEN 1 END) as com_role_gestor,
  COUNT(CASE WHEN 'tecnico' = ANY(roles) THEN 1 END) as com_role_tecnico,
  COUNT(CASE WHEN tecnico_id IS NOT NULL THEN 1 END) as com_tecnico_id
FROM public.profiles
GROUP BY active_role
ORDER BY active_role;

-- Ver profiles sem roles configurados (requerem atenção)
SELECT 
  id,
  nome,
  email,
  role as old_role,
  roles as new_roles
FROM public.profiles
WHERE roles = '{}'
ORDER BY nome;



-- ============================================
-- Migration: 998_add_user_id_to_colaboradores.sql
-- ============================================

-- Adiciona coluna user_id na tabela colaboradores para vincular com auth.users
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_colaboradores_user_id ON public.colaboradores(user_id);

COMMENT ON COLUMN public.colaboradores.user_id IS 'Vínculo com usuário autenticado (para técnicos que têm login)';



-- ============================================
-- Migration: 999_fix_accept_invite_create_colaborador.sql
-- ============================================

-- ============================================
-- FIX: accept_invite deve criar colaborador para técnicos
-- ============================================

create or replace function public.accept_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.invites;
  v_user uuid := (select auth.uid());
  v_profile_exists boolean;
  v_user_email text;
  v_user_name text;
begin
  -- Valida usuário autenticado
  if v_user is null then
    raise exception 'User not authenticated';
  end if;

  -- Pega email e nome do usuário autenticado
  select email, 
         coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  into v_user_email, v_user_name
  from auth.users
  where id = v_user;

  -- Pega convite válido
  select * into v_invite
  from public.invites
  where token = p_token
    and status = 'pending'
  limit 1;

  if v_invite.id is null then
    raise exception 'Invalid or already used token';
  end if;

  if v_invite.expires_at < now() then
    update public.invites set status = 'expired' where id = v_invite.id;
    raise exception 'Invite expired';
  end if;

  -- Garante profile
  select exists(
    select 1 from public.profiles pr where pr.user_id = v_user
  ) into v_profile_exists;

  if not v_profile_exists then
    -- Cria profile novo
    insert into public.profiles (user_id, empresa_id, role, name, email, created_at)
    values (v_user, v_invite.empresa_id, v_invite.role, v_user_name, v_user_email, now())
    on conflict (user_id) do update 
    set empresa_id = excluded.empresa_id, 
        role = excluded.role,
        name = excluded.name,
        email = excluded.email;
  else
    -- Atualiza profile existente
    update public.profiles
    set empresa_id = v_invite.empresa_id,
        role = v_invite.role,
        name = coalesce(name, v_user_name),
        email = coalesce(email, v_user_email)
    where user_id = v_user;
  end if;

  -- Se o role é 'tecnico', cria registro em colaboradores
  if v_invite.role = 'tecnico' then
    -- Verifica se já existe colaborador para este usuário nesta empresa
    if not exists (
      select 1 from public.colaboradores 
      where empresa_id = v_invite.empresa_id 
        and (user_id = v_user or whatsapp_numero = v_user_email)
    ) then
      -- Cria colaborador
      insert into public.colaboradores (
        empresa_id, 
        user_id,
        nome, 
        whatsapp_numero, 
        ativo, 
        created_at
      )
      values (
        v_invite.empresa_id,
        v_user,
        v_user_name,
        v_user_email, -- Temporário, idealmente seria o WhatsApp real
        true,
        now()
      );
    else
      -- Atualiza colaborador existente para ativo
      update public.colaboradores
      set ativo = true,
          user_id = v_user,
          nome = coalesce(nome, v_user_name)
      where empresa_id = v_invite.empresa_id
        and (user_id = v_user or whatsapp_numero = v_user_email);
    end if;
  end if;

  -- Marca convite como aceito
  update public.invites
  set status = 'accepted',
      accepted_by = v_user,
      accepted_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'success', true,
    'empresa_id', v_invite.empresa_id,
    'role', v_invite.role
  );
end;
$$;

comment on function public.accept_invite is 'Aceita convite, cria profile e colaborador (se técnico)';


