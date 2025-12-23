-- =====================================================
-- Migration: Add Username Support and Email Lookup Function
-- Description: Adds username column to profiles and creates RPC to resolve usernames to emails
-- Date: 2025-12-23
-- =====================================================

-- =====================================================
-- 1. Add Username Column to Profiles Table
-- =====================================================

-- Add username column (nullable initially for existing records)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text;

-- Add unique constraint (will fail if duplicates exist, handle manually if needed)
-- First, let's make sure no NULL usernames become an issue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_username_key'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- Add comment
COMMENT ON COLUMN public.profiles.username IS 'Username for login (alternative to email)';

-- =====================================================
-- 2. Create get_email_from_identifier RPC Function
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_email_from_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_email text;
BEGIN
  -- If identifier contains @, assume it's already an email
  IF identifier LIKE '%@%' THEN
    -- Verify email exists in auth.users
    SELECT email INTO v_email
    FROM auth.users
    WHERE LOWER(email) = LOWER(identifier)
    LIMIT 1;
    
    RETURN v_email;
  END IF;
  
  -- Otherwise, treat as username and lookup in profiles
  SELECT u.email INTO v_email
  FROM public.profiles p
  INNER JOIN auth.users u ON p.user_id = u.id
  WHERE LOWER(p.username) = LOWER(identifier)
  LIMIT 1;
  
  RETURN v_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_email_from_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_email_from_identifier(text) TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_email_from_identifier(text) IS 
'Resolves a username or email identifier to an email address for login purposes';

-- =====================================================
-- 3. Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Added username column to profiles table';
  RAISE NOTICE 'Created get_email_from_identifier RPC function';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: You may need to backfill username values for existing users';
  RAISE NOTICE '   Run this query to find users without usernames:';
  RAISE NOTICE '   SELECT id, user_id, nome FROM profiles WHERE username IS NULL;';
END $$;
