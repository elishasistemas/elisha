-- Migration: Copy DEV RLS configuration to PROD (EXACT MATCH)
-- Date: 2025-11-26
-- Description: Apply the same permissive policies that are working in DEV

-- ============================================
-- STEP 1: DISABLE RLS TEMPORARILY
-- ============================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop profiles policies
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
        RAISE NOTICE 'Dropped profiles policy: %', r.policyname;
    END LOOP;
END $$;

-- Drop empresas policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'empresas'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresas', r.policyname);
        RAISE NOTICE 'Dropped empresas policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- STEP 3: ENABLE RLS
-- ============================================

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE PERMISSIVE POLICIES (SAME AS DEV)
-- ============================================

-- EMPRESAS: Políticas permissivas (todos podem tudo - igual DEV)
CREATE POLICY empresas_select_all ON public.empresas 
FOR SELECT 
USING (true);

CREATE POLICY empresas_insert_all ON public.empresas 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY empresas_update_all ON public.empresas 
FOR UPDATE 
USING (true);

CREATE POLICY empresas_delete_all ON public.empresas 
FOR DELETE 
USING (true);

-- PROFILES: Políticas permissivas (todos podem tudo - igual DEV)
CREATE POLICY profiles_select_all ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY profiles_insert_all ON public.profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY profiles_update_all ON public.profiles 
FOR UPDATE 
USING (true);

CREATE POLICY profiles_delete_all ON public.profiles 
FOR DELETE 
USING (true);

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  empresas_count int;
  profiles_count int;
BEGIN
  SELECT COUNT(*) INTO empresas_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'empresas';
  
  SELECT COUNT(*) INTO profiles_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'profiles';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'RLS configurado exatamente como DEV';
  RAISE NOTICE 'Empresas policies: %', empresas_count;
  RAISE NOTICE 'Profiles policies: %', profiles_count;
  RAISE NOTICE '========================================';
END $$;

-- Lista todas as policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('empresas', 'profiles')
ORDER BY tablename, policyname;
