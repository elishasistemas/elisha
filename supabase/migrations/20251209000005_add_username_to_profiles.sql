-- Migration: Add username column to profiles
-- Date: 2025-12-09
-- Description: Adiciona coluna username (unique) para permitir login com username além de email

-- 1. Adicionar coluna username
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- 2. Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. Adicionar constraint para garantir username lowercase e sem espaços
ALTER TABLE public.profiles
ADD CONSTRAINT username_format CHECK (username = lower(username) AND username !~ '\s');

-- 4. Comentários
COMMENT ON COLUMN public.profiles.username IS 'Nome de usuário único para login (alternativa ao email)';

-- 5. Atualizar profiles existentes que não têm username
-- Gerar username baseado no email (parte antes do @) do auth.users
UPDATE public.profiles p
SET username = split_part(u.email, '@', 1)
FROM auth.users u
WHERE p.user_id = u.id 
  AND p.username IS NULL 
  AND u.email IS NOT NULL;

-- 6. Resolver duplicatas de username (adicionar sufixo numérico)
DO $$
DECLARE
  duplicate_username text;
  counter int;
  rec RECORD;
BEGIN
  FOR duplicate_username IN 
    SELECT username 
    FROM public.profiles 
    WHERE username IS NOT NULL 
    GROUP BY username 
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    
    FOR rec IN 
      SELECT id 
      FROM public.profiles 
      WHERE username = duplicate_username 
      ORDER BY created_at 
      OFFSET 1 -- Manter o primeiro registro sem alteração
    LOOP
      UPDATE public.profiles 
      SET username = duplicate_username || counter 
      WHERE id = rec.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- 7. Tornar username obrigatório para novos registros (nullable para permitir migração gradual)
-- ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
-- ^ Comentado: descomentar após garantir que todos os profiles têm username
