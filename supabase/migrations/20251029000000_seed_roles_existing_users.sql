-- Script para popular roles em usuários existentes
-- Execute este script APÓS aplicar a migração de roles

-- ==================================================
-- 1. CONFIGURAR ADMINISTRADORES E GESTORES
-- ==================================================

-- Adicionar role 'gestor' para todos os admins
UPDATE public.profiles
SET 
  roles = ARRAY['gestor']::text[],
  active_role = 'gestor'
WHERE 
  (role = 'admin' OR funcao = 'admin' OR role = 'gestor' OR funcao = 'gestor')
  AND roles = '{}'; -- Só atualiza se ainda não foi configurado

-- ==================================================
-- 2. CONFIGURAR TÉCNICOS
-- ==================================================

-- OPÇÃO A: Se profiles.nome corresponde a colaboradores.nome
UPDATE public.profiles p
SET 
  roles = ARRAY['tecnico']::text[],
  active_role = 'tecnico',
  tecnico_id = c.id
FROM public.colaboradores c
WHERE 
  (p.role = 'tecnico' OR p.funcao = 'tecnico')
  AND LOWER(TRIM(p.nome)) = LOWER(TRIM(c.nome))
  AND c.empresa_id = p.empresa_id
  AND p.roles = '{}'; -- Só atualiza se ainda não foi configurado

-- OPÇÃO B: Se houver uma coluna colaborador_id em profiles
-- Descomente se aplicável:
/*
UPDATE public.profiles p
SET 
  roles = ARRAY['tecnico']::text[],
  active_role = 'tecnico',
  tecnico_id = p.colaborador_id
WHERE 
  (p.role = 'tecnico' OR p.funcao = 'tecnico')
  AND p.colaborador_id IS NOT NULL
  AND p.roles = '{}';
*/

-- ==================================================
-- 3. USUÁRIOS COM MÚLTIPLOS ROLES
-- ==================================================

-- Se houver usuários que são gestores E técnicos:
-- Identifique manualmente e configure assim:
/*
UPDATE public.profiles
SET 
  roles = ARRAY['gestor', 'tecnico']::text[],
  active_role = 'gestor', -- Role padrão ao fazer login
  tecnico_id = 'uuid-do-colaborador' -- Se aplicável
WHERE id = 'uuid-do-usuario';
*/

-- ==================================================
-- 4. VERIFICAÇÃO
-- ==================================================

-- Ver todos os profiles configurados
SELECT 
  p.id,
  p.nome,
  u.email,
  e.nome as empresa,
  p.role as old_role,
  p.roles as new_roles,
  p.active_role,
  CASE 
    WHEN p.tecnico_id IS NOT NULL THEN c.nome
    ELSE NULL
  END as tecnico_nome
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
LEFT JOIN public.empresas e ON e.id = p.empresa_id
LEFT JOIN public.colaboradores c ON c.id = p.tecnico_id
ORDER BY e.nome, p.nome;

-- Ver quantos por tipo
SELECT 
  active_role,
  COUNT(*) as total,
  COUNT(CASE WHEN 'gestor' = ANY(roles) THEN 1 END) as com_role_gestor,
  COUNT(CASE WHEN 'tecnico' = ANY(roles) THEN 1 END) as com_role_tecnico,
  COUNT(CASE WHEN tecnico_id IS NOT NULL THEN 1 END) as com_tecnico_id
FROM public.profiles
GROUP BY active_role
ORDER BY active_role;

-- Ver profiles sem roles configurados (requerem atenção)
SELECT 
  p.id,
  p.nome,
  u.email,
  p.role as old_role,
  p.roles as new_roles
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE p.roles = '{}'
ORDER BY p.nome;

