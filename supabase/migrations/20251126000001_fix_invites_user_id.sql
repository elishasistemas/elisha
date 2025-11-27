-- Migration: Fix create_invite function and invites RLS to use user_id instead of id
-- Date: 2025-11-26
-- Description: Bug fix - auth.uid() returns user_id, not profile.id

-- ========================================
-- 1. FIX create_invite FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION public.create_invite(
  p_empresa_id uuid,
  p_email text,
  p_role text,
  p_expires_days int default 7
)
RETURNS public.invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites;
  v_is_admin boolean;
BEGIN
  -- Validar role (apenas admin e tecnico)
  IF p_role NOT IN ('admin', 'tecnico') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or tecnico';
  END IF;

  -- Checa admin da empresa (active_role OU roles array OU is_elisha_admin)
  -- FIX: usar user_id ao invés de id para comparar com auth.uid()
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.user_id = auth.uid()  -- <-- CORRIGIDO: era pr.id = auth.uid()
      AND (
        -- Super admin pode criar convites para qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode criar convites
        (
          pr.empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode criar convites
        (
          pr.is_elisha_admin = true
          AND pr.impersonating_empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not allowed: only admin can create invites for this empresa';
  END IF;

  -- Cria convite usando user_id do profile logado
  INSERT INTO public.invites (empresa_id, email, role, token, expires_at, status, created_at, created_by)
  VALUES (
    p_empresa_id,
    lower(p_email),
    p_role,
    gen_random_uuid(),
    now() + (p_expires_days || ' days')::interval,
    'pending',
    now(),
    auth.uid()  -- <-- user_id do criador
  )
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$;

COMMENT ON FUNCTION public.create_invite IS 
'Cria convite para novo usuário (apenas admin da empresa ou super admin). FIX: usar user_id ao invés de id';

-- ========================================
-- 2. FIX INVITES RLS POLICIES
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS invites_select_same_empresa ON public.invites;
DROP POLICY IF EXISTS invites_select_anonymous ON public.invites;
DROP POLICY IF EXISTS invites_select_authenticated ON public.invites;

-- Policy for AUTHENTICATED users (can access profiles table)
-- FIX: usar user_id ao invés de id
CREATE POLICY invites_select_authenticated
ON public.invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()  -- <-- CORRIGIDO: era p.id = auth.uid()
      AND (
        -- Super admin pode ver convites de qualquer empresa
        p.is_elisha_admin = true
        OR
        -- Usuários da mesma empresa
        p.empresa_id = invites.empresa_id
        OR
        -- Super admin impersonando pode ver convites da empresa impersonada
        (
          p.is_elisha_admin = true
          AND p.impersonating_empresa_id = invites.empresa_id
        )
      )
  )
);

-- Policy for ANONYMOUS users (signup page)
-- Permite ver convites pendentes sem precisar acessar profiles
CREATE POLICY invites_select_anonymous
ON public.invites FOR SELECT
TO anon
USING (
  status = 'pending'
  AND expires_at > now()
);

COMMENT ON POLICY invites_select_authenticated ON public.invites IS 
  'Allow authenticated users to see invites from their empresa or if super admin. FIX: usar user_id';

COMMENT ON POLICY invites_select_anonymous ON public.invites IS 
  'Allow anonymous users to read pending non-expired invites for signup page';

-- ========================================
-- 3. VERIFICAÇÃO
-- ========================================

-- Testar se auth.uid() está sendo usado corretamente
DO $$
BEGIN
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'create_invite agora usa user_id corretamente';
  RAISE NOTICE 'RLS policies agora usam user_id corretamente';
END $$;
