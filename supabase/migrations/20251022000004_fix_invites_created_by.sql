-- Fix created_by constraint to allow NULL for super admin invites
-- Super admins can create invites without being part of the company

-- Remove NOT NULL constraint from created_by
ALTER TABLE public.invites 
  ALTER COLUMN created_by DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.invites.created_by IS 
  'User who created the invite. Can be NULL for super admin invites.';

