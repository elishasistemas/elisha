-- Fix: Adicionar status faltantes ao CHECK constraint de ordens_servico
-- Date: 2025-10-31
-- Issue: Status 'em_deslocamento', 'checkin', 'checkout', 'reaberta' não estão no CHECK constraint

-- =====================================================
-- UPDATE: CHECK constraint de status em ordens_servico
-- =====================================================

-- Remover constraint antiga
ALTER TABLE public.ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_status_check;

-- Adicionar nova constraint com todos os status
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

