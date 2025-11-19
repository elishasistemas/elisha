-- Migration: Adicionar campos faltantes na tabela empresas
-- Data: 2025-11-19

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Comentários
COMMENT ON COLUMN public.empresas.telefone IS 'Telefone de contato da empresa';
COMMENT ON COLUMN public.empresas.email IS 'Email de contato da empresa';
COMMENT ON COLUMN public.empresas.ativo IS 'Indica se a empresa está ativa';
COMMENT ON COLUMN public.empresas.updated_at IS 'Data da última atualização do registro';
