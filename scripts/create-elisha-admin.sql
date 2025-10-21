-- Script para criar o primeiro admin Elisha
-- Execute este script via Supabase MCP ou SQL Editor

-- 1. Criar o usuário no Auth (faça via Dashboard ou API)
-- Email: iverson.ux@gmail.com
-- Password: (será enviado por email ao aceitar invite)

-- 2. Após criar o usuário, atualizar o profile
-- Substitua 'USER_ID_AQUI' pelo ID do usuário criado

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'iverson.ux@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário não encontrado. Crie primeiro via Supabase Auth.';
  ELSE
    -- Criar ou atualizar profile
    INSERT INTO public.profiles (
      id,
      nome,
      roles,
      active_role,
      is_elisha_admin,
      empresa_id
    ) VALUES (
      v_user_id,
      'Iverson Dantas (Elisha Admin)',
      ARRAY['elisha_admin']::text[],
      'elisha_admin',
      true,
      NULL  -- Elisha admins não têm empresa_id fixo
    )
    ON CONFLICT (id) DO UPDATE SET
      roles = ARRAY['elisha_admin']::text[],
      active_role = 'elisha_admin',
      is_elisha_admin = true,
      empresa_id = NULL;

    RAISE NOTICE 'Profile criado/atualizado para usuário %', v_user_id;
  END IF;
END$$;

-- 3. Verificar
SELECT 
  u.id,
  u.email,
  p.nome,
  p.roles,
  p.active_role,
  p.is_elisha_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'iverson.ux@gmail.com';

