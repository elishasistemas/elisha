-- Fix RLS policy for public.checklists using idempotent DROP/CREATE
-- Postgres 17 uses pg_policies.policyname (not polname); avoid catalog checks

DROP POLICY IF EXISTS checklists_sel_emp ON public.checklists;
CREATE POLICY checklists_sel_emp
  ON public.checklists
  FOR SELECT
  USING (empresa_id = public.current_empresa_id());


