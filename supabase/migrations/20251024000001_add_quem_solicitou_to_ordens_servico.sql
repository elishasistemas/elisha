-- Migration: Add quem_solicitou column to ordens_servico
-- Description: Adiciona campo dedicado para armazenar quem solicitou a ordem de serviço
-- Date: 2025-10-24

-- Drop view first (will be recreated after)
DROP VIEW IF EXISTS public.ordens_servico_enriquecida;

-- Add the column
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS quem_solicitou text;

-- Add comment
COMMENT ON COLUMN public.ordens_servico.quem_solicitou IS 'Nome da pessoa que solicitou a ordem de serviço';

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS ordens_servico_quem_solicitou_idx 
ON public.ordens_servico (quem_solicitou);

-- Recreate view with new structure
CREATE OR REPLACE VIEW public.ordens_servico_enriquecida AS
SELECT
  os.*,
  CASE os.status
    WHEN 'parado' THEN 0
    WHEN 'novo' THEN 1
    WHEN 'em_andamento' THEN 2
    WHEN 'aguardando_assinatura' THEN 3
    WHEN 'concluido' THEN 4
    WHEN 'cancelado' THEN 5
    ELSE 6
  END AS peso_status,
  CASE os.prioridade
    WHEN 'alta' THEN 1
    WHEN 'media' THEN 2
    WHEN 'baixa' THEN 3
    ELSE 4
  END AS peso_prioridade
FROM public.ordens_servico os;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed: quem_solicitou column added to ordens_servico';
  RAISE NOTICE '✅ View ordens_servico_enriquecida recreated with new structure';
END $$;

