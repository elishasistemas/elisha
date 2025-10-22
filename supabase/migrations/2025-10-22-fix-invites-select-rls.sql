-- Fix SELECT RLS policy for invites table
-- Allow super admin and impersonating super admin to see invites

-- Drop old policy
DROP POLICY IF EXISTS invites_select_same_empresa ON public.invites;

-- Create new policy with proper checks
CREATE POLICY invites_select_same_empresa
ON public.invites FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
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

COMMENT ON POLICY invites_select_same_empresa ON public.invites IS 
  'Allow users to see invites from their empresa, or super admin (including when impersonating)';

