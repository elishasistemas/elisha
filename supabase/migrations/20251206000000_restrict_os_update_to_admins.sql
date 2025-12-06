-- Migration: Restringir INSERT/UPDATE/DELETE de ordens_servico apenas para admins
-- Data: 2025-12-06
-- Descrição: Técnicos não podem criar/editar/deletar OSs diretamente
-- Técnicos usam apenas RPCs: os_accept, os_decline, os_checkin, os_checkout
-- Apenas admins podem fazer INSERT/UPDATE/DELETE direto na tabela ordens_servico

-- Remover TODAS as políticas existentes (incluindo as novas)
DROP POLICY IF EXISTS ordens_servico_select_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_insert_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_update_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_delete_all ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins and tecnicos can update OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Users can update ordens_servico from same empresa" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins can insert OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins can delete OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Users can view OS from same empresa" ON public.ordens_servico;
DROP POLICY IF EXISTS "Only admins can insert OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Only admins can update OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Only admins can delete OS" ON public.ordens_servico;

-- Política SELECT: Todos os usuários autenticados da mesma empresa podem VER as OSs
CREATE POLICY "Users can view OS from same empresa" ON public.ordens_servico FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT impersonating_empresa_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
    AND impersonating_empresa_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
  )
);

-- Política INSERT: Apenas admins podem CRIAR OSs
CREATE POLICY "Only admins can insert OS" ON public.ordens_servico FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND active_role = 'admin'
  )
  OR
  empresa_id IN (
    SELECT impersonating_empresa_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
    AND impersonating_empresa_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
  )
);

-- Criar política restritiva: apenas admins podem fazer UPDATE
CREATE POLICY "Only admins can update OS" ON public.ordens_servico FOR UPDATE
TO authenticated
USING (
  -- Permitir UPDATE apenas se o usuário for admin da mesma empresa
  empresa_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND active_role = 'admin'
  )
  OR
  -- OU se for elisha_admin (super admin) fazendo impersonation
  empresa_id IN (
    SELECT impersonating_empresa_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
    AND impersonating_empresa_id IS NOT NULL
  )
  OR
  -- OU se for elisha_admin sem impersonation (acesso total)
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
  )
)
WITH CHECK (
  -- Mesma validação para o WITH CHECK
  empresa_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND active_role = 'admin'
  )
  OR
  empresa_id IN (
    SELECT impersonating_empresa_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
    AND impersonating_empresa_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
  )
);

-- Política DELETE: Apenas admins podem DELETAR OSs
CREATE POLICY "Only admins can delete OS" ON public.ordens_servico FOR DELETE
TO authenticated
USING (
  empresa_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND active_role = 'admin'
  )
  OR
  empresa_id IN (
    SELECT impersonating_empresa_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
    AND impersonating_empresa_id IS NOT NULL
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_elisha_admin = true
  )
);

-- Comentários explicativos
COMMENT ON POLICY "Users can view OS from same empresa" ON public.ordens_servico IS 
'Todos os usuários da empresa podem visualizar OSs (técnicos, supervisores e admins).';

COMMENT ON POLICY "Only admins can insert OS" ON public.ordens_servico IS 
'Apenas admins podem criar novas OSs.';

COMMENT ON POLICY "Only admins can update OS" ON public.ordens_servico IS 
'Apenas admins podem editar OSs diretamente. Técnicos usam RPCs (os_accept, os_decline, os_checkin, os_checkout) para mudanças de status.';

COMMENT ON POLICY "Only admins can delete OS" ON public.ordens_servico IS 
'Apenas admins podem deletar OSs.';
