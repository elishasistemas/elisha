-- Migration: Create super admin profile for first user
-- Date: 2025-11-26
-- Description: Transform existing auth user into super admin with profile

-- ============================================
-- STEP 1: VERIFICAR USUÁRIO
-- ============================================

-- Liste todos os usuários do auth (para você identificar o seu)
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at
LIMIT 10;

-- ============================================
-- STEP 2: CRIAR PROFILE PARA O PRIMEIRO USUÁRIO
-- ============================================

-- IMPORTANTE: Substitua o email abaixo pelo SEU email
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'SEU_EMAIL_AQUI@example.com'; -- <-- MUDE AQUI!
  v_empresa_id uuid;
BEGIN
  -- Buscar user_id pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado no auth.users', v_email;
  END IF;
  
  RAISE NOTICE 'Usuário encontrado: % (user_id: %)', v_email, v_user_id;
  
  -- Buscar primeira empresa (ou criar uma)
  SELECT id INTO v_empresa_id
  FROM public.empresas
  ORDER BY created_at
  LIMIT 1;
  
  IF v_empresa_id IS NULL THEN
    RAISE NOTICE 'Nenhuma empresa encontrada. Criando empresa padrão...';
    
    INSERT INTO public.empresas (nome, cnpj, ativo)
    VALUES ('Elisha Admin', '00.000.000/0001-00', true)
    RETURNING id INTO v_empresa_id;
    
    RAISE NOTICE 'Empresa criada: %', v_empresa_id;
  ELSE
    RAISE NOTICE 'Empresa existente: %', v_empresa_id;
  END IF;
  
  -- Verificar se profile já existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = v_user_id) THEN
    RAISE NOTICE 'Profile já existe. Atualizando para super admin...';
    
    -- Atualizar profile existente
    UPDATE public.profiles
    SET 
      empresa_id = v_empresa_id,
      role = 'admin',
      active_role = 'admin',
      roles = ARRAY['admin'],
      is_elisha_admin = true,
      nome = COALESCE(nome, 'Super Admin')
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Profile atualizado para super admin!';
  ELSE
    RAISE NOTICE 'Profile não existe. Criando novo profile super admin...';
    
    -- Criar profile como super admin
    INSERT INTO public.profiles (
      user_id,
      empresa_id,
      role,
      active_role,
      roles,
      is_elisha_admin,
      nome
    ) VALUES (
      v_user_id,
      v_empresa_id,
      'admin',
      'admin',
      ARRAY['admin'],
      true,
      'Super Admin'
    );
    
    RAISE NOTICE 'Profile criado como super admin!';
  END IF;
  
  -- Atualizar app_metadata do auth.users
  UPDATE auth.users
  SET 
    raw_app_meta_data = jsonb_build_object(
      'empresa_id', v_empresa_id,
      'role', 'admin',
      'active_role', 'admin',
      'roles', ARRAY['admin'],
      'is_elisha_admin', true
    ),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Auth metadata atualizado!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUCESSO! Usuário % é agora SUPER ADMIN', v_email;
  RAISE NOTICE 'user_id: %', v_user_id;
  RAISE NOTICE 'empresa_id: %', v_empresa_id;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- STEP 3: VERIFICAR RESULTADO
-- ============================================

-- Verificar profile criado (buscar por user_id via auth.users)
SELECT 
  p.id,
  p.user_id,
  au.email,
  p.nome,
  p.role,
  p.active_role,
  p.roles,
  p.is_elisha_admin,
  p.empresa_id,
  e.nome as empresa_nome
FROM public.profiles p
LEFT JOIN public.empresas e ON e.id = p.empresa_id
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE au.email = 'SEU_EMAIL_AQUI@example.com'; -- <-- MUDE AQUI TAMBÉM!
