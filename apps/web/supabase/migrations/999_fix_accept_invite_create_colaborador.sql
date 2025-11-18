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

