-- =====================================================
-- Migration: OS Status History + Accept/Decline RPCs
-- Data: 2025-10-27
-- Descrição: Implementa histórico de status da OS e 
--            RPCs para técnico aceitar/recusar ordens
-- =====================================================

-- =====================================================
-- 1. Tabela de Histórico de Status
-- =====================================================

CREATE TABLE IF NOT EXISTS public.os_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  
  -- Status transition
  status_anterior text,  -- Pode ser null no primeiro registro
  status_novo text NOT NULL,
  
  -- Audit fields
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  
  -- Context
  action_type text,  -- 'accept', 'decline', 'status_change', 'create'
  reason text,  -- Motivo (usado em decline)
  metadata jsonb DEFAULT '{}'::jsonb,  -- Dados extras (localização, etc)
  
  -- Multi-tenancy
  empresa_id uuid REFERENCES empresas(id),
  
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS os_status_history_os_id_idx ON os_status_history(os_id);
CREATE INDEX IF NOT EXISTS os_status_history_changed_at_idx ON os_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS os_status_history_empresa_id_idx ON os_status_history(empresa_id);
CREATE INDEX IF NOT EXISTS os_status_history_action_type_idx ON os_status_history(action_type);

COMMENT ON TABLE os_status_history IS 'Histórico completo de mudanças de status das ordens de serviço';
COMMENT ON COLUMN os_status_history.action_type IS 'Tipo da ação: accept, decline, status_change, create';
COMMENT ON COLUMN os_status_history.metadata IS 'Dados extras como localização, observações técnicas, etc';

-- =====================================================
-- 2. Trigger para Log Automático de Mudanças de Status
-- =====================================================

CREATE OR REPLACE FUNCTION log_os_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Pegar empresa_id da OS
  v_empresa_id := NEW.empresa_id;
  
  -- Registrar mudança de status (somente se status mudou)
  IF (TG_OP = 'INSERT') THEN
    -- Primeira inserção - registro de criação
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
      NEW.id,
      NULL,
      NEW.status,
      auth.uid(),
      NEW.created_at,
      'create',
      v_empresa_id,
      jsonb_build_object(
        'tipo', NEW.tipo,
        'prioridade', NEW.prioridade,
        'cliente_id', NEW.cliente_id,
        'equipamento_id', NEW.equipamento_id
      )
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Mudança de status
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
      NEW.id,
      OLD.status::text,
      NEW.status::text,
      auth.uid(),
      now(),
      'status_change',
      v_empresa_id,
      jsonb_build_object(
        'tecnico_id', NEW.tecnico_id,
        'data_inicio', NEW.data_inicio,
        'data_fim', NEW.data_fim
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trg_os_status_change ON ordens_servico;
CREATE TRIGGER trg_os_status_change
  AFTER INSERT OR UPDATE OF status ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION log_os_status_change();

COMMENT ON FUNCTION log_os_status_change() IS 'Registra automaticamente mudanças de status na tabela os_status_history';

-- =====================================================
-- 3. RPC: os_accept (Técnico aceita uma OS)
-- =====================================================

CREATE OR REPLACE FUNCTION os_accept(p_os_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_tecnico_id uuid;
  v_empresa_id uuid;
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
      'message', 'Esta OS não está disponível para aceite (status: ' || v_os.status || ')'
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

  -- 10. Atualizar OS
  UPDATE ordens_servico
  SET 
    tecnico_id = v_tecnico_id,
    status = 'em_andamento',
    data_inicio = COALESCE(data_inicio, now()),
    updated_at = now()
  WHERE id = p_os_id;

  -- 11. Registrar no histórico (com action_type específico)
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
    'em_andamento',
    auth.uid(),
    now(),
    'accept',
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_tecnico_id,
      'previous_tecnico_id', v_os.tecnico_id,
      'data_inicio', COALESCE(v_os.data_inicio, now())
    )
  );

  -- 12. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'OS aceita com sucesso! Você pode começar o atendimento.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', 'em_andamento',
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

