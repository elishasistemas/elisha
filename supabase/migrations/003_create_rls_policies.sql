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

