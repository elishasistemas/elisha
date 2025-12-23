-- =====================================================
-- Diagnostic Script: Profile Issues in Production
-- =====================================================

-- 1. Check if the currently logged-in user in Supabase SQL editor has a profile
-- Run this in the Supabase SQL Editor as the user (if possible) or as admin
SELECT 
    auth.uid() as current_auth_uid,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email,
    p.*
FROM public.profiles p
WHERE p.user_id = auth.uid();

-- 2. List ALL users without profiles (Global Check)
SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'nome' as meta_nome,
    u.raw_user_meta_data->>'role' as meta_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.id IS NULL;

-- 3. Check for specific user by email (Replace with the email of the complaining user)
-- Substitua 'usuario@email.com' pelo email do usuário que está com erro
DO $$
DECLARE
    target_email text := 'usuario@email.com'; -- <--- TROQUE O EMAIL AQUI
    target_uid uuid;
    profile_exists boolean;
BEGIN
    SELECT id INTO target_uid FROM auth.users WHERE email = target_email;
    
    IF target_uid IS NULL THEN
        RAISE NOTICE 'Usuário com email % não encontrado na tabela auth.users', target_email;
    ELSE
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = target_uid) INTO profile_exists;
        
        IF profile_exists THEN
            RAISE NOTICE 'Usuário % (UID: %) POSSUI um perfil na tabela profiles.', target_email, target_uid;
        ELSE
            RAISE NOTICE 'Usuário % (UID: %) NÃO POSSUI um perfil na tabela profiles. (CAUSA DO ERRO)', target_email, target_uid;
        END IF;
    END IF;
END $$;

-- 4. EMERGENCY FIX: Create profile for a specific user
-- Use this ONLY if you want to fix one specific user immediately.
-- Substitua os valores abaixo:
/*
INSERT INTO public.profiles (user_id, email, nome, role, active_role, empresa_id)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'nome', email),
    COALESCE(raw_user_meta_data->>'role', 'tecnico'),
    COALESCE(raw_user_meta_data->>'role', 'tecnico'),
    (raw_user_meta_data->>'empresa_id')::uuid
FROM auth.users
WHERE email = 'usuario@email.com';
*/
