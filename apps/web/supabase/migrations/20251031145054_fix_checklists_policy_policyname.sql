-- Align local with remote migration version 20251031145054
-- Fix RLS policy for public.checklists using idempotent DROP/CREATE

DROP POLICY IF EXISTS checklists_sel_emp ON public.checklists;
CREATE POLICY checklists_sel_emp
  ON public.checklists
  FOR SELECT
  USING (empresa_id = public.current_empresa_id());


