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
create policy if not exists invites_select_same_empresa
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
create policy if not exists invites_insert_admin
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
create policy if not exists invites_update_admin
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
create policy if not exists invites_delete_admin
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

