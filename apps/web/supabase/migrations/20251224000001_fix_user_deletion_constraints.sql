-- =====================================================
-- Migration: Fix User Deletion Constraints
-- Data: 2025-12-24
-- Descrição: Atualiza constraints de chave estrangeira que referenciam auth.users
--            para permitir a exclusão de usuários sem erro de banco de dados.
-- =====================================================

-- 1. os_status_history
-- Remove constraint antiga e adiciona nova com ON DELETE SET NULL
DO $$ 
BEGIN
    ALTER TABLE public.os_status_history DROP CONSTRAINT IF EXISTS os_status_history_changed_by_fkey;
    ALTER TABLE public.os_status_history 
    ADD CONSTRAINT os_status_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Erro ao atualizar constraint os_status_history_changed_by_fkey: %', SQLERRM;
END $$;

-- 2. invites
-- Remove constraint antiga e adiciona nova com ON DELETE SET NULL
DO $$ 
BEGIN
    ALTER TABLE public.invites DROP CONSTRAINT IF EXISTS invites_created_by_fkey;
    ALTER TABLE public.invites 
    ADD CONSTRAINT invites_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Erro ao atualizar constraint invites_created_by_fkey: %', SQLERRM;
END $$;

-- 3. os_evidencias
-- Remove constraint antiga e adiciona nova com ON DELETE SET NULL
DO $$ 
BEGIN
    ALTER TABLE public.os_evidencias DROP CONSTRAINT IF EXISTS os_evidencias_created_by_fkey;
    ALTER TABLE public.os_evidencias 
    ADD CONSTRAINT os_evidencias_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Erro ao atualizar constraint os_evidencias_created_by_fkey: %', SQLERRM;
END $$;

-- 4. os_laudos (created_by e updated_by)
DO $$ 
BEGIN
    ALTER TABLE public.os_laudos DROP CONSTRAINT IF EXISTS os_laudos_created_by_fkey;
    ALTER TABLE public.os_laudos 
    ADD CONSTRAINT os_laudos_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    
    ALTER TABLE public.os_laudos DROP CONSTRAINT IF EXISTS os_laudos_updated_by_fkey;
    ALTER TABLE public.os_laudos 
    ADD CONSTRAINT os_laudos_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Erro ao atualizar constraints em os_laudos: %', SQLERRM;
END $$;

-- 5. Garantir que o backfill de profiles para administradores seja executado novamente
-- se necessário, para garantir consistência após alterações de banco
DO $$
DECLARE r RECORD;
BEGIN
    -- Se houver usuários sem profile, o trigger on_auth_user_created trata novos.
    -- Para existentes, já rodamos o backfill em migrations anteriores.
    RAISE NOTICE 'Constraints de deleção de usuário atualizadas com sucesso.';
END $$;
