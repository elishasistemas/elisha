-- Migration: Permitir INSERT do próprio usuário na tabela profiles
-- Data: 2025-11-19

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
