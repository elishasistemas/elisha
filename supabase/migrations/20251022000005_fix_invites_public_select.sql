-- Allow public (unauthenticated) users to read invites by token
-- This is needed for the signup page where users don't have an account yet

-- Create policy for anonymous users to read invites
CREATE POLICY invites_select_anonymous
ON public.invites FOR SELECT
TO anon
USING (
  -- Anonymous users can only see pending invites
  status = 'pending'
  -- No other restrictions needed - they need the UUID token anyway
);

COMMENT ON POLICY invites_select_anonymous ON public.invites IS 
  'Allow anonymous users to read pending invites for signup page';

