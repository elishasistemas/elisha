-- Migration: Add supervisor role
-- Description: Adiciona o perfil 'supervisor' ao sistema com permissões intermediárias entre admin e técnico

-- 1. Atualizar constraint do campo role na tabela profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'supervisor', 'tecnico', 'elisha_admin'));

-- 2. Atualizar constraint do campo active_role na tabela profiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_active_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_role_check
CHECK (active_role IN ('admin', 'supervisor', 'tecnico', 'elisha_admin') OR active_role IS NULL);

-- 3. Atualizar constraint do campo role na tabela invites
ALTER TABLE public.invites
DROP CONSTRAINT IF EXISTS invites_role_check;

ALTER TABLE public.invites
ADD CONSTRAINT invites_role_check
CHECK (role IN ('admin', 'supervisor', 'tecnico'));

-- 4. Atualizar função create_invite para aceitar supervisor
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
  -- Validar role (admin, supervisor e tecnico)
  IF p_role NOT IN ('admin', 'supervisor', 'tecnico') THEN
    RAISE EXCEPTION 'Invalid role: must be admin, supervisor, or tecnico';
  END IF;

  -- Checa admin da empresa (active_role OU roles array OU is_elisha_admin)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.user_id = auth.uid()
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

  -- Cria convite usando user_id do profile logado
  INSERT INTO public.invites (empresa_id, email, role, token, expires_at, status, created_at, created_by)
  VALUES (
    p_empresa_id,
    lower(p_email),
    p_role,
    gen_random_uuid(),
    now() + (p_expires_days || ' days')::interval,
    'pending',
    now(),
    auth.uid()
  )
  RETURNING * INTO v_invite;

  RETURN v_invite;
END;
$$;

COMMENT ON FUNCTION public.create_invite IS 
'Cria convite para novo usuário (admin, supervisor ou tecnico). Apenas admin da empresa ou super admin podem criar convites.';

-- 5. Atualizar função de validação de role em invites (se existir)
CREATE OR REPLACE FUNCTION public.validate_invite_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role NOT IN ('admin', 'supervisor', 'tecnico') THEN
    RAISE EXCEPTION 'Invalid role: must be admin, supervisor, or tecnico';
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Comentários para documentação
COMMENT ON CONSTRAINT profiles_role_check ON public.profiles IS 
'Perfis permitidos: admin (acesso total), supervisor (gerencia OS e equipe), tecnico (executa OS), elisha_admin (super admin)';

COMMENT ON CONSTRAINT profiles_active_role_check ON public.profiles IS 
'Perfil ativo do usuário. Supervisor tem permissões para: acessar ordens de serviço, atender OS, criar nova ordem, acessar histórico de OS, acessar relatórios';

COMMENT ON CONSTRAINT invites_role_check ON public.invites IS 
'Roles permitidos em convites: admin, supervisor, tecnico';

-- 7. Criar helper function para verificar se é admin ou supervisor
CREATE OR REPLACE FUNCTION public.is_admin_or_supervisor()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND active_role IN ('admin', 'supervisor')
  );
$$;

COMMENT ON FUNCTION public.is_admin_or_supervisor() IS 
'Retorna true se o usuário autenticado é admin ou supervisor';

-- 8. Criar helper function para verificar se pode gerenciar OS
CREATE OR REPLACE FUNCTION public.can_manage_os()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND active_role IN ('admin', 'supervisor', 'tecnico')
  );
$$;

COMMENT ON FUNCTION public.can_manage_os() IS 
'Retorna true se o usuário pode gerenciar ordens de serviço (admin, supervisor ou técnico)';
