-- =====================================================
-- Migration: Create os_checkin RPC
-- Description: Permite que técnico registre chegada no local (check-in)
-- Author: Elisha AI
-- Date: 2025-10-28
-- Task: 3 (Check-in com Timestamp)
-- =====================================================

-- =====================================================
-- RPC: os_checkin
-- Description: Registra chegada do técnico no local da OS
-- =====================================================
CREATE OR REPLACE FUNCTION os_checkin(
  p_os_id uuid,
  p_location jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os ordens_servico%ROWTYPE;
BEGIN
  -- =====================================================
  -- 1) Validar autenticação
  -- =====================================================
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Você precisa estar autenticado para fazer check-in.'
    );
  END IF;

  -- =====================================================
  -- 2) Buscar perfil do usuário
  -- =====================================================
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil de usuário não encontrado.'
    );
  END IF;

  -- =====================================================
  -- 3) Validar se é técnico ou admin
  -- =====================================================
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_role',
      'message', 'Apenas técnicos podem fazer check-in.'
    );
  END IF;

  -- =====================================================
  -- 4) Buscar empresa ativa (impersonation-aware)
  -- =====================================================
  SELECT COALESCE(
    v_profile.impersonating_empresa_id,
    v_profile.empresa_id
  ) INTO v_empresa_id;

  IF v_empresa_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'empresa_not_found',
      'message', 'Empresa não identificada.'
    );
  END IF;

  -- =====================================================
  -- 5) Buscar e validar OS
  -- =====================================================
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada.'
    );
  END IF;

  -- =====================================================
  -- 6) Validar empresa da OS
  -- =====================================================
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS não pertence à sua empresa.'
    );
  END IF;

  -- =====================================================
  -- 7) Determinar técnico_id
  --    - Admin: usa tecnico_id da OS
  --    - Técnico: usa seu próprio colaborador vinculado
  -- =====================================================
  IF v_profile.active_role = 'admin' THEN
    -- Admin usa o técnico já atribuído à OS
    v_tecnico_id := v_os.tecnico_id;
    
    IF v_tecnico_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'no_tecnico_assigned',
        'message', 'Esta OS não tem técnico atribuído.'
      );
    END IF;
  ELSE
    -- Técnico usa seu próprio colaborador vinculado
    SELECT id INTO v_tecnico_id
    FROM colaboradores
    WHERE user_id = auth.uid()
      AND ativo = true
    LIMIT 1;

    IF v_tecnico_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'tecnico_not_found',
        'message', 'Você não está vinculado a um técnico ativo.'
      );
    END IF;

    -- Validar se OS está atribuída ao técnico
    IF v_os.tecnico_id != v_tecnico_id THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'os_not_assigned',
        'message', 'Esta OS não está atribuída a você.'
      );
    END IF;
  END IF;

  -- =====================================================
  -- 8) Validar status atual (deve estar em deslocamento)
  -- =====================================================
  IF v_os.status != 'em_deslocamento' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', format('Só é possível fazer check-in em OS "Em Deslocamento". Status atual: %s', v_os.status)
    );
  END IF;

  -- =====================================================
  -- 9) Atualizar status da OS para 'checkin'
  -- =====================================================
  UPDATE ordens_servico
  SET 
    status = 'checkin',
    updated_at = now()
  WHERE id = p_os_id;

  -- =====================================================
  -- 10) Registrar no histórico com metadata
  -- =====================================================
  INSERT INTO os_status_history (
    os_id,
    status_anterior,
    status_novo,
    changed_by,
    changed_at,
    action_type,
    empresa_id,
    metadata
  ) VALUES (
    p_os_id,
    v_os.status,
    'checkin',
    auth.uid(),
    now(),
    'checkin',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'tecnico_nome', v_profile.nome,
      'location', p_location,
      'data_checkin', now()
    )
  );

  -- =====================================================
  -- 11) Retornar sucesso
  -- =====================================================
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Check-in realizado com sucesso! Você chegou ao local da OS %s.', v_os.numero_os),
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'checkin',
      'tecnico_id', v_tecnico_id,
      'checkin_at', now(),
      'location', p_location
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', format('Erro ao fazer check-in: %s', SQLERRM)
    );
END;
$$;

-- =====================================================
-- Grant EXECUTE to authenticated users
-- =====================================================
GRANT EXECUTE ON FUNCTION os_checkin(uuid, jsonb) TO authenticated;

-- =====================================================
-- Add comment
-- =====================================================
COMMENT ON FUNCTION os_checkin IS 'Registra chegada do técnico no local da OS (transição: em_deslocamento → checkin)';

