-- Migration: Adicionar políticas RLS para equipamentos
-- Data: 2025-11-19

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS equipamentos_select_all ON public.equipamentos;
DROP POLICY IF EXISTS equipamentos_insert_all ON public.equipamentos;
DROP POLICY IF EXISTS equipamentos_update_all ON public.equipamentos;
DROP POLICY IF EXISTS equipamentos_delete_all ON public.equipamentos;

-- Políticas básicas permissivas
CREATE POLICY equipamentos_select_all ON public.equipamentos FOR SELECT USING (true);
CREATE POLICY equipamentos_insert_all ON public.equipamentos FOR INSERT WITH CHECK (true);
CREATE POLICY equipamentos_update_all ON public.equipamentos FOR UPDATE USING (true);
CREATE POLICY equipamentos_delete_all ON public.equipamentos FOR DELETE USING (true);
