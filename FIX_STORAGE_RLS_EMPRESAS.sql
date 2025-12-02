-- =====================================================
-- FIX: Políticas RLS para Supabase Storage - Bucket empresas
-- =====================================================
-- Este script configura as políticas de segurança para o bucket 'empresas'
-- permitindo que usuários autenticados façam upload de logos
-- 
-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- tanto em DEV quanto em PRODUÇÃO
-- =====================================================

-- 1. Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE id = 'empresas';

-- Se não existir, criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('empresas', 'empresas', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Public access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their logos" ON storage.objects;

-- 3. Criar novas políticas para upload de logos
-- Permitir upload para usuários autenticados na pasta empresas/logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'empresas' 
  AND (storage.foldername(name))[1] = 'empresas'
  AND (storage.foldername(name))[2] = 'logos'
);

-- Permitir update/substituição de logos existentes
CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'empresas'
  AND (storage.foldername(name))[1] = 'empresas'
  AND (storage.foldername(name))[2] = 'logos'
)
WITH CHECK (
  bucket_id = 'empresas'
  AND (storage.foldername(name))[1] = 'empresas'
  AND (storage.foldername(name))[2] = 'logos'
);

-- Permitir acesso público para leitura (para exibir as imagens)
CREATE POLICY "Public access to logos"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'empresas'
  AND (storage.foldername(name))[1] = 'empresas'
  AND (storage.foldername(name))[2] = 'logos'
);

-- Permitir delete apenas para usuários autenticados
CREATE POLICY "Authenticated users can delete their logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'empresas'
  AND (storage.foldername(name))[1] = 'empresas'
  AND (storage.foldername(name))[2] = 'logos'
);

-- 4. Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%logo%'
ORDER BY policyname;

-- 5. Verificar configurações do bucket
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'empresas';

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. O bucket 'empresas' deve ter public = true para URLs públicas
-- 2. Estrutura de pastas: empresas/logos/{empresaId}-logo-{timestamp}.{ext}
-- 3. Usuários autenticados podem fazer upload via backend (com JWT)
-- 4. Imagens são acessíveis publicamente para exibição
-- 5. Backend usa token do usuário para fazer upload (RLS aplica)
-- =====================================================
