-- Migration: Fix accept_invite to set active_role and roles array
-- Date: 2025-11-26
-- Description: Bug fix - accept_invite wasn't setting active_role and roles array

CREATE OR REPLACE FUNCTION public.accept_invite(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites;
  v_user uuid := (SELECT auth.uid());
  v_profile_exists boolean;
  v_user_email text;
  v_user_name text;
BEGIN
  -- Valida usuário autenticado
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Pega email e nome do usuário autenticado
  SELECT email, 
         COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = v_user;

  -- Pega convite válido
  SELECT * INTO v_invite
  FROM public.invites
  WHERE token = p_token
    AND status = 'pending'
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or already used token';
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.invites SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invite expired';
  END IF;

  -- Garante profile
  SELECT EXISTS(
    SELECT 1 FROM public.profiles pr WHERE pr.user_id = v_user
  ) INTO v_profile_exists;

  IF NOT v_profile_exists THEN
    -- Cria profile novo com role, active_role e roles
    INSERT INTO public.profiles (
      user_id, 
      empresa_id, 
      role, 
      active_role, 
      roles, 
      name, 
      email, 
      created_at
    )
    VALUES (
      v_user, 
      v_invite.empresa_id, 
      v_invite.role, 
      v_invite.role,           -- <-- FIX: setar active_role
      ARRAY[v_invite.role],    -- <-- FIX: setar roles array
      v_user_name, 
      v_user_email, 
      now()
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET empresa_id = EXCLUDED.empresa_id, 
        role = EXCLUDED.role,
        active_role = EXCLUDED.active_role,   -- <-- FIX
        roles = EXCLUDED.roles,                -- <-- FIX
        name = EXCLUDED.name,
        email = EXCLUDED.email;
  ELSE
    -- Atualiza profile existente com role, active_role e roles
    UPDATE public.profiles
    SET empresa_id = v_invite.empresa_id,
        role = v_invite.role,
        active_role = v_invite.role,          -- <-- FIX: setar active_role
        roles = ARRAY[v_invite.role],          -- <-- FIX: setar roles array
        name = COALESCE(name, v_user_name),
        email = COALESCE(email, v_user_email)
    WHERE user_id = v_user;
  END IF;

  -- Se o role é 'tecnico', cria registro em colaboradores
  IF v_invite.role = 'tecnico' THEN
    -- Verifica se já existe colaborador para este usuário nesta empresa
    IF NOT EXISTS (
      SELECT 1 FROM public.colaboradores 
      WHERE empresa_id = v_invite.empresa_id 
        AND (user_id = v_user OR whatsapp_numero = v_user_email)
    ) THEN
      -- Cria colaborador
      INSERT INTO public.colaboradores (
        empresa_id, 
        user_id,
        nome, 
        whatsapp_numero, 
        ativo, 
        created_at
      )
      VALUES (
        v_invite.empresa_id,
        v_user,
        v_user_name,
        v_user_email, -- Temporário, idealmente seria o WhatsApp real
        true,
        now()
      );
    ELSE
      -- Atualiza colaborador existente para ativo
      UPDATE public.colaboradores
      SET ativo = true,
          user_id = v_user,
          nome = COALESCE(nome, v_user_name)
      WHERE empresa_id = v_invite.empresa_id
        AND (user_id = v_user OR whatsapp_numero = v_user_email);
    END IF;
  END IF;

  -- Marca convite como aceito
  UPDATE public.invites
  SET status = 'accepted',
      accepted_by = v_user,
      accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'empresa_id', v_invite.empresa_id,
    'role', v_invite.role
  );
END;
$$;

COMMENT ON FUNCTION public.accept_invite IS 
  'Aceita convite, cria profile com role/active_role/roles corretos e colaborador (se técnico)';

-- ========================================
-- VERIFICAÇÃO
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'accept_invite agora seta active_role e roles array corretamente';
END $$;
