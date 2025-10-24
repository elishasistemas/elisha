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

