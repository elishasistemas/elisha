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

DROP POLICY IF EXISTS invites_update_admin ON public.invites;
CREATE POLICY invites_update_admin
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

DROP POLICY IF EXISTS invites_delete_admin ON public.invites;
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

