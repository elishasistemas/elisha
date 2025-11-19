-- Script para criar superadmin Elisha: fpsjunior87@gmail.com
-- Execute este script via Supabase MCP ou SQL Editor

-- IMPORTANTE: 
-- 1. Primeiro, crie o usuário no Supabase Auth Dashboard:
--    - Vá em Authentication > Users > Add User
--    - Email: fpsjunior87@gmail.com
--    - Password: (defina uma senha temporária ou use "Send magic link")
--    - Auto Confirm User: ✅ (marcar)
--
-- 2. Depois execute este script para configurar o profile como superadmin

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fpsjunior87@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Usuário não encontrado no Auth.';
    RAISE NOTICE '📝 Por favor, crie o usuário primeiro:';
    RAISE NOTICE '   1. Vá em Authentication > Users > Add User';
    RAISE NOTICE '   2. Email: fpsjunior87@gmail.com';
    RAISE NOTICE '   3. Auto Confirm User: ✅';
    RAISE NOTICE '   4. Execute este script novamente após criar o usuário';
  ELSE
    -- Criar ou atualizar profile como superadmin
    INSERT INTO public.profiles (
      id,
      nome,
      roles,
      active_role,
      is_elisha_admin,
      empresa_id
    ) VALUES (
      v_user_id,
      'FPS Junior (Elisha Admin)',
      ARRAY['elisha_admin']::text[],
      'elisha_admin',
      true,
      NULL  -- Elisha admins não têm empresa_id fixo
    )
    ON CONFLICT (id) DO UPDATE SET
      nome = 'FPS Junior (Elisha Admin)',
      roles = ARRAY['elisha_admin']::text[],
      active_role = 'elisha_admin',
      is_elisha_admin = true,
      empresa_id = NULL;

    RAISE NOTICE '✅ Profile criado/atualizado para usuário %', v_user_id;
    RAISE NOTICE '✅ Usuário fpsjunior87@gmail.com agora é superadmin!';
  END IF;
END$$;

-- Verificar resultado
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nome,
  p.roles,
  p.active_role,
  p.is_elisha_admin,
  p.empresa_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'fpsjunior87@gmail.com';

-- Se o usuário foi criado com sucesso, você verá:
-- - email: fpsjunior87@gmail.com
-- - nome: FPS Junior (Elisha Admin)
-- - roles: {elisha_admin}
-- - active_role: elisha_admin
-- - is_elisha_admin: true
-- - empresa_id: NULL

