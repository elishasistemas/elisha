-- Migration: Fix accept_invite to link tecnico_id in profiles
-- Date: 2025-12-08
-- Description: Quando um técnico aceita convite, criar colaborador E vincular tecnico_id no profile

-- Drop função antiga (com assinatura antiga)
DROP FUNCTION IF EXISTS public.accept_invite(uuid);

-- Criar nova função com parâmetros adicionais
CREATE OR REPLACE FUNCTION public.accept_invite(
  p_token uuid,
  p_nome text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_whatsapp_numero text DEFAULT NULL,
  p_funcao text DEFAULT NULL
)
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
  v_colaborador_id uuid;  -- <-- NOVO: armazena ID do colaborador criado
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
    -- Cria profile novo com role, active_role e roles (sem tecnico_id ainda)
    INSERT INTO public.profiles (
      user_id, 
      empresa_id, 
      role, 
      active_role, 
      roles, 
      nome,
      created_at
    )
    VALUES (
      v_user, 
      v_invite.empresa_id, 
      v_invite.role, 
      v_invite.role,
      ARRAY[v_invite.role],
      v_user_name,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET empresa_id = EXCLUDED.empresa_id, 
        role = EXCLUDED.role,
        active_role = EXCLUDED.active_role,
        roles = EXCLUDED.roles,
        nome = EXCLUDED.nome;
  ELSE
    -- Atualiza profile existente com role, active_role e roles (sem tecnico_id ainda)
    UPDATE public.profiles
    SET empresa_id = v_invite.empresa_id,
        role = v_invite.role,
        active_role = v_invite.role,
        roles = ARRAY[v_invite.role],
        nome = COALESCE(nome, v_user_name)
    WHERE user_id = v_user;
  END IF;

  -- Se o role é 'tecnico', cria registro em colaboradores E vincula tecnico_id
  IF v_invite.role = 'tecnico' THEN
    -- Verifica se já existe colaborador para este usuário nesta empresa
    SELECT id INTO v_colaborador_id
    FROM public.colaboradores 
    WHERE empresa_id = v_invite.empresa_id 
      AND user_id = v_user
    LIMIT 1;

    IF v_colaborador_id IS NULL THEN
      -- Cria colaborador e pega o ID
      INSERT INTO public.colaboradores (
        empresa_id, 
        user_id,
        nome, 
        telefone,
        whatsapp_numero, 
        funcao,
        ativo, 
        created_at
      )
      VALUES (
        v_invite.empresa_id,
        v_user,
        COALESCE(p_nome, v_user_name),
        p_telefone,
        COALESCE(p_whatsapp_numero, v_user_email), -- Usa email como fallback se não fornecido
        p_funcao,
        true,
        now()
      )
      RETURNING id INTO v_colaborador_id;
      
      RAISE NOTICE 'Colaborador criado com ID: %', v_colaborador_id;
    ELSE
      -- Atualiza colaborador existente para ativo
      UPDATE public.colaboradores
      SET ativo = true,
          nome = COALESCE(nome, v_user_name)
      WHERE id = v_colaborador_id;
      
      RAISE NOTICE 'Colaborador atualizado com ID: %', v_colaborador_id;
    END IF;

    -- AGORA vincula o tecnico_id no profile
    UPDATE public.profiles
    SET tecnico_id = v_colaborador_id
    WHERE user_id = v_user;
    
    RAISE NOTICE 'Profile vinculado ao colaborador ID: %', v_colaborador_id;
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
    'role', v_invite.role,
    'tecnico_id', v_colaborador_id  -- <-- NOVO: retorna tecnico_id criado
  );
END;
$$;

COMMENT ON FUNCTION public.accept_invite IS 
  'Aceita convite, cria profile com role/active_role/roles corretos, cria colaborador (se técnico) E vincula tecnico_id no profile';
