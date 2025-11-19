-- =====================================================
-- Migration: Create OS Evidencias and Laudo System
-- Description: Tabela de evidências, laudo com autosave e RLS
-- Author: Elisha AI
-- Date: 2025-10-28
-- Task: 4 (Checklist + Laudo + Evidências)
-- =====================================================

-- =====================================================
-- ENUM: Tipos de Evidência
-- =====================================================
DO $$ BEGIN
  CREATE TYPE evidencia_tipo AS ENUM ('foto', 'video', 'audio', 'nota');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: os_evidencias
-- Description: Armazena evidências vinculadas às OS
-- =====================================================
CREATE TABLE IF NOT EXISTS os_evidencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo evidencia_tipo NOT NULL,
  
  -- Storage path (para foto/video/audio)
  storage_path text,
  
  -- Conteúdo direto (para notas de texto)
  conteudo text,
  
  -- Metadata adicional
  titulo text,
  descricao text,
  tamanho_bytes bigint,
  mime_type text,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT evidencia_storage_or_content CHECK (
    (tipo IN ('foto', 'video', 'audio') AND storage_path IS NOT NULL) OR
    (tipo = 'nota' AND conteudo IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_os_evidencias_os_id ON os_evidencias(os_id);
CREATE INDEX IF NOT EXISTS idx_os_evidencias_empresa_id ON os_evidencias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_os_evidencias_tipo ON os_evidencias(tipo);

-- =====================================================
-- TABLE: os_laudos
-- Description: Laudo técnico com autosave
-- =====================================================
CREATE TABLE IF NOT EXISTS os_laudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL UNIQUE REFERENCES ordens_servico(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Conteúdo do laudo
  descricao text,
  diagnostico text,
  solucao_aplicada text,
  recomendacoes text,
  
  -- Metadata
  versao int NOT NULL DEFAULT 1,
  
  -- Auditoria
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_os_laudos_os_id ON os_laudos(os_id);
CREATE INDEX IF NOT EXISTS idx_os_laudos_empresa_id ON os_laudos(empresa_id);

-- =====================================================
-- RLS: os_evidencias
-- =====================================================
ALTER TABLE os_evidencias ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura
CREATE POLICY "evidencias_select_authenticated" ON os_evidencias
  FOR SELECT TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Inserção
CREATE POLICY "evidencias_insert_authenticated" ON os_evidencias
  FOR INSERT TO authenticated
  WITH CHECK (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Atualização (somente criador ou admin)
CREATE POLICY "evidencias_update_owner_or_admin" ON os_evidencias
  FOR UPDATE TO authenticated
  USING (
    is_elisha_admin() = true OR
    (empresa_id = current_empresa_id() AND created_by = auth.uid())
  );

-- Policy: Deleção (somente criador ou admin)
CREATE POLICY "evidencias_delete_owner_or_admin" ON os_evidencias
  FOR DELETE TO authenticated
  USING (
    is_elisha_admin() = true OR
    (empresa_id = current_empresa_id() AND created_by = auth.uid())
  );

-- =====================================================
-- RLS: os_laudos
-- =====================================================
ALTER TABLE os_laudos ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura
CREATE POLICY "laudos_select_authenticated" ON os_laudos
  FOR SELECT TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Inserção
CREATE POLICY "laudos_insert_authenticated" ON os_laudos
  FOR INSERT TO authenticated
  WITH CHECK (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- Policy: Atualização
CREATE POLICY "laudos_update_authenticated" ON os_laudos
  FOR UPDATE TO authenticated
  USING (
    is_elisha_admin() = true OR
    empresa_id = current_empresa_id()
  );

-- =====================================================
-- TRIGGER: Atualizar updated_at em os_laudos
-- =====================================================
CREATE OR REPLACE FUNCTION update_os_laudo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  NEW.versao = OLD.versao + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_os_laudos_updated_at
  BEFORE UPDATE ON os_laudos
  FOR EACH ROW
  EXECUTE FUNCTION update_os_laudo_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE os_evidencias IS 'Evidências (foto/vídeo/áudio/nota) vinculadas a OS';
COMMENT ON TABLE os_laudos IS 'Laudo técnico com autosave e versionamento';
COMMENT ON COLUMN os_evidencias.tipo IS 'Tipo de evidência: foto, video, audio ou nota';
COMMENT ON COLUMN os_evidencias.storage_path IS 'Caminho no storage (para foto/video/audio)';
COMMENT ON COLUMN os_evidencias.conteudo IS 'Conteúdo direto (para notas de texto)';
COMMENT ON COLUMN os_laudos.versao IS 'Versão do laudo (incrementada a cada update)';

