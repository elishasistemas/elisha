-- Migration: Add RPC function to get email from username or email identifier
-- Date: 2025-12-09
-- Description: Creates a function to resolve username to email for login

CREATE OR REPLACE FUNCTION get_email_from_identifier(identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_email text;
BEGIN
  -- Se já é um email (contém @), retorna como está
  IF identifier LIKE '%@%' THEN
    RETURN identifier;
  END IF;

  -- Buscar email pelo username
  SELECT u.email INTO result_email
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE LOWER(p.username) = LOWER(identifier)
  LIMIT 1;

  -- Retornar o email encontrado ou null se não existir
  RETURN result_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_email_from_identifier(text) TO authenticated;