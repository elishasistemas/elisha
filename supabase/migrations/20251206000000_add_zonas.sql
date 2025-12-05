-- Migration: Add zonas (zones) system
-- Description: Adiciona sistema de zonas para organizar clientes e técnicos por região
-- Date: 2025-12-06

-- ============================================
-- 1. CREATE ZONAS TABLE
-- ============================================

create table if not exists public.zonas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  tecnico_responsavel_id uuid references public.colaboradores (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zonas_nome_empresa_unique unique (empresa_id, nome)
);

-- Indexes
create index if not exists zonas_empresa_id_idx on public.zonas (empresa_id);
create index if not exists zonas_tecnico_responsavel_id_idx on public.zonas (tecnico_responsavel_id);
create index if not exists zonas_nome_idx on public.zonas (nome);

-- Comments
comment on table public.zonas is 'Zonas geográficas ou organizacionais para agrupar clientes e técnicos';
comment on column public.zonas.nome is 'Nome da zona (ex: Centro, Zona Sul, Região Norte)';
comment on column public.zonas.tecnico_responsavel_id is 'Técnico responsável pela zona';

-- Enable RLS
alter table public.zonas enable row level security;

-- ============================================
-- 2. ADD ZONA TO CLIENTES
-- ============================================

-- Um cliente pode ter 0 ou 1 zona
alter table public.clientes
add column if not exists zona_id uuid references public.zonas (id) on delete set null;

-- Index
create index if not exists clientes_zona_id_idx on public.clientes (zona_id);

-- Comment
comment on column public.clientes.zona_id is 'Zona à qual o cliente pertence (0 ou 1)';

-- ============================================
-- 3. CREATE ZONAS_TECNICOS JOIN TABLE
-- ============================================

-- Um técnico pode ter 0 ou N zonas
create table if not exists public.zonas_tecnicos (
  id uuid primary key default gen_random_uuid(),
  zona_id uuid not null references public.zonas (id) on delete cascade,
  tecnico_id uuid not null references public.colaboradores (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint zonas_tecnicos_unique unique (zona_id, tecnico_id)
);

-- Indexes
create index if not exists zonas_tecnicos_zona_id_idx on public.zonas_tecnicos (zona_id);
create index if not exists zonas_tecnicos_tecnico_id_idx on public.zonas_tecnicos (tecnico_id);

-- Comments
comment on table public.zonas_tecnicos is 'Associação N:N entre zonas e técnicos';

-- Enable RLS
alter table public.zonas_tecnicos enable row level security;

-- ============================================
-- 4. RLS POLICIES FOR ZONAS
-- ============================================

-- Users can view zonas from same empresa
drop policy if exists "Users can view zonas from same empresa" on public.zonas;

create policy "Users can view zonas from same empresa" on public.zonas for select
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid()
    or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
  )
);

-- Only admin can create zonas
drop policy if exists "Admins can create zonas" on public.zonas;

create policy "Admins can create zonas" on public.zonas for insert
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

-- Only admin can update zonas
drop policy if exists "Admins can update zonas" on public.zonas;

create policy "Admins can update zonas" on public.zonas for update
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

-- Only admin can delete zonas
drop policy if exists "Admins can delete zonas" on public.zonas;

create policy "Admins can delete zonas" on public.zonas for delete
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

-- ============================================
-- 5. RLS POLICIES FOR ZONAS_TECNICOS
-- ============================================

-- Users can view zonas_tecnicos from same empresa
drop policy if exists "Users can view zonas_tecnicos from same empresa" on public.zonas_tecnicos;

create policy "Users can view zonas_tecnicos from same empresa" on public.zonas_tecnicos for select
to authenticated
using (
  zona_id in (
    select id from public.zonas
    where empresa_id in (
      select empresa_id 
      from public.profiles 
      where user_id = auth.uid()
      or (is_elisha_admin = true and impersonating_empresa_id = empresa_id)
    )
  )
);

-- Only admin can manage zonas_tecnicos
drop policy if exists "Admins can insert zonas_tecnicos" on public.zonas_tecnicos;

