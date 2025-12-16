-- =====================================================
-- Migration: Restringir técnico a uma OS ativa por vez
-- Data: 2024-12-15
-- Descrição: Impede que um técnico aceite uma nova OS
--            se já tiver alguma em atendimento (em_andamento ou checkin)
-- =====================================================

CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os_ativa_count integer;
  v_os_ativa_numero text;
  v_data_inicio timestamptz;
  v_result jsonb;
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

  -- 3. Verificar se é técnico
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authorized',
      'message', 'Apenas técnicos podem aceitar ordens de serviço'
    );
  END IF;

  -- 4. Pegar tecnico_id (se for técnico real, não admin)
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

  -- 6. NOVA VERIFICAÇÃO: Checar se técnico já tem OS em atendimento
  IF v_tecnico_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_os_ativa_count
    FROM ordens_servico
    WHERE tecnico_id = v_tecnico_id
    AND status IN ('em_andamento', 'checkin', 'em_deslocamento')
    AND id != p_os_id;

    IF v_os_ativa_count > 0 THEN
      -- Buscar número da OS ativa para mensagem mais informativa
      SELECT numero_os
      INTO v_os_ativa_numero
      FROM ordens_servico
      WHERE tecnico_id = v_tecnico_id
      AND status IN ('em_andamento', 'checkin', 'em_deslocamento')
      AND id != p_os_id
      LIMIT 1;

      RETURN jsonb_build_object(
        'success', false,
        'error', 'already_has_active_os',
        'message', 'Você já possui uma OS em atendimento (' || COALESCE(v_os_ativa_numero, 'OS ativa') || '). Finalize-a antes de aceitar outra.'
      );
    END IF;
  END IF;

  -- 7. Buscar OS
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

  -- 8. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 9. Validar status
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Esta OS não está disponível para aceite (status: ' || v_os.status || ')'
    );
  END IF;

  -- 10. Validar se já tem técnico (exceto se for o mesmo)
  IF v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_assigned',
      'message', 'Esta OS já está atribuída a outro técnico'
    );
  END IF;

  -- 11. Calcular data_inicio garantindo que seja >= data_abertura
  -- Isso garante que a constraint ordens_servico_datas_logicas seja satisfeita
  v_data_inicio := GREATEST(now(), v_os.data_abertura);

  -- 12. Atualizar OS - Aceitar muda para em_deslocamento (técnico está indo ao local)
  UPDATE ordens_servico
  SET 
    tecnico_id = v_tecnico_id,
    status = 'em_deslocamento',
    data_inicio = COALESCE(data_inicio, v_data_inicio),
    updated_at = now()
  WHERE id = p_os_id;

  -- 13. Registrar no histórico (com action_type específico)
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
    v_os.status::text,
    'em_deslocamento',
    auth.uid(),
    now(),
    'accept',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'previous_tecnico_id', v_os.tecnico_id,
      'data_inicio', v_data_inicio
    )
  );

  -- 14. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'OS aceita! Você está em deslocamento para o local.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'em_deslocamento',
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

COMMENT ON FUNCTION os_accept(uuid) IS 'Permite que um técnico aceite uma OS disponível. Muda status para em_deslocamento. O técnico só pode ter uma OS ativa por vez.';
