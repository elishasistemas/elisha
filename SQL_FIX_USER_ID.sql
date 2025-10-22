-- ========================================
-- FIX CRÍTICO: Adicionar coluna user_id
-- Execute no Supabase SQL Editor
-- ========================================

-- 1. Verificar se coluna já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '❌ Coluna user_id NÃO existe. Criando...';
    
    -- 2. Adicionar coluna user_id
    ALTER TABLE public.profiles 
    ADD COLUMN user_id uuid;
    
    -- 3. Popular user_id com o valor do id
    UPDATE public.profiles 
    SET user_id = id
    WHERE user_id IS NULL;
    
    -- 4. Tornar coluna NOT NULL
    ALTER TABLE public.profiles 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- 5. Adicionar constraint UNIQUE
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    
    -- 6. Adicionar FK para auth.users
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    -- 7. Criar índice
    CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
    
    RAISE NOTICE '✅ Coluna user_id criada com sucesso!';
  ELSE
    RAISE NOTICE '✅ Coluna user_id já existe!';
  END IF;
END $$;

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Mostrar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'user_id', 'empresa_id', 'role')
ORDER BY ordinal_position;

-- Mostrar dados (primeiros 5 registros)
SELECT 
  id,
  user_id,
  empresa_id,
  role,
  nome,
  created_at,
  CASE 
    WHEN id = user_id THEN '✅ OK'
    ELSE '⚠️ Diferente'
  END as status_relacao
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- Estatísticas
SELECT 
  COUNT(*) as total_profiles,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as user_id_null
FROM public.profiles;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

/*
NOTICES:
  ✅ Coluna user_id criada com sucesso!

STRUCTURE:
  id          | uuid    | NO  | gen_random_uuid()
  user_id     | uuid    | NO  | null
  empresa_id  | uuid    | YES | null
  role        | text    | NO  | 'tecnico'

DATA (primeiros 5):
  id          | user_id     | empresa_id  | role    | status_relacao
  uuid-1      | uuid-1      | empresa-1   | admin   | ✅ OK
  uuid-2      | uuid-2      | empresa-1   | tecnico | ✅ OK
  ...

STATS:
  total_profiles: 10
  usuarios_unicos: 10
  user_id_null: 0
*/