COMMENT ON FUNCTION os_accept(uuid) IS 'Permite que um técnico aceite uma OS disponível e inicie o atendimento';

-- =====================================================
-- 4. RPC: os_decline (Técnico recusa uma OS)
-- =====================================================

CREATE OR REPLACE FUNCTION os_decline(
  p_os_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_os ordens_servico%ROWTYPE;
  v_profile profiles%ROWTYPE;
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

  -- 2. Buscar perfil
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil não encontrado'
    );
  END IF;

  -- 3. Verificar se é técnico
  IF v_profile.active_role NOT IN ('tecnico', 'admin') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authorized',
      'message', 'Apenas técnicos podem recusar ordens de serviço'
    );
  END IF;

  -- 4. Determinar empresa ativa
  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  -- 5. Buscar OS
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

  -- 6. Validar empresa
  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'wrong_empresa',
      'message', 'Esta OS pertence a outra empresa'
    );
  END IF;

  -- 7. Validar status
  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_status',
      'message', 'Esta OS não pode ser recusada (status: ' || v_os.status || ')'
    );
  END IF;

  -- 8. Registrar recusa no histórico (sem mudar status da OS)
  INSERT INTO os_status_history (
    os_id,
    status_anterior,
    status_novo,
    changed_by,
    changed_at,
    action_type,
    reason,
    empresa_id,
    metadata
  ) VALUES (
    p_os_id,
    v_os.status::text,
    v_os.status::text,  -- Mantém mesmo status
    auth.uid(),
    now(),
    'decline',
    p_reason,
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_profile.tecnico_id,
      'tecnico_nome', v_profile.nome_completo
    )
  );

  -- 9. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recusa registrada. Esta OS continuará disponível para outros técnicos.',
    'data', jsonb_build_object(
      'os_id', p_os_id,
      'status', v_os.status,
      'reason', p_reason
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'internal_error',
      'message', 'Erro ao recusar OS: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION os_decline(uuid, text) IS 'Permite que um técnico recuse uma OS disponível, registrando o motivo';

-- =====================================================
-- 5. Políticas RLS para os_status_history
-- =====================================================

-- Habilitar RLS
ALTER TABLE os_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (authenticated users da mesma empresa)
CREATE POLICY os_status_history_select_authenticated
  ON os_status_history
  FOR SELECT
  TO authenticated
  USING (
    -- Elisha Admin vê tudo
    (SELECT is_elisha_admin()) OR
    -- Usuários da mesma empresa
    empresa_id = (SELECT current_empresa_id())
  );

-- Policy: INSERT (apenas via funções SECURITY DEFINER ou admins)
CREATE POLICY os_status_history_insert_authenticated
  ON os_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Elisha Admin pode inserir
    (SELECT is_elisha_admin()) OR
    -- Admins da empresa podem inserir
    (
      empresa_id = (SELECT current_empresa_id()) AND
      (SELECT current_active_role()) = 'admin'
    )
  );

-- Policy: Não permite UPDATE ou DELETE (histórico é imutável)
CREATE POLICY os_status_history_no_update
  ON os_status_history
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY os_status_history_no_delete
  ON os_status_history
  FOR DELETE
  TO authenticated
  USING (false);

-- =====================================================
-- 6. Grants de Permissão
-- =====================================================

-- Permitir que authenticated execute os RPCs
GRANT EXECUTE ON FUNCTION os_accept(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION os_decline(uuid, text) TO authenticated;

-- Permitir acesso à tabela
GRANT SELECT ON os_status_history TO authenticated;
GRANT INSERT ON os_status_history TO authenticated;

-- =====================================================
-- 7. Comentários e Documentação
-- =====================================================

COMMENT ON TABLE os_status_history IS 'Histórico imutável de todas as mudanças de status e ações nas ordens de serviço';
COMMENT ON COLUMN os_status_history.action_type IS 'Tipos: create (criação), accept (aceite), decline (recusa), status_change (mudança manual)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

