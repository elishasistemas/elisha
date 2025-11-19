-- Fix: Separate policies for authenticated vs anonymous users
-- The issue: invites_select_same_empresa tries to access profiles table
-- which anonymous users don't have permission to read

-- Drop existing policies
DROP POLICY IF EXISTS invites_select_same_empresa ON public.invites;
DROP POLICY IF EXISTS invites_select_anonymous ON public.invites;
DROP POLICY IF EXISTS invites_select_authenticated ON public.invites;

-- Policy for AUTHENTICATED users (can access profiles table)
CREATE POLICY invites_select_authenticated
ON public.invites FOR SELECT
TO authenticated
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

-- Policy for ANONYMOUS users (signup page)
-- Simple condition, no access to profiles table needed

DROP POLICY IF EXISTS invites_select_anonymous ON public.invites;
CREATE POLICY invites_select_anonymous
ON public.invites FOR SELECT
TO anon
USING (
  status = 'pending'
);

COMMENT ON POLICY invites_select_authenticated ON public.invites IS 
  'Allow authenticated users to see invites from their empresa or if super admin';

COMMENT ON POLICY invites_select_anonymous ON public.invites IS 
  'Allow anonymous users to read pending invites for signup page';

