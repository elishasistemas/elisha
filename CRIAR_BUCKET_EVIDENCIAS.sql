-- =====================================================
-- SQL: Criar bucket 'evidencias' no Supabase Storage
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Criar o bucket 'evidencias' (público para URLs públicas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidencias', 
  'evidencias', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a']::text[];

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Authenticated users can upload evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Public access to evidencias" ON storage.objects;

-- 3. Criar política para upload (usuários autenticados)
CREATE POLICY "Authenticated users can upload evidencias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidencias'
);

-- 4. Criar política para leitura pública (para exibir as imagens/áudios)
CREATE POLICY "Public access to evidencias"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'evidencias'
);

-- 5. Criar política para deleção (usuários autenticados)
CREATE POLICY "Authenticated users can delete evidencias"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidencias'
);

-- 6. Verificar se bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'evidencias';

-- 7. Verificar políticas criadas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%evidencias%';
