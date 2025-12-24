-- =====================================================
-- Migration: Admin Auto-Linking and Comprehensive OS Action Updates
-- Data: 2025-12-24
-- Descrição: 1. Função auxiliar para auto-vincular admins a colaboradores.
--            2. Atualiza os_accept, os_checkin, os_start_deslocamento e os_checkout.
--            3. Garante que administradores ajam como técnicos sem bloqueios.
--            4. Backfill de administradores existentes.
-- =====================================================

-- 1. Função Auxiliar: Garantir que Admin tenha um registro de Colaborador
CREATE OR REPLACE FUNCTION get_or_create_colaborador_for_admin(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
    v_profile profiles%ROWTYPE;
    v_colaborador_id uuid;
BEGIN
    -- 1.1 Buscar perfil
    SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
    IF NOT FOUND THEN RETURN NULL; END IF;

    -- 1.2 Verificar se já tem tecnico_id no perfil
    IF v_profile.tecnico_id IS NOT NULL THEN
        -- Validar se o colaborador ainda existe e está ativo
        SELECT id INTO v_colaborador_id FROM colaboradores WHERE id = v_profile.tecnico_id AND ativo = true;
        IF v_colaborador_id IS NOT NULL THEN
            RETURN v_colaborador_id;
        END IF;
    END IF;

    -- 1.3 Procurar colaborador existente pelo user_id
    SELECT id INTO v_colaborador_id FROM colaboradores WHERE user_id = p_user_id AND ativo = true LIMIT 1;
    
    -- 1.4 Se não existir, criar um novo
    IF v_colaborador_id IS NULL THEN
        INSERT INTO colaboradores (
            empresa_id,
            user_id,
            nome,
            whatsapp_numero,
            funcao,
            ativo
        ) VALUES (
            v_profile.empresa_id,
            p_user_id,
            COALESCE(v_profile.nome, 'Administrador'),
            COALESCE(v_profile.whatsapp_numero, '00000000000'),
            'Administrador',
            true
        ) RETURNING id INTO v_colaborador_id;
    END IF;

    -- 1.5 Atualizar perfil com o tecnico_id (se mudou ou era nulo)
    IF v_profile.tecnico_id IS DISTINCT FROM v_colaborador_id THEN
        UPDATE profiles SET tecnico_id = v_colaborador_id WHERE user_id = p_user_id;
    END IF;

    RETURN v_colaborador_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar RPC: os_accept (Atribuição e Takeover)
CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_os_ativa_count integer;
  v_os_ativa_numero text;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN RETURN jsonb_build_object('success', false, 'error', 'not_authorized'); END IF;

  -- Auto-link
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;
  
  IF v_tecnico_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'tecnico_not_linked'); END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;

  IF v_os.empresa_id != v_empresa_id THEN RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa'); END IF;

  IF v_os.status NOT IN ('novo', 'parado') THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_status'); END IF;

  IF v_profile.active_role != 'admin' AND v_os.tecnico_id IS NOT NULL AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_assigned');
  END IF;

  UPDATE ordens_servico SET tecnico_id = v_tecnico_id, updated_at = now() WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, v_os.status, auth.uid(), now(), 'accept', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'OS aceita com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar RPC: os_start_deslocamento
CREATE OR REPLACE FUNCTION os_start_deslocamento(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
  v_data_inicio timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  -- Auto-link
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;

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

  v_data_inicio := GREATEST(now(), v_os.data_abertura);

  UPDATE ordens_servico SET status = 'em_deslocamento', tecnico_id = v_os.tecnico_id, data_inicio = v_data_inicio, updated_at = now() WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'em_deslocamento', auth.uid(), now(), 'start_deslocamento', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'Deslocamento iniciado!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atualizar RPC: os_checkin
CREATE OR REPLACE FUNCTION os_checkin(p_os_id uuid, p_location jsonb DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  -- Auto-link
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;

  IF v_os.empresa_id != v_empresa_id THEN RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa'); END IF;

  -- Admin assume OS se necessário
  IF v_profile.active_role = 'admin' AND (v_os.tecnico_id IS NULL OR v_os.tecnico_id != v_tecnico_id) THEN
    v_os.tecnico_id := v_tecnico_id;
  END IF;

  UPDATE ordens_servico SET status = 'checkin', tecnico_id = v_os.tecnico_id, updated_at = now() WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'checkin', auth.uid(), now(), 'checkin', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id, 'location', p_location));

  RETURN jsonb_build_object('success', true, 'message', 'Check-in realizado!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atualizar RPC: os_checkout
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
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'not_authenticated'); END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'profile_not_found'); END IF;

  -- Auto-link
  IF v_profile.active_role = 'admin' THEN v_tecnico_id := get_or_create_colaborador_for_admin(auth.uid());
  ELSE v_tecnico_id := v_profile.tecnico_id; END IF;

  v_empresa_id := COALESCE(v_profile.impersonating_empresa_id, v_profile.empresa_id);

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'os_not_found'); END IF;

  IF v_profile.active_role != 'admin' AND v_os.tecnico_id != v_tecnico_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_assigned');
  END IF;

  -- Salvar assinatura
  INSERT INTO os_assinaturas (os_id, empresa_id, nome_cliente, assinatura_base64, metadata)
  VALUES (p_os_id, v_empresa_id, p_nome_cliente, p_assinatura_base64, jsonb_build_object('collected_by', auth.uid()))
  RETURNING id INTO v_assinatura_id;

  UPDATE ordens_servico SET status = 'concluido', tecnico_id = COALESCE(tecnico_id, v_tecnico_id), data_fim = now(), updated_at = now() WHERE id = p_os_id;

  INSERT INTO os_status_history (os_id, status_anterior, status_novo, changed_by, changed_at, action_type, empresa_id, metadata)
  VALUES (p_os_id, v_os.status, 'concluido', auth.uid(), now(), 'checkout', v_empresa_id, jsonb_build_object('tecnico_id', v_tecnico_id));

  RETURN jsonb_build_object('success', true, 'message', 'OS finalizada!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Backfill
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT user_id FROM profiles WHERE active_role = 'admin' OR 'admin' = ANY(roles)) LOOP
        PERFORM get_or_create_colaborador_for_admin(r.user_id);
    END LOOP;
END $$;
