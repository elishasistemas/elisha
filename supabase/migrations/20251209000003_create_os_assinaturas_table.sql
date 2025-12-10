-- Create: Tabela os_assinaturas para armazenar assinaturas dos clientes
-- Date: 2025-12-09
-- Description: Armazena assinaturas coletadas no checkout das OSs

CREATE TABLE IF NOT EXISTS public.os_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_cliente text NOT NULL,
  assinatura_base64 text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS os_assinaturas_os_id_idx ON public.os_assinaturas (os_id);
CREATE INDEX IF NOT EXISTS os_assinaturas_empresa_id_idx ON public.os_assinaturas (empresa_id);

-- RLS
ALTER TABLE public.os_assinaturas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins podem ver assinaturas da empresa" ON public.os_assinaturas;
DROP POLICY IF EXISTS "Técnicos podem ver suas assinaturas" ON public.os_assinaturas;
DROP POLICY IF EXISTS "Técnicos podem inserir assinaturas" ON public.os_assinaturas;

-- Policy: Admins podem ver todas as assinaturas da empresa
CREATE POLICY "Admins podem ver assinaturas da empresa" ON public.os_assinaturas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.empresa_id = os_assinaturas.empresa_id
      AND profiles.active_role = 'admin'
    )
  );

-- Policy: Técnicos podem ver assinaturas das OSs que eles atenderam
CREATE POLICY "Técnicos podem ver suas assinaturas" ON public.os_assinaturas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN ordens_servico os ON os.tecnico_id = p.tecnico_id
      WHERE p.user_id = auth.uid()
      AND os.id = os_assinaturas.os_id
    )
  );

-- Policy: Técnicos podem inserir assinaturas (via RPC)
CREATE POLICY "Técnicos podem inserir assinaturas" ON public.os_assinaturas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.active_role IN ('tecnico', 'admin')
    )
  );

COMMENT ON TABLE public.os_assinaturas IS 'Assinaturas dos clientes coletadas no checkout das OSs';
COMMENT ON COLUMN public.os_assinaturas.assinatura_base64 IS 'Assinatura em formato base64 (data URL)';
COMMENT ON COLUMN public.os_assinaturas.metadata IS 'Metadados adicionais: estado_equipamento, collected_by, collected_at, etc';
