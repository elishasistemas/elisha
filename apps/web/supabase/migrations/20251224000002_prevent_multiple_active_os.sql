-- =====================================================
-- Migration: Prevent Multiple Active OS per Technician
-- Data: 2025-12-24
-- Descrição: Adiciona verificações nos RPCs os_accept e os_start_deslocamento
--            para garantir que um técnico não tenha múltiplas OSs ativas simultaneamente.
-- =====================================================

-- 1. Atualizar RPC: os_accept
CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os_ativa_numero text;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN RETURN jsonb_build_object('success', false, 'error', 'not_authorized'); END IF;
  
  -- NOVO: Verifica se o perfil está ativo
  IF v_profile.is_active = false THEN RETURN jsonb_build_object('success', false, 'error', 'profile_inactive'); END IF;

  -- Auto-link ou busca tecnico_id
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;
  
  IF v_tecnico_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'tecnico_not_linked'); END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  -- BUSCA OS ALVO
  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;

  IF v_os.empresa_id != v_empresa_id THEN RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa'); END IF;

  -- VERIFICA STATUS DA OS ALVO
  IF v_os.status NOT IN ('novo', 'parado') THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_status'); END IF;

  -- VERIFICA SE JÁ ESTÁ ATRIBUÍDA A OUTRO (Takeover permitido para Admin)
  IF v_profile.active_role != 'admin' AND v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_assigned');
  END IF;

  -- NOVO: VERIFICA SE O TÉCNICO JÁ TEM UMA OS ATIVA OU ATRIBUÍDA
  -- Bloqueia se tiver QUALQUER OS que não esteja concluída ou cancelada
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
      'message', 'Você já possui uma ordem de serviço ativa (' || v_os_ativa_numero || '). Finalize-a antes de aceitar outra.'
    );
  END IF;

  -- EXECUTA ACEITE E INICIA DESLOCAMENTO AUTOMATICAMENTE
  -- Toda OS com técnico deve estar em deslocamento ou atendimento
  UPDATE ordens_servico 
  SET tecnico_id = v_tecnico_id, 
      status = 'em_deslocamento',
      data_inicio = COALESCE(data_inicio, GREATEST(now(), v_os.data_abertura)),
      updated_at = now() 
  WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'em_deslocamento', auth.uid(), now(), 'accept_and_start', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'OS aceita e deslocamento iniciado!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar RPC: os_start_deslocamento
CREATE OR REPLACE FUNCTION os_start_deslocamento(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_data_inicio timestamptz;
  v_os_ativa_numero text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  -- NOVO: Verifica se o perfil está ativo
  IF v_profile.is_active = false THEN RETURN jsonb_build_object('success', false, 'error', 'profile_inactive'); END IF;

  -- Auto-link
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;

  IF v_tecnico_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'tecnico_not_linked'); END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;
  
  IF v_os.empresa_id != v_empresa_id THEN RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa'); END IF;

  -- Se for admin e não estiver atribuída, assume agora
  IF v_profile.active_role = 'admin' AND v_os.tecnico_id IS NULL THEN
    v_os.tecnico_id := v_tecnico_id;
  END IF;

  IF v_os.tecnico_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_assigned'); END IF;
  
  IF v_os.tecnico_id != v_tecnico_id AND v_profile.active_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_your_os');
  END IF;

  IF v_os.status NOT IN ('novo', 'parado') THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_status'); END IF;

  -- VERIFICA SE O TÉCNICO JÁ TEM OUTRA OS ATIVA OU ATRIBUÍDA
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
      'message', 'Você já possui uma ordem de serviço em andamento (' || v_os_ativa_numero || '). Finalize-a antes de iniciar outra.'
    );
  END IF;

  v_data_inicio := GREATEST(now(), v_os.data_abertura);

  UPDATE ordens_servico SET status = 'em_deslocamento', tecnico_id = v_os.tecnico_id, data_inicio = v_data_inicio, updated_at = now() WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'em_deslocamento', auth.uid(), now(), 'start_deslocamento', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'Deslocamento iniciado!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
