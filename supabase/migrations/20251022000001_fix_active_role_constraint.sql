-- Fix active_role constraint to allow admin and elisha_admin
-- Migration: 2025-10-22-fix-active-role-constraint.sql

-- 1. Drop existing constraint
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_active_role_check;

-- 2. Add new constraint with all valid roles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_role_check 
  CHECK (active_role IN ('admin', 'gestor', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- 3. Update comment
COMMENT ON COLUMN public.profiles.active_role IS 'Papel ativo do usuário: admin, gestor, tecnico, ou elisha_admin';

