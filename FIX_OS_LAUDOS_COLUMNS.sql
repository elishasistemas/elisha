-- =====================================================
-- FIX: Adicionar colunas faltantes em os_laudos
-- =====================================================
-- A tabela os_laudos foi criada com colunas diferentes das 
-- usadas pelo backend. Este script adiciona as colunas faltantes.
-- =====================================================

-- Adicionar coluna o_que_foi_feito (usada pelo componente de corretiva)
ALTER TABLE os_laudos 
ADD COLUMN IF NOT EXISTS o_que_foi_feito text;

-- Adicionar coluna observacao (usada pelo componente de preventiva)
ALTER TABLE os_laudos 
ADD COLUMN IF NOT EXISTS observacao text;

-- Verificar estrutura atualizada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'os_laudos'
ORDER BY ordinal_position;
