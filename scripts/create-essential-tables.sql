-- Criar apenas tabelas essenciais no DEV
-- Este é um subset mínimo para poder fazer login

-- Extensions
create extension if not exists "uuid-ossp";

-- Tabela empresas (já existe dos dados copiados, mas garantir estrutura)
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

-- Tabela profiles (essencial para login)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete set null,
  nome text,
  email text,
  funcao text,
  roles text[] not null default ARRAY['tecnico']::text[],
  active_role text not null default 'tecnico',
  impersonating_empresa_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.empresas enable row level security;
alter table public.profiles enable row level security;

-- RLS Policies
create policy "Empresas são visíveis para usuários autenticados"
  on public.empresas for select
  to authenticated
  using (true);

create policy "Profiles são visíveis para todos autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Usuários podem atualizar seu próprio profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.empresas to authenticated;
grant all on public.profiles to authenticated;

-- Verificar
SELECT 'Tabelas essenciais criadas!' as status;

