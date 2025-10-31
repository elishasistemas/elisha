-- Script de Debug: Verificar Perfis e Usuários
-- Use este script no Supabase SQL Editor para diagnosticar problemas

-- =====================================================
-- 1. VERIFICAR PERFIS DE UMA EMPRESA
-- =====================================================
-- Substitua '<empresa-id>' pelo UUID da empresa que está impersonando

SELECT 
  p.id as profile_id,
  p.user_id,
  p.empresa_id,
  p.role,
  p.nome,
  p.created_at as profile_created,
  p.updated_at as profile_updated
FROM public.profiles p
WHERE p.empresa_id = '<empresa-id>'
ORDER BY p.created_at DESC
LIMIT 20;

-- =====================================================
-- 2. PERFIS COM EMAILS (JOIN COM AUTH.USERS)
-- =====================================================
-- Este join mostra os emails dos usuários

SELECT 
  p.id as profile_id,
  p.user_id,
  p.empresa_id,
  p.role,
  p.nome,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created,
  p.created_at as profile_created
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE p.empresa_id = '<empresa-id>'
ORDER BY p.created_at DESC
LIMIT 20;

-- =====================================================
-- 3. BUSCAR USUÁRIO POR EMAIL
-- =====================================================
-- Substitua 'email@example.com' pelo email do convite

SELECT 
  au.id as user_id,
  au.email,
  au.created_at as auth_created,
  au.email_confirmed_at,
  p.id as profile_id,
  p.empresa_id,
  p.role,
  p.nome,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE au.email = 'email@example.com'
ORDER BY au.created_at DESC;

-- =====================================================
-- 4. VERIFICAR PERFIS ÓRFÃOS (SEM AUTH.USERS)
-- =====================================================
-- Perfis que referenciam user_id inexistente

SELECT 
  p.id as profile_id,
  p.user_id,
  p.empresa_id,
  p.role,
  p.nome,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE au.id IS NULL;

-- Se encontrar perfis órfãos, pode deletá-los:
-- DELETE FROM public.profiles WHERE id IN ('<profile-id-1>', '<profile-id-2>');

-- =====================================================
-- 5. VERIFICAR CONVITES PENDENTES
-- =====================================================

SELECT 
  i.id as invite_id,
  i.email,
  i.role,
  i.status,
  i.empresa_id,
  i.created_at,
  i.expires_at,
  CASE 
    WHEN i.expires_at < NOW() THEN 'EXPIRADO'
    WHEN i.status = 'pending' THEN 'PENDENTE'
    ELSE i.status
  END as status_real
FROM public.invites i
WHERE i.empresa_id = '<empresa-id>'
ORDER BY i.created_at DESC
LIMIT 20;

-- =====================================================
-- 6. VERIFICAR CONVITES ACEITOS
-- =====================================================

SELECT 
  i.id as invite_id,
  i.email,
  i.role,
  i.status,
  i.accepted_at,
  i.accepted_by,
  au.email as accepted_user_email,
  p.nome as accepted_user_nome
FROM public.invites i
LEFT JOIN auth.users au ON au.id = i.accepted_by
LEFT JOIN public.profiles p ON p.user_id = i.accepted_by
WHERE i.empresa_id = '<empresa-id>' 
  AND i.status = 'accepted'
ORDER BY i.accepted_at DESC
LIMIT 20;

-- =====================================================
-- 7. ESTATÍSTICAS DA EMPRESA
-- =====================================================

SELECT 
  e.id,
  e.nome as empresa_nome,
  e.cnpj,
  (SELECT COUNT(*) FROM profiles WHERE empresa_id = e.id) as total_usuarios,
  (SELECT COUNT(*) FROM profiles WHERE empresa_id = e.id AND role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM profiles WHERE empresa_id = e.id AND role = 'gestor') as total_gestores,
  (SELECT COUNT(*) FROM profiles WHERE empresa_id = e.id AND role = 'tecnico') as total_tecnicos,
  (SELECT COUNT(*) FROM invites WHERE empresa_id = e.id AND status = 'pending') as convites_pendentes,
  (SELECT COUNT(*) FROM invites WHERE empresa_id = e.id AND status = 'accepted') as convites_aceitos
