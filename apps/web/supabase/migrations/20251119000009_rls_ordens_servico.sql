-- Migration: Adicionar políticas RLS para ordens_servico
-- Data: 2025-11-19

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS ordens_servico_select_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_insert_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_update_all ON public.ordens_servico;
DROP POLICY IF EXISTS ordens_servico_delete_all ON public.ordens_servico;

-- Políticas básicas permissivas
CREATE POLICY ordens_servico_select_all ON public.ordens_servico FOR SELECT USING (true);
CREATE POLICY ordens_servico_insert_all ON public.ordens_servico FOR INSERT WITH CHECK (true);
CREATE POLICY ordens_servico_update_all ON public.ordens_servico FOR UPDATE USING (true);
CREATE POLICY ordens_servico_delete_all ON public.ordens_servico FOR DELETE USING (true);
