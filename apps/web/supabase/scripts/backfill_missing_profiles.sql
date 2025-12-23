-- =====================================================
-- Script: Backfill Profiles for Users Without Profiles
-- Description: Creates profile records for auth.users that don't have profiles
-- Usage: Run this AFTER applying the username migration
-- =====================================================

-- This script helps fix the "profile_not_found" error by creating
-- profiles for any auth.users who don't have corresponding profile records

-- =====================================================
-- Step 1: Identify users without profiles
-- =====================================================

SELECT 
  u.id as user_id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'nome' as nome,
  u.raw_user_meta_data->>'username' as username,
  u.raw_user_meta_data->>'role' as role,
  u.raw_user_meta_data->>'empresa_id' as empresa_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- =====================================================
-- Step 2: Create missing profiles
-- =====================================================

-- Run this INSERT to create profiles for users who don't have them
-- This will use metadata from auth.users to populate the profile

INSERT INTO public.profiles (
  user_id,
  username,
  nome,
  empresa_id,
  role,
  active_role,
  roles,
  is_elisha_admin,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    LEFT(u.email, POSITION('@' IN u.email) - 1)  -- Fallback: use email prefix as username
  ) as username,
  COALESCE(u.raw_user_meta_data->>'nome', u.email) as nome,
  (u.raw_user_meta_data->>'empresa_id')::uuid as empresa_id,
  COALESCE(u.raw_user_meta_data->>'role', 'tecnico') as role,
  COALESCE(u.raw_user_meta_data->>'role', 'tecnico') as active_role,
  ARRAY[COALESCE(u.raw_user_meta_data->>'role', 'tecnico')] as roles,
  false as is_elisha_admin,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL
ON CONFLICT (user_id) DO NOTHING;  -- Skip if profile was created in the meantime

-- =====================================================
-- Step 3: Link colaboradores to users if not linked
-- =====================================================

-- Find colaboradores that might belong to users but aren't linked
-- This helps with the follow-up issue where técnicos can't check in
-- because they don't have a colaborador linked

SELECT 
  c.id as colaborador_id,
  c.nome as colaborador_nome,
  c.whatsapp_numero,
  p.user_id,
  p.nome as profile_nome,
  p.username,
  u.email
FROM public.colaboradores c
LEFT JOIN public.profiles p ON p.nome = c.nome AND p.empresa_id = c.empresa_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE c.user_id IS NULL
  AND p.id IS NOT NULL
  AND c.ativo = true
ORDER BY c.created_at DESC;

-- =====================================================
-- Step 4 (OPTIONAL): Link colaboradores to users by name match
-- =====================================================

-- CAUTION: Only run this if you're confident the name matching is accurate
-- This links colaboradores to users based on matching names

-- UPDATE public.colaboradores c
-- SET user_id = p.user_id
-- FROM public.profiles p
-- WHERE c.user_id IS NULL
--   AND p.empresa_id = c.empresa_id
--   AND LOWER(TRIM(p.nome)) = LOWER(TRIM(c.nome))
--   AND c.ativo = true;

-- =====================================================
-- Verification
-- =====================================================

-- Check that all users now have profiles
SELECT 
  COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL;

-- Should return 0 if successful

SELECT 
  'Profiles backfilled successfully!' as message,
  COUNT(p.id) as total_profiles
FROM public.profiles p;