FROM public.empresas e
WHERE e.id = '<empresa-id>';

-- =====================================================
-- 8. TODOS OS PERFIS (PARA DEBUG GERAL)
-- =====================================================

SELECT 
  p.id as profile_id,
  p.user_id,
  p.empresa_id,
  e.nome as empresa_nome,
  p.role,
  p.nome as user_nome,
  au.email,
  p.created_at
FROM public.profiles p
LEFT JOIN public.empresas e ON e.id = p.empresa_id
LEFT JOIN auth.users au ON au.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 50;

-- =====================================================
-- 9. VERIFICAR SE USER_ID ESTÁ CORRETO
-- =====================================================
-- Para um email específico, verificar a relação entre auth e profiles

WITH user_info AS (
  SELECT id, email FROM auth.users WHERE email = 'email@example.com'
)
SELECT 
  ui.id as auth_user_id,
  ui.email,
  p.id as profile_id,
  p.user_id as profile_user_id,
  p.empresa_id,
  p.role,
  CASE 
    WHEN ui.id = p.user_id THEN '✅ CORRETO'
    ELSE '❌ INCONSISTENTE'
  END as status_relacao
FROM user_info ui
LEFT JOIN public.profiles p ON p.user_id = ui.id;

-- =====================================================
-- 10. CRIAR PERFIL MANUALMENTE (SE NECESSÁRIO)
-- =====================================================
-- Use este INSERT apenas se o perfil não foi criado automaticamente

/*
INSERT INTO public.profiles (user_id, empresa_id, role, nome, created_at)
VALUES (
  '<user-id-from-auth-users>',
  '<empresa-id>',
  'tecnico',
  'Nome do Usuário',
  NOW()
)
ON CONFLICT (user_id) DO UPDATE 
SET 
  empresa_id = EXCLUDED.empresa_id,
  role = EXCLUDED.role,
  updated_at = NOW();
*/

-- =====================================================
-- 11. ATUALIZAR PERFIL EXISTENTE
-- =====================================================
-- Se precisa corrigir empresa_id ou role de um perfil

/*
UPDATE public.profiles
SET 
  empresa_id = '<empresa-id-correto>',
  role = 'tecnico',
  updated_at = NOW()
WHERE user_id = '<user-id>';
*/

-- =====================================================
-- 12. DELETAR PERFIL E RECRIAR
-- =====================================================
-- Apenas em casos extremos

/*
-- 1. Deletar perfil
DELETE FROM public.profiles WHERE user_id = '<user-id>';

-- 2. Aceitar convite novamente (via aplicação)
-- OU inserir manualmente:
INSERT INTO public.profiles (user_id, empresa_id, role, created_at)
VALUES ('<user-id>', '<empresa-id>', 'tecnico', NOW());
*/

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
PASSO A PASSO:

1. Substitua '<empresa-id>' pelo UUID da empresa que está impersonando
   - Para descobrir o empresa_id:
     SELECT impersonating_empresa_id FROM profiles WHERE id = '<seu-user-id>';

2. Substitua 'email@example.com' pelo email do usuário que não aparece

3. Execute cada query separadamente (uma de cada vez)

4. Analise os resultados:
   - Query 1-2: Lista usuários da empresa
   - Query 3: Busca usuário específico por email
   - Query 4: Encontra perfis órfãos (problema!)
   - Query 5-6: Verifica convites
   - Query 7: Estatísticas gerais
   - Query 8: Visão geral de todos os perfis

5. Se encontrar inconsistências:
   - Perfil não existe → Aceitar convite novamente
   - Perfil órfão → Deletar e recriar
   - user_id errado → Atualizar manualmente

EXEMPLOS:

-- Encontrar empresa_id ao impersonar:
SELECT 
  id,
  impersonating_empresa_id,
  is_elisha_admin
FROM profiles 
WHERE id = (SELECT auth.uid());

-- Ver último usuário criado:
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;

-- Ver último convite aceito:
SELECT * FROM invites WHERE status = 'accepted' ORDER BY accepted_at DESC LIMIT 1;

*/