create policy "Admins can insert zonas_tecnicos" on public.zonas_tecnicos for insert
to authenticated
with check (
  zona_id in (
    select id from public.zonas
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

drop policy if exists "Admins can delete zonas_tecnicos" on public.zonas_tecnicos;

create policy "Admins can delete zonas_tecnicos" on public.zonas_tecnicos for delete
to authenticated
using (
  zona_id in (
    select id from public.zonas
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

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to create a new zona
create or replace function public.create_zona(
  p_empresa_id uuid,
  p_nome text,
  p_tecnico_responsavel_id uuid default null
)
returns public.zonas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_zona public.zonas;
  v_is_admin boolean;
begin
  -- Check if user is admin
  select exists (
    select 1 from public.profiles pr
    where pr.user_id = auth.uid()
      and (
        pr.is_elisha_admin = true
        or
        (
          pr.empresa_id = p_empresa_id
          and (pr.active_role = 'admin' or pr.role = 'admin' or 'admin' = any(pr.roles))
        )
        or
        (
          pr.is_elisha_admin = true
          and pr.impersonating_empresa_id = p_empresa_id
          and (pr.active_role = 'admin' or 'admin' = any(pr.roles))
        )
      )
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can create zonas';
  end if;

  -- Create zona
  insert into public.zonas (empresa_id, nome, tecnico_responsavel_id)
  values (p_empresa_id, p_nome, p_tecnico_responsavel_id)
  returning * into v_zona;

  return v_zona;
end;
$$;

comment on function public.create_zona is 'Cria uma nova zona. Apenas admin pode criar zonas.';

-- Function to associate tecnico with zona
create or replace function public.add_tecnico_to_zona(
  p_zona_id uuid,
  p_tecnico_id uuid
)
returns public.zonas_tecnicos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_association public.zonas_tecnicos;
  v_is_admin boolean;
  v_empresa_id uuid;
begin
  -- Get empresa_id from zona
  select empresa_id into v_empresa_id
  from public.zonas
  where id = p_zona_id;

  if v_empresa_id is null then
    raise exception 'Zona not found';
  end if;

  -- Check if user is admin
  select exists (
    select 1 from public.profiles pr
    where pr.user_id = auth.uid()
      and (
        pr.is_elisha_admin = true
        or
        (
          pr.empresa_id = v_empresa_id
          and (pr.active_role = 'admin' or pr.role = 'admin' or 'admin' = any(pr.roles))
        )
        or
        (
          pr.is_elisha_admin = true
          and pr.impersonating_empresa_id = v_empresa_id
          and (pr.active_role = 'admin' or 'admin' = any(pr.roles))
        )
      )
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can add tecnico to zona';
  end if;

  -- Create association (will fail if already exists due to unique constraint)
  insert into public.zonas_tecnicos (zona_id, tecnico_id)
  values (p_zona_id, p_tecnico_id)
  on conflict (zona_id, tecnico_id) do nothing
  returning * into v_association;

  return v_association;
end;
$$;

comment on function public.add_tecnico_to_zona is 'Associa um técnico a uma zona. Apenas admin pode fazer isso.';

-- Function to remove tecnico from zona
create or replace function public.remove_tecnico_from_zona(
  p_zona_id uuid,
  p_tecnico_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_empresa_id uuid;
begin
  -- Get empresa_id from zona
  select empresa_id into v_empresa_id
  from public.zonas
  where id = p_zona_id;

  if v_empresa_id is null then
    raise exception 'Zona not found';
  end if;

  -- Check if user is admin
  select exists (
    select 1 from public.profiles pr
    where pr.user_id = auth.uid()
      and (
        pr.is_elisha_admin = true
        or
        (
          pr.empresa_id = v_empresa_id
          and (pr.active_role = 'admin' or pr.role = 'admin' or 'admin' = any(pr.roles))
        )
        or
        (
          pr.is_elisha_admin = true
          and pr.impersonating_empresa_id = v_empresa_id
          and (pr.active_role = 'admin' or 'admin' = any(pr.roles))
        )
      )
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Not allowed: only admin can remove tecnico from zona';
  end if;

  -- Remove association
  delete from public.zonas_tecnicos
  where zona_id = p_zona_id and tecnico_id = p_tecnico_id;

  return true;
end;
$$;

comment on function public.remove_tecnico_from_zona is 'Remove um técnico de uma zona. Apenas admin pode fazer isso.';

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Trigger to update updated_at on zonas
drop trigger if exists update_zonas_updated_at on public.zonas;
create trigger update_zonas_updated_at before update on public.zonas
  for each row execute function public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

grant all on public.zonas to authenticated;
grant all on public.zonas_tecnicos to authenticated;
