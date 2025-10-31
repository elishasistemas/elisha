-- Migration: Remover role "gestor" do sistema
-- Data: 2025-10-22
-- Descrição: Simplificação - Deixar apenas elisha_admin, admin e tecnico

-- ========================================
-- 1. ATUALIZAR USUÁRIOS GESTOR → ADMIN
-- ========================================

-- Converter todos os gestores para admin
UPDATE public.profiles
SET 
  role = 'admin',
  active_role = CASE 
    WHEN active_role = 'gestor' THEN 'admin'
    ELSE active_role
  END
WHERE role = 'gestor';

-- Atualizar array roles (remover gestor, adicionar admin se necessário)
UPDATE public.profiles
SET roles = array_remove(roles, 'gestor')
WHERE 'gestor' = ANY(roles);

UPDATE public.profiles
SET roles = array_append(roles, 'admin')
WHERE role = 'admin' AND NOT ('admin' = ANY(roles));

-- ========================================
-- 2. ATUALIZAR CONSTRAINTS
-- ========================================

-- Remover constraint antiga do role
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Adicionar constraint nova (sem gestor)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'tecnico', 'elisha_admin'));

-- Remover constraint antiga do active_role
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_active_role_check;

-- Adicionar constraint nova (sem gestor)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_role_check
CHECK (active_role IN ('admin', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- ========================================
-- 3. ATUALIZAR FUNÇÃO create_invite
-- ========================================

CREATE OR REPLACE FUNCTION public.create_invite(
  p_empresa_id uuid,
  p_email text,
  p_role text,
  p_expires_days int default 7
)
RETURNS public.invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.invites;
  v_is_admin boolean;
BEGIN
  -- Validar role (apenas admin e tecnico)
  IF p_role NOT IN ('admin', 'tecnico') THEN
    RAISE EXCEPTION 'Invalid role: must be admin or tecnico';
  END IF;

  -- Checa admin da empresa (active_role OU roles array OU is_elisha_admin)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = (SELECT auth.uid())
      AND (
        -- Super admin pode criar convites para qualquer empresa
        pr.is_elisha_admin = true
        OR
        -- Admin da empresa pode criar convites
        (
          pr.empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR pr.role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
        OR
        -- Super admin impersonando pode criar convites
        (
          pr.is_elisha_admin = true
          AND pr.impersonating_empresa_id = p_empresa_id
          AND (
            pr.active_role = 'admin'
            OR 'admin' = ANY(pr.roles)
          )
        )
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not allowed: only admin can create invites for this empresa';
  END IF;

  -- Cria convite
  INSERT INTO public.invites (empresa_id, email, role, token, expires_at, status, created_at)
  VALUES (
    p_empresa_id,
    lower(p_email),
    p_role,
    gen_random_uuid(),
    now() + (p_expires_days || ' days')::interval,
    'pending',
    now()
  )
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$;

-- ========================================
-- 4. ATUALIZAR COMENTÁRIOS
-- ========================================

COMMENT ON COLUMN public.profiles.role IS 'Papel do usuário: admin, tecnico ou elisha_admin';
COMMENT ON COLUMN public.profiles.active_role IS 'Papel ativo do usuário: admin, tecnico ou elisha_admin';

-- ========================================
-- 5. ATUALIZAR INVITES CONSTRAINT
-- ========================================

ALTER TABLE public.invites
DROP CONSTRAINT IF EXISTS invites_role_check;

ALTER TABLE public.invites
ADD CONSTRAINT invites_role_check
CHECK (role IN ('admin', 'tecnico'));

-- ========================================
-- 6. VERIFICAÇÃO
-- ========================================

-- Verificar se ainda existem gestores
SELECT 
  COUNT(*) as total_gestores,
  COUNT(CASE WHEN role = 'gestor' THEN 1 END) as role_gestor,
  COUNT(CASE WHEN active_role = 'gestor' THEN 1 END) as active_role_gestor,
  COUNT(CASE WHEN 'gestor' = ANY(roles) THEN 1 END) as array_roles_gestor
FROM public.profiles;

-- Mostrar constraints atualizadas
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%role%'
ORDER BY conname;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

/*
VERIFICAÇÃO:
  total_gestores: X
  role_gestor: 0 ✅
  active_role_gestor: 0 ✅
  array_roles_gestor: 0 ✅

CONSTRAINTS:
  profiles_role_check: CHECK (role IN ('admin', 'tecnico', 'elisha_admin'))
  profiles_active_role_check: CHECK (active_role IN ('admin', 'tecnico', 'elisha_admin') OR active_role IS NULL)
  invites_role_check: CHECK (role IN ('admin', 'tecnico'))
*/

