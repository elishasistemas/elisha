-- Migration: Adicionar coluna user_id à tabela profiles
-- Data: 2025-10-22
-- Descrição: A tabela profiles atualmente usa 'id' como FK para auth.users
--            Esta migration adiciona 'user_id' como coluna explícita e popula com dados do 'id'

-- Passo 1: Adicionar coluna user_id (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- Adicionar coluna user_id como cópia do id
    ALTER TABLE public.profiles 
    ADD COLUMN user_id uuid;
    
    -- Popular user_id com o valor do id
    UPDATE public.profiles 
    SET user_id = id;
    
    -- Tornar coluna NOT NULL
    ALTER TABLE public.profiles 
    ALTER COLUMN user_id SET NOT NULL;
    
    -- Adicionar constraint UNIQUE
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    
    -- Adicionar FK para auth.users
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    -- Criar índice
    CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);
    
    RAISE NOTICE 'Coluna user_id adicionada e populada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna user_id já existe. Nada a fazer.';
  END IF;
END $$;

-- Passo 2: Atualizar comentários
COMMENT ON COLUMN public.profiles.id IS 'Chave primária do registro (pode ser diferente de user_id em casos especiais)';
COMMENT ON COLUMN public.profiles.user_id IS 'FK para auth.users - ID do usuário no sistema de autenticação';

-- Passo 3: Verificar consistência dos dados
DO $$
DECLARE
  v_count_inconsistent integer;
BEGIN
  -- Verificar se há registros onde id != user_id
  SELECT COUNT(*) INTO v_count_inconsistent
  FROM public.profiles
  WHERE id != user_id;
  
  IF v_count_inconsistent > 0 THEN
    RAISE WARNING 'Atenção: % registros com id != user_id encontrados', v_count_inconsistent;
  ELSE
    RAISE NOTICE 'Todos os registros estão consistentes (id = user_id)';
  END IF;
END $$;

