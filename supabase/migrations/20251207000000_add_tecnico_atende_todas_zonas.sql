-- Add column to indicate if technician attends all zones
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS atende_todas_zonas boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.colaboradores.atende_todas_zonas IS 'Indica se o técnico atende todas as zonas da empresa';

-- Index for filtering
CREATE INDEX IF NOT EXISTS colaboradores_atende_todas_zonas_idx 
ON public.colaboradores (atende_todas_zonas);
