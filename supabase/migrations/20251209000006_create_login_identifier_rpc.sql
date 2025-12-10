-- Migration: Create RPC for username/email login lookup
-- Date: 2025-12-09
-- Description: Função para buscar email a partir de username ou email (para login flexível)

CREATE OR REPLACE FUNCTION public.get_email_from_identifier(identifier text)
RETURNS text AS $$
DECLARE
  result_email text;
BEGIN
  -- Se o identifier contém @, assume que é email
  IF identifier LIKE '%@%' THEN
    RETURN identifier;
  END IF;
  
  -- Caso contrário, busca o email pelo username
  SELECT email INTO result_email
  FROM public.profiles
  WHERE username = LOWER(identifier)
  LIMIT 1;
  
  -- Se não encontrar, retorna o identifier original (deixa Supabase Auth validar)
  RETURN COALESCE(result_email, identifier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_email_from_identifier(text) IS 'Converte username para email para login. Se já for email, retorna o próprio valor.';
