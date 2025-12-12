-- Migration: Modificar os_accept e criar os_start_deslocamento
-- Date: 2025-12-11
-- Issue: Aceitar OS deve apenas atribuir técnico, não mudar status

-- =====================================================
-- 1. Modificar os_accept - apenas atribui técnico, NÃO muda status
-- =====================================================

CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
BEGIN
  -- 1. Validações iniciais
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar perfil do usuário
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil do usuário não encontrado'
    );
  END IF;

  -- 3. Verificar se é técnico ou admin
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_role',
      'message', 'Apenas técnicos podem aceitar OS'
    );
  END IF;

  -- 4. Obter tecnico_id do profile
  v_tecnico_id := v_profile.tecnico_id;
  
  IF v_tecnico_id IS NULL AND v_profile.active_role = 'tecnico' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'tecnico_not_linked',
      'message', 'Técnico não está vinculado a um colaborador'
    );
  END IF;

  -- 5. Determinar empresa ativa (considera impersonation)
  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  -- 6. Buscar OS
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada'
    );
  END IF;

  -- 7. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 8. Validar status
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Só é possível aceitar OS com status "Aberta" ou "Parado"'
    );
  END IF;

  -- 9. Validar se já tem técnico (exceto se for o mesmo)
  IF v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Esta OS já está atribuída a outro técnico'
    );
  END IF;

  -- 10. Atualizar OS - APENAS atribui técnico, NÃO muda status
  UPDATE ordens_servico
  SET 
    tecnico_id = v_tecnico_id,
    updated_at = now()
  WHERE id = p_os_id;

  -- 11. Registrar no histórico
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
    v_os.status, -- Status NÃO muda
    auth.uid(),
    now(),
    'accept',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'previous_tecnico_id', v_os.tecnico_id,
      'note', 'OS atribuída ao técnico (status não alterado)'
    )
  );

  -- 12. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'OS aceita! Ela foi adicionada à sua fila de atendimento.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', v_os.status,
      'tecnico_id', v_tecnico_id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao aceitar OS: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_accept(uuid) IS 'Técnico aceita uma OS disponível. Apenas atribui o técnico, NÃO muda o status. O técnico deve iniciar deslocamento separadamente.';


-- =====================================================
-- 2. Criar os_start_deslocamento - muda status de "novo" para "em_deslocamento"
-- =====================================================

CREATE OR REPLACE FUNCTION os_start_deslocamento(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_data_inicio timestamptz;
BEGIN
  -- 1. Validações iniciais
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar perfil do usuário
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil do usuário não encontrado'
    );
  END IF;

  -- 3. Verificar se é técnico ou admin
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_role',
      'message', 'Apenas técnicos podem iniciar deslocamento'
    );
  END IF;

  -- 4. Obter tecnico_id do profile
  v_tecnico_id := v_profile.tecnico_id;

  -- 5. Determinar empresa ativa
  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  -- 6. Buscar OS
  SELECT * INTO v_os
  FROM ordens_servico
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'os_not_found',
      'message', 'Ordem de serviço não encontrada'
    );
  END IF;

  -- 7. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 8. Validar se está atribuída ao técnico atual
  IF v_os.tecnico_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_assigned',
      'message', 'Esta OS não está atribuída a nenhum técnico. Aceite a OS primeiro.'
    );
  END IF;

  IF v_os.tecnico_id != v_tecnico_id AND v_profile.active_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_your_os',
      'message', 'Esta OS está atribuída a outro técnico'
    );
  END IF;

  -- 9. Validar status (deve estar em "novo" ou "parado")
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', format('Só é possível iniciar deslocamento de OS com status "Aberta" ou "Parado". Status atual: %s', v_os.status)
    );
  END IF;

  -- 10. Calcular data_inicio garantindo que seja >= data_abertura
  v_data_inicio := GREATEST(now(), v_os.data_abertura, COALESCE(v_os.data_inicio, v_os.data_abertura));

  -- 11. Atualizar OS
  UPDATE ordens_servico
  SET 
    status = 'em_deslocamento',
    data_inicio = v_data_inicio,
    updated_at = now()
  WHERE id = p_os_id;

  -- 12. Registrar no histórico
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
    'em_deslocamento',
    auth.uid(),
    now(),
    'start_deslocamento',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'data_inicio', v_data_inicio
    )
  );

  -- 13. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Deslocamento iniciado! Você está a caminho.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'em_deslocamento',
      'tecnico_id', v_tecnico_id,
      'data_inicio', v_data_inicio
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao iniciar deslocamento: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_start_deslocamento(uuid) IS 'Técnico inicia deslocamento para uma OS atribuída a ele. Muda status de "novo"/"parado" para "em_deslocamento".';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION os_start_deslocamento(uuid) TO authenticated;
