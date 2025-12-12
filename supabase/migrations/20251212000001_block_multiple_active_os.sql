-- Migration para bloquear técnico de ter múltiplas OS em andamento simultaneamente
-- Um técnico só pode ter uma OS com status 'em_deslocamento', 'checkin' ou 'em_andamento' por vez

-- =====================================================
-- 1. ATUALIZAR FUNÇÃO os_start_deslocamento
-- =====================================================
CREATE OR REPLACE FUNCTION os_start_deslocamento(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_os record;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_data_inicio timestamptz;
  v_os_ativa record;
BEGIN
  -- 1. Obter user_id autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar profile do usuário
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil de usuário não encontrado'
    );
  END IF;

  -- 3. Verificar role (deve ser técnico ou admin)
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

  -- ========== NOVA VALIDAÇÃO ==========
  -- 10. Verificar se técnico já tem outra OS em andamento
  SELECT * INTO v_os_ativa
  FROM ordens_servico
  WHERE tecnico_id = v_tecnico_id
    AND id != p_os_id
    AND status IN ('em_deslocamento', 'checkin', 'em_andamento')
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'has_active_os',
      'message', format('Você já possui uma OS em andamento (OS %s). Finalize-a antes de iniciar outra.', 
        COALESCE(v_os_ativa.numero_os, v_os_ativa.id::text))
    );
  END IF;
  -- ====================================

  -- 11. Calcular data_inicio garantindo que seja >= data_abertura
  v_data_inicio := GREATEST(now(), v_os.data_abertura, COALESCE(v_os.data_inicio, v_os.data_abertura));

  -- 12. Atualizar OS
  UPDATE ordens_servico
  SET 
    status = 'em_deslocamento',
    data_inicio = v_data_inicio,
    updated_at = now()
  WHERE id = p_os_id;

  -- 13. Registrar no histórico
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

  -- 14. Retornar sucesso
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

-- =====================================================
-- 2. ATUALIZAR FUNÇÃO os_checkin
-- =====================================================
CREATE OR REPLACE FUNCTION os_checkin(p_os_id uuid, p_location jsonb DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_os record;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os_ativa record;
BEGIN
  -- 1. Obter user_id autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Usuário não autenticado'
    );
  END IF;

  -- 2. Buscar profile do usuário
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found', 
      'message', 'Perfil de usuário não encontrado'
    );
  END IF;

  -- 3. Verificar role
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_role',
      'message', 'Apenas técnicos podem fazer check-in'
    );
  END IF;

  -- 4. Obter tecnico_id
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

  -- 8. Validar atribuição
  IF v_os.tecnico_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_assigned',
      'message', 'Esta OS não está atribuída. Aceite primeiro.'
    );
  END IF;

  IF v_os.tecnico_id != v_tecnico_id AND v_profile.active_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_your_os',
      'message', 'Esta OS está atribuída a outro técnico'
    );
  END IF;

  -- 9. Validar status
  IF v_os.status != 'em_deslocamento' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', format('Só é possível iniciar atendimento de OS em deslocamento. Status atual: %s', v_os.status)
    );
  END IF;

  -- ========== NOVA VALIDAÇÃO ==========
  -- 10. Verificar se técnico já tem outra OS em andamento (deslocamento, checkin ou em_andamento)
  SELECT * INTO v_os_ativa
  FROM ordens_servico
  WHERE tecnico_id = v_tecnico_id
    AND id != p_os_id
    AND status IN ('em_deslocamento', 'checkin', 'em_andamento')
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'has_active_os',
      'message', format('Você já possui uma OS em andamento (OS %s). Finalize-a antes de iniciar outra.', 
        COALESCE(v_os_ativa.numero_os, v_os_ativa.id::text))
    );
  END IF;
  -- ====================================

  -- 11. Atualizar OS
  UPDATE ordens_servico
  SET 
    status = 'checkin',
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
    'checkin',
    auth.uid(),
    now(),
    'checkin',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'location', p_location
    )
  );

  -- 13. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Atendimento iniciado! Você está no local.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'checkin',
      'tecnico_id', v_tecnico_id
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao fazer check-in: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_start_deslocamento(uuid) IS 'Técnico inicia deslocamento para uma OS. Bloqueia se já tiver outra OS em andamento.';
COMMENT ON FUNCTION os_checkin(uuid, jsonb) IS 'Técnico faz check-in no local. Bloqueia se já tiver outra OS em atendimento.';
