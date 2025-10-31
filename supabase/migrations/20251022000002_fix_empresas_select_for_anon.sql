-- Allow anonymous users to read empresas table (for signup page)
-- The existing policy calls is_elisha_admin() which tries to access profiles
-- This fails for anonymous users

-- Create a simple policy for anonymous users (idempotent)
DROP POLICY IF EXISTS empresas_select_anon ON public.empresas;
CREATE POLICY empresas_select_anon
ON public.empresas FOR SELECT
TO anon
USING (true);  -- Allow reading all empresas for signup page

COMMENT ON POLICY empresas_select_anon ON public.empresas IS 
  'Allow anonymous users to read empresa names for signup page (not sensitive data)';

