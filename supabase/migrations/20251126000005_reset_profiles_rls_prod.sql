-- Migration: Reset PROD profiles RLS to match DEV
-- Date: 2025-11-26
-- Description: Remove ALL existing policies and recreate from scratch (safe approach)

-- ============================================
-- STEP 1: DISABLE RLS TEMPORARILY (SAFE)
-- ============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop todas as policies possíveis (ignora erros se não existir)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: DROP OLD HELPER FUNCTIONS (SE EXISTIREM)
-- ============================================

DROP FUNCTION IF EXISTS public.current_user_empresa_id();
DROP FUNCTION IF EXISTS public.current_user_is_admin();

-- ============================================
-- STEP 4: CREATE NEW HELPER FUNCTIONS
-- ============================================

-- Retorna empresa_id do usuário logado (STABLE = cacheable)
CREATE OR REPLACE FUNCTION public.get_current_user_empresa_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  SELECT empresa_id INTO v_empresa_id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN v_empresa_id;
END;
$$;

-- Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
      AND (
        is_elisha_admin = true
        OR active_role = 'admin'
        OR role = 'admin'
        OR 'admin' = ANY(roles)
      )
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- ============================================
-- STEP 5: DROP SPECIFIC PROBLEMATIC POLICIES
-- ============================================

DROP POLICY IF EXISTS profiles_select_same_empresa ON public.profiles;
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_service_role ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_policy ON public.profiles;

-- ============================================
-- STEP 6: CREATE SIMPLE POLICIES (NO RECURSION)
-- ============================================

-- 1. SELECT: Ver próprio perfil + mesma empresa + super admin vê todos
CREATE POLICY profiles_select_policy ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Próprio perfil
  user_id = auth.uid()
  OR
  -- Mesma empresa (usa função helper)
  empresa_id = public.get_current_user_empresa_id()
  OR
  -- Super admin vê todos (query direta sem recursão)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_elisha_admin = true
  )
);

-- 2. INSERT: Apenas service_role (via trigger ou accept_invite)
CREATE POLICY profiles_insert_policy ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Permitir insert via service_role (API routes)
CREATE POLICY profiles_insert_service_role ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. UPDATE: Próprio perfil OU admin da mesma empresa
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

CREATE POLICY profiles_update_admin ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_current_user_admin()
  AND (
    empresa_id = public.get_current_user_empresa_id()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_elisha_admin = true
    )
  )
)
WITH CHECK (
  public.is_current_user_admin()
  AND (
    empresa_id = public.get_current_user_empresa_id()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_elisha_admin = true
    )
  )
);

-- 4. DELETE: Apenas admin (mesma empresa ou super admin)
CREATE POLICY profiles_delete_policy ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.is_current_user_admin()
  AND (
    empresa_id = public.get_current_user_empresa_id()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_elisha_admin = true
    )
  )
);

-- ============================================
-- STEP 6: RE-ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'RLS re-enabled para profiles';
  RAISE NOTICE 'Total de policies criadas: %', policy_count;
  RAISE NOTICE 'Funções helper: get_current_user_empresa_id(), is_current_user_admin()';
  RAISE NOTICE '========================================';
END $$;

-- Lista todas as policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;
