-- =====================================================
-- Migration: Add contract and equipment fields
-- Data: 2025-10-24
-- Descrição: Adicionar campos de contrato em clientes
--            e campos detalhados em equipamentos
-- =====================================================

-- ==========================================
-- 1. CLIENTES - Adicionar campos de contrato
-- ==========================================

-- Adicionar valor mensal do contrato
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS valor_mensal_contrato NUMERIC(10, 2);

-- Adicionar número da ART
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS numero_art TEXT;

-- Comentários
COMMENT ON COLUMN public.clientes.valor_mensal_contrato IS 'Valor mensal do contrato de manutenção';
COMMENT ON COLUMN public.clientes.numero_art IS 'Número da Anotação de Responsabilidade Técnica';

-- ==========================================
-- 2. EQUIPAMENTOS - Adicionar campos detalhados
-- ==========================================

-- Adicionar nome do equipamento
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS nome TEXT;

-- Adicionar pavimentos
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS pavimentos TEXT;

-- Adicionar capacidade
ALTER TABLE public.equipamentos
ADD COLUMN IF NOT EXISTS capacidade TEXT;

-- Comentários
COMMENT ON COLUMN public.equipamentos.nome IS 'Nome identificador do equipamento';
COMMENT ON COLUMN public.equipamentos.pavimentos IS 'Pavimentos atendidos pelo equipamento';
COMMENT ON COLUMN public.equipamentos.capacidade IS 'Capacidade do equipamento (ex: 8 pessoas, 600kg)';

-- ==========================================
-- COMENTÁRIO FINAL
-- ==========================================
COMMENT ON TABLE public.clientes IS 'Tabela de clientes - atualizada em 2025-10-24 com campos de contrato';
COMMENT ON TABLE public.equipamentos IS 'Tabela de equipamentos - atualizada em 2025-10-24 com campos detalhados';

