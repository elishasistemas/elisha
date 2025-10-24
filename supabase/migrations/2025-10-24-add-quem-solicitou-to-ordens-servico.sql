-- Migration: Add quem_solicitou column to ordens_servico
-- Description: Adiciona campo dedicado para armazenar quem solicitou a ordem de serviço
-- Date: 2025-10-24

-- Add the column
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS quem_solicitou text;

-- Add comment
COMMENT ON COLUMN public.ordens_servico.quem_solicitou IS 'Nome da pessoa que solicitou a ordem de serviço';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS ordens_servico_quem_solicitou_idx 
ON public.ordens_servico (quem_solicitou);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: quem_solicitou column added to ordens_servico';
END $$;

