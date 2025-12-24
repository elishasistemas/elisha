-- =====================================================
-- Migration: Add is_active to Profiles and Sync with Colaboradores
-- Data: 2025-12-24
-- Descrição: Adiciona coluna is_active na tabela profiles e mantém sincronismo
--            com a tabela colaboradores.
-- =====================================================

-- 1. Adicionar is_active em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Atualizar perfis existentes para true
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- 3. Função para sincronizar is_active do profile para o colaborador
CREATE OR REPLACE FUNCTION sync_profile_active_to_colaborador()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.role = 'tecnico' THEN
    UPDATE public.colaboradores 
    SET ativo = NEW.is_active 
    WHERE id = (SELECT tecnico_id FROM public.profiles WHERE id = NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para sincronismo
DROP TRIGGER IF EXISTS tr_sync_profile_active ON public.profiles;
CREATE TRIGGER tr_sync_profile_active
AFTER UPDATE OF is_active ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_active_to_colaborador();

-- 5. Comentários
COMMENT ON COLUMN public.profiles.is_active IS 'Indica se o usuário está ativo no sistema e pode logar';
