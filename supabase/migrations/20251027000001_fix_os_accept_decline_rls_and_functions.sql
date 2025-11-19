-- Patch: Relax RLS for os_status_history and fix os_decline metadata column
-- Date: 2025-10-27

-- 1) Ensure technicians can insert history entries via RPCs/trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'os_status_history' AND policyname = 'os_status_history_insert_authenticated'
  ) THEN
    EXECUTE 'DROP POLICY os_status_history_insert_authenticated ON public.os_status_history';
  END IF;
END$$;

-- New policy: any authenticated user from same empresa can insert history rows

DROP POLICY IF EXISTS os_status_history_insert_authenticated ON public.os_status_history;
CREATE POLICY os_status_history_insert_authenticated
  ON public.os_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id = public.current_empresa_id()
    OR (SELECT coalesce(nullif(current_setting('request.jwt.claims', true)::jsonb->>'is_elisha_admin',''), 'false'))::boolean = true
    OR (SELECT public.current_active_role()) IN ('admin','tecnico')
  );

-- 2) Fix os_decline to use profile.nome instead of nome_completo (compat with current schema)
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
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated', 'message', 'Usuário não autenticado');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found', 'message', 'Perfil do usuário não encontrado');
  END IF;

  IF v_profile.is_elisha_admin AND v_profile.impersonating_empresa_id IS NOT NULL THEN
    v_empresa_id := v_profile.impersonating_empresa_id;
  ELSE
    v_empresa_id := v_profile.empresa_id;
  END IF;

  SELECT * INTO v_os FROM ordens_servico WHERE id = p_os_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'os_not_found', 'message', 'Ordem de serviço não encontrada');
  END IF;

  IF v_os.empresa_id != v_empresa_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'wrong_empresa', 'message', 'Esta OS pertence a outra empresa');
  END IF;

  IF v_os.status NOT IN ('novo', 'parado') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status', 'message', 'Esta OS não pode ser recusada (status: ' || v_os.status || ')');
  END IF;

  INSERT INTO os_status_history (
    os_id, status_anterior, status_novo, changed_by, changed_at, action_type, reason, empresa_id, metadata
  ) VALUES (
    p_os_id,
    v_os.status::text,
    v_os.status::text,
    auth.uid(),
    now(),
    'decline',
    p_reason,
    v_empresa_id,
    jsonb_build_object(
      'tecnico_id', v_profile.tecnico_id,
      'tecnico_nome', coalesce(v_profile.nome, NULL)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recusa registrada. Esta OS continuará disponível para outros técnicos.',
    'data', jsonb_build_object('os_id', p_os_id, 'status', v_os.status, 'reason', p_reason)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'internal_error', 'message', 'Erro ao recusar OS: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

