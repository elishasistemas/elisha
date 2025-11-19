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

