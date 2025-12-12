-- Migration para adicionar tipo "corretiva_programada" às ordens de serviço
-- Este tipo é usado para OSs criadas automaticamente quando o técnico
-- finaliza uma OS indicando que o equipamento está funcionando mas
-- precisa de manutenção corretiva futura.

-- 1. Remover constraint antiga de tipo
ALTER TABLE public.ordens_servico 
DROP CONSTRAINT IF EXISTS ordens_servico_tipo_check;

-- 2. Criar nova constraint incluindo corretiva_programada
ALTER TABLE public.ordens_servico 
ADD CONSTRAINT ordens_servico_tipo_check 
CHECK (tipo IN ('preventiva', 'corretiva', 'emergencial', 'chamado', 'corretiva_programada'));

-- 3. Adicionar comentário explicativo
COMMENT ON CONSTRAINT ordens_servico_tipo_check ON public.ordens_servico 
IS 'Tipos válidos de OS: preventiva, corretiva, emergencial, chamado, corretiva_programada (automática quando equipamento depende de manutenção futura)';
