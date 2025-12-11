-- Create: RPC os_checkout para finalizar atendimento de OS
-- Date: 2025-12-09
-- Description: Permite que técnico realize checkout, capture assinatura e finalize a OS

CREATE OR REPLACE FUNCTION os_checkout(
  p_os_id uuid,
  p_estado_equipamento text,
  p_nome_cliente text,
  p_assinatura_base64 text
)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_assinatura_id uuid;
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
      'error', 'not_authorized',
      'message', 'Apenas técnicos podem realizar checkout'
    );
  END IF;

  -- 4. Pegar tecnico_id
  v_tecnico_id := v_profile.tecnico_id;

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

  -- 8. Validar status (deve estar em checkin ou em_andamento)
  IF v_os.status NOT IN ('checkin', 'em_andamento') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Checkout só pode ser feito após check-in (status atual: ' || v_os.status || ')'
    );
  END IF;

  -- 9. Validar se é o técnico da OS (ou admin)
  IF v_profile.active_role = 'tecnico' AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_assigned',
      'message', 'Esta OS está atribuída a outro técnico'
    );
  END IF;

  -- 10. Validar campos obrigatórios
  IF p_estado_equipamento IS NULL OR p_estado_equipamento = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'missing_estado',
      'message', 'Estado do equipamento é obrigatório'
    );
  END IF;

  IF p_nome_cliente IS NULL OR p_nome_cliente = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'missing_nome',
      'message', 'Nome do cliente é obrigatório'
    );
  END IF;

  IF p_assinatura_base64 IS NULL OR p_assinatura_base64 = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'missing_signature',
      'message', 'Assinatura do cliente é obrigatória'
    );
  END IF;

  -- 11. Salvar assinatura
  INSERT INTO os_assinaturas (
    os_id,
    empresa_id,
    nome_cliente,
    assinatura_base64,
    metadata
  ) VALUES (
    p_os_id,
    v_empresa_id,
    p_nome_cliente,
    p_assinatura_base64,
    jsonb_build_object(
      'estado_equipamento', p_estado_equipamento,
      'collected_by', auth.uid(),
      'collected_at', now()
    )
  )
  RETURNING id INTO v_assinatura_id;

  -- 12. Atualizar OS para concluído (assinatura já foi coletada)
  UPDATE ordens_servico
  SET 
    status = 'concluido',
    data_fim = now(),
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
    v_os.status::text,
    'concluido',
    auth.uid(),
    now(),
    'checkout',
    v_empresa_id,
    jsonb_build_object(
      'estado_equipamento', p_estado_equipamento,
      'nome_cliente', p_nome_cliente,
      'assinatura_id', v_assinatura_id,
      'data_fim', now()
    )
  );

  -- 14. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Checkout realizado com sucesso! OS concluída.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'concluido',
      'assinatura_id', v_assinatura_id,
      'data_fim', now()
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao realizar checkout: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_checkout(uuid, text, text, text) IS 'Permite que técnico realize checkout, capture estado do equipamento, nome e assinatura do cliente, e finalize a OS';
