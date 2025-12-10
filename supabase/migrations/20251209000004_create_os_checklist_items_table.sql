-- Create: Tabela os_checklist_items para armazenar respostas do checklist de OSs preventivas
-- Date: 2025-12-09
-- Description: Armazena o status de cada item do checklist durante atendimento preventivo

CREATE TABLE IF NOT EXISTS public.os_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  status text CHECK (status IN ('conforme', 'nao_conforme', 'na')),
  ordem integer NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS os_checklist_items_os_id_idx ON public.os_checklist_items (os_id);
CREATE INDEX IF NOT EXISTS os_checklist_items_empresa_id_idx ON public.os_checklist_items (empresa_id);
CREATE INDEX IF NOT EXISTS os_checklist_items_ordem_idx ON public.os_checklist_items (ordem);

-- RLS
ALTER TABLE public.os_checklist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins podem ver checklist items da empresa" ON public.os_checklist_items;
DROP POLICY IF EXISTS "Técnicos podem ver seus checklist items" ON public.os_checklist_items;
DROP POLICY IF EXISTS "Técnicos podem gerenciar checklist items" ON public.os_checklist_items;

-- Policy: Admins podem ver todos os itens da empresa
CREATE POLICY "Admins podem ver checklist items da empresa" ON public.os_checklist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.empresa_id = os_checklist_items.empresa_id
      AND profiles.active_role = 'admin'
    )
  );

-- Policy: Técnicos podem ver itens das OSs que eles atendem
CREATE POLICY "Técnicos podem ver seus checklist items" ON public.os_checklist_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN ordens_servico os ON os.tecnico_id = p.tecnico_id
      WHERE p.user_id = auth.uid()
      AND os.id = os_checklist_items.os_id
    )
  );

-- Policy: Técnicos podem inserir/atualizar itens
CREATE POLICY "Técnicos podem gerenciar checklist items" ON public.os_checklist_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN ordens_servico os ON os.tecnico_id = p.tecnico_id
      WHERE p.user_id = auth.uid()
      AND os.id = os_checklist_items.os_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN ordens_servico os ON os.tecnico_id = p.tecnico_id
      WHERE p.user_id = auth.uid()
      AND os.id = os_checklist_items.os_id
    )
  );

COMMENT ON TABLE public.os_checklist_items IS 'Itens do checklist de atendimento para OSs preventivas';
COMMENT ON COLUMN public.os_checklist_items.status IS 'Status do item: conforme, nao_conforme, na (não aplicável)';
COMMENT ON COLUMN public.os_checklist_items.ordem IS 'Ordem de exibição do item no checklist';
