-- Migration: Permitir SELECT para todos na tabela clientes
-- Data: 2025-11-19

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clientes_select_all ON public.clientes;
CREATE POLICY clientes_select_all
  ON public.clientes
  FOR SELECT
  USING (true);
