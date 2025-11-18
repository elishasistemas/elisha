-- Migration: Adicionar colunas faltantes na tabela profiles
-- Data: 2025-10-30
-- Descrição: Adicionar is_elisha_admin, impersonating_empresa_id, roles, active_role, tecnico_id

-- ========================================
-- ADICIONAR COLUNAS FALTANTES
-- ========================================

-- Coluna para identificar super admins da Elisha
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_elisha_admin boolean NOT NULL DEFAULT false;

-- Coluna para impersonation (admin da Elisha pode assumir identidade de empresa)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS impersonating_empresa_id uuid REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Colunas para sistema de múltiplos papéis
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_role text CHECK (active_role IN ('admin', 'gestor', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- Coluna para vincular profile ao colaborador (se for técnico)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tecnico_id uuid;

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN public.profiles.is_elisha_admin IS 'Indica se o usuário é super admin da Elisha';
COMMENT ON COLUMN public.profiles.impersonating_empresa_id IS 'Empresa que o super admin está impersonando (assume identidade)';
COMMENT ON COLUMN public.profiles.roles IS 'Array com todos os papéis do usuário';
COMMENT ON COLUMN public.profiles.active_role IS 'Papel ativo do usuário: admin, gestor, tecnico, ou elisha_admin';
COMMENT ON COLUMN public.profiles.tecnico_id IS 'Referência ao colaborador (se for técnico)';

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS profiles_is_elisha_admin_idx ON public.profiles(is_elisha_admin) WHERE is_elisha_admin = true;
CREATE INDEX IF NOT EXISTS profiles_impersonating_empresa_id_idx ON public.profiles(impersonating_empresa_id) WHERE impersonating_empresa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_active_role_idx ON public.profiles(active_role);
CREATE INDEX IF NOT EXISTS profiles_tecnico_id_idx ON public.profiles(tecnico_id);

-- ========================================
-- FIM DA MIGRATION
-- ========================================

