-- =====================================================
-- Migration: Fix profiles roles and active_role
-- Data: 2025-10-24
-- Descrição: Garantir que roles e active_role sejam
--            sempre preenchidos corretamente
-- =====================================================

-- 1. Corrigir todos os perfis existentes que estão sem roles/active_role
UPDATE public.profiles
SET 
  roles = ARRAY[role]::text[],
  active_role = role
WHERE is_elisha_admin = false
  AND role IN ('admin', 'tecnico')
  AND (roles IS NULL OR roles = '{}' OR active_role IS NULL);

-- 2. Criar função para garantir que roles e active_role sejam definidos
CREATE OR REPLACE FUNCTION public.ensure_roles_and_active_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um usuário normal (não elisha_admin)
  IF NEW.is_elisha_admin = false THEN
    -- Se roles está vazio ou null, preencher com o role
    IF NEW.roles IS NULL OR array_length(NEW.roles, 1) IS NULL THEN
      NEW.roles := ARRAY[NEW.role]::text[];
    END IF;
    
    -- Se active_role está null, preencher com o role
    IF NEW.active_role IS NULL THEN
      NEW.active_role := NEW.role;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger para INSERT
DROP TRIGGER IF EXISTS ensure_roles_and_active_role_on_insert ON public.profiles;
CREATE TRIGGER ensure_roles_and_active_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_roles_and_active_role();

-- 4. Criar trigger para UPDATE
DROP TRIGGER IF EXISTS ensure_roles_and_active_role_on_update ON public.profiles;
CREATE TRIGGER ensure_roles_and_active_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.roles IS DISTINCT FROM NEW.roles OR
    OLD.active_role IS DISTINCT FROM NEW.active_role
  )
  EXECUTE FUNCTION public.ensure_roles_and_active_role();

-- 5. Recriar view ordens_servico_enriquecida (caso não exista)
CREATE OR REPLACE VIEW public.ordens_servico_enriquecida AS
SELECT
  os.*,
  CASE os.status
    WHEN 'parado' THEN 0
    WHEN 'novo' THEN 1
    WHEN 'em_andamento' THEN 2
    WHEN 'aguardando_assinatura' THEN 3
    WHEN 'concluido' THEN 4
    WHEN 'cancelado' THEN 5
    ELSE 6
  END AS peso_status,
  CASE os.prioridade
    WHEN 'alta' THEN 1
    WHEN 'media' THEN 2
    WHEN 'baixa' THEN 3
    ELSE 4
  END AS peso_prioridade
FROM public.ordens_servico os;

-- ==========================================
-- COMENTÁRIO FINAL
-- ==========================================
COMMENT ON FUNCTION public.ensure_roles_and_active_role() IS 'Garante que roles e active_role sejam sempre preenchidos corretamente para usuários normais';

