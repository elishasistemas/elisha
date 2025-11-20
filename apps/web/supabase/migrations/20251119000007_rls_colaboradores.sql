-- Migration: Adicionar políticas RLS para colaboradores
-- Data: 2025-11-19

-- Habilitar RLS se ainda não estiver
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS colaboradores_select_all ON public.colaboradores;
DROP POLICY IF EXISTS colaboradores_insert_all ON public.colaboradores;
DROP POLICY IF EXISTS colaboradores_update_all ON public.colaboradores;
DROP POLICY IF EXISTS colaboradores_delete_all ON public.colaboradores;

-- Políticas básicas permissivas
CREATE POLICY colaboradores_select_all ON public.colaboradores FOR SELECT USING (true);
CREATE POLICY colaboradores_insert_all ON public.colaboradores FOR INSERT WITH CHECK (true);
CREATE POLICY colaboradores_update_all ON public.colaboradores FOR UPDATE USING (true);
CREATE POLICY colaboradores_delete_all ON public.colaboradores FOR DELETE USING (true);
