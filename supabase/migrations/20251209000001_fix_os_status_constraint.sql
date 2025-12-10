-- Fix: Garantir que constraint de status inclua 'em_deslocamento'
-- Date: 2025-12-09
-- Issue: Constraint ordens_servico_status_check não permite 'em_deslocamento'

-- Remover constraint antiga se existir
ALTER TABLE public.ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

-- Adicionar nova constraint com todos os status necessários
ALTER TABLE public.ordens_servico
ADD CONSTRAINT ordens_servico_status_check 
CHECK (status IN (
  'novo',
  'em_deslocamento',
  'checkin',
  'em_andamento',
  'checkout',
  'aguardando_assinatura',
  'concluido',
  'cancelado',
  'parado',
  'reaberta'
));

COMMENT ON CONSTRAINT ordens_servico_status_check ON public.ordens_servico IS 
'Valores permitidos para status da OS: novo, em_deslocamento, checkin, em_andamento, checkout, aguardando_assinatura, concluido, cancelado, parado, reaberta';
