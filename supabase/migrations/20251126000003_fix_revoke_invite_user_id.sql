-- Migration: Fix revoke_invite to use user_id instead of id
-- Date: 2025-11-26
-- Description: Bug fix - revoke_invite had the same user_id vs id issue

CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites;
  v_is_admin boolean;
BEGIN
  -- Busca convite
  SELECT * INTO v_invite
  FROM public.invites
  WHERE id = p_invite_id;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  -- Checa se usuário é admin (active_role OU roles array OU is_elisha_admin)
  -- FIX: usar user_id ao invés de id
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.user_id = auth.uid()  -- <-- CORRIGIDO: era pr.id = auth.uid()
      AND (
        -- Super admin pode revogar convites de qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode revogar convites
        (
          pr.empresa_id = v_invite.empresa_id
          AND (
            pr.active_role = 'admin' 
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode revogar convites
        (
          pr.is_elisha_admin = true
          AND pr.impersonating_empresa_id = v_invite.empresa_id
        )
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not allowed: only admin can revoke invites';
  END IF;

  -- Marca convite como revogado
  UPDATE public.invites
  SET status = 'revoked'
  WHERE id = p_invite_id;
END;
$$;

COMMENT ON FUNCTION public.revoke_invite IS 
  'Revoke invite. Allows: super admin, empresa admin (by active_role/roles), or super admin impersonating. FIX: user_id';

-- ========================================
-- VERIFICAÇÃO
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'revoke_invite agora usa user_id corretamente';
END $$;
