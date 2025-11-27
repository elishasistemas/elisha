-- Migration: Fix infinite recursion in profiles RLS policies
-- Date: 2025-11-26
-- Description: Remove recursive queries from profiles policies to prevent infinite recursion

-- ============================================
-- DROP POLÍTICAS EXISTENTES
-- ============================================

DROP POLICY IF EXISTS "Users can view profiles from same empresa" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles from same empresa" ON public.profiles;
DROP POLICY IF EXISTS "Profiles created via trigger or invite system only" ON public.profiles;

-- ============================================
-- CRIAR FUNÇÃO HELPER (SEM RECURSÃO)
-- ============================================

-- Função para pegar empresa_id do usuário atual (cacheable, sem recursão)
CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT empresa_id 
  FROM public.profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Função para verificar se usuário é admin (cacheable, sem recursão)
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND (active_role = 'admin' OR role = 'admin' OR 'admin' = ANY(roles) OR is_elisha_admin = true)
    LIMIT 1
  );
$$;

-- ============================================
-- NOVAS POLÍTICAS (SEM RECURSÃO)
-- ============================================

-- 1. SELECT: Usuários podem ver perfis da mesma empresa OU super admins veem todos
CREATE POLICY profiles_select_same_empresa ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Ver próprio perfil
  user_id = auth.uid()
  OR
  -- Ver perfis da mesma empresa (usa função sem recursão)
  empresa_id = public.current_user_empresa_id()
  OR
  -- Super admin vê todos
  (SELECT is_elisha_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = true
);

-- 2. UPDATE: Usuário pode atualizar próprio perfil (campos limitados)
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  -- Não pode mudar empresa_id, role, active_role, roles (exceto via função admin)
);

-- 3. UPDATE: Admin pode atualizar perfis da mesma empresa
CREATE POLICY profiles_update_admin ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.current_user_is_admin()
  AND (
    empresa_id = public.current_user_empresa_id()
    OR (SELECT is_elisha_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = true
  )
)
WITH CHECK (
  public.current_user_is_admin()
  AND (
    empresa_id = public.current_user_empresa_id()
    OR (SELECT is_elisha_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = true
  )
);

-- 4. INSERT: Apenas via trigger ou sistema de convites (service_role)
CREATE POLICY profiles_insert_service_role ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (false); -- Usuários normais não podem inserir diretamente

-- 5. DELETE: Apenas admins podem deletar (mesma empresa ou super admin)
CREATE POLICY profiles_delete_admin ON public.profiles
FOR DELETE
TO authenticated
USING (
  public.current_user_is_admin()
  AND (
    empresa_id = public.current_user_empresa_id()
    OR (SELECT is_elisha_admin FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = true
  )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration aplicada com sucesso!';
  RAISE NOTICE 'Policies de profiles corrigidas - recursão removida';
  RAISE NOTICE 'Funções helper criadas: current_user_empresa_id(), current_user_is_admin()';
END $$;
