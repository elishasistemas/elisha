-- =====================================================
-- Migration: Consolidated os_accept logic
-- Data: 2025-12-24
-- Descrição: Consolida a lógica de aceitar OS:
--            1. Atribui o técnico (auto-link se admin).
--            2. Muda o status para 'em_deslocamento' automaticamente.
--            3. Impede aceite se já tiver outra OS ativa/em andamento.
--            4. Registra histórico com action_type 'accept_and_start'.
-- =====================================================

CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os_ativa_numero text;
BEGIN
  -- 1. Verificações de Autenticação e Perfil
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN RETURN jsonb_build_object('success', false, 'error', 'not_authorized'); END IF;
  
  IF v_profile.is_active = false THEN RETURN jsonb_build_object('success', false, 'error', 'profile_inactive'); END IF;

  -- 2. Auto-link ou busca tecnico_id
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;
  
  IF v_tecnico_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'tecnico_not_linked'); END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  -- 3. Busca e valida OS alvo
  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;

  IF v_os.empresa_id != v_empresa_id THEN RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa'); END IF;

  IF v_os.status NOT IN ('novo', 'parado') THEN 
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'message', 'Esta OS não está disponível (status: ' || v_os.status || ')'); 
  END IF;

  -- 4. Validação de técnico já atribuído (Takeover permitido para Admin)
  IF v_profile.active_role != 'admin' AND v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_assigned', 'message', 'Esta OS já está atribuída a outro técnico');
  END IF;

  -- 5. VERIFICA SE O TÉCNICO JÁ TEM UMA OS ATIVA (Exceto a própria)
  SELECT numero_os INTO v_os_ativa_numero 
  FROM ordens_servico 
  WHERE tecnico_id = v_tecnico_id 
    AND status NOT IN ('concluido', 'cancelado')
    AND id != p_os_id
  LIMIT 1;

  IF v_os_ativa_numero IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'tecnico_busy',
      'message', 'Você já possui uma ordem de serviço em andamento (' || v_os_ativa_numero || '). Finalize-a antes de aceitar outra.'
    );
  END IF;

  -- 6. EXECUTA ACEITE E INICIA DESLOCAMENTO AUTOMATICAMENTE
  UPDATE ordens_servico 
  SET tecnico_id = v_tecnico_id, 
      status = 'em_deslocamento',
      data_inicio = COALESCE(data_inicio, GREATEST(now(), v_os.data_abertura)),
      updated_at = now() 
  WHERE id = p_os_id;

  -- 7. Registrar histórico
  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'em_deslocamento', auth.uid(), now(), 'accept_and_start', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'OS aceita! Você já está em deslocamento para o local.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_accept(uuid) IS 'Aceita uma OS e já coloca o técnico em deslocamento automaticamente.';
