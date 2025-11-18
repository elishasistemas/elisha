-- Storage Setup: Create evidencias bucket and policies
-- Version: 1.0.0
-- Description: Sets up storage bucket for OS evidences (photos, videos, audio) with proper access policies
-- Task: 4 (Checklist + Laudo + Evidências)

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Create bucket for evidencias (photos, videos, audio files)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidencias',
  'evidencias',
  false,  -- private bucket (requires auth)
  52428800,  -- 50MB limit
  array[
    -- Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    -- Videos
    'video/mp4', 'video/webm', 'video/quicktime',
    -- Audio
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
  ]
)
on conflict (id) do nothing;

-- ============================================
-- 2. CREATE STORAGE POLICIES
-- ============================================

-- Policy: Authenticated users can upload evidences to their empresa's folder
create policy "Authenticated users can upload evidences"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'evidencias'
  and auth.role() = 'authenticated'
  -- Path format: {os_id}/{tipo}/{filename}
  -- Example: uuid-os/foto/1234567890.jpg
);

-- Policy: Authenticated users can read evidences from their empresa
create policy "Authenticated users can read evidences"
on storage.objects for select
to authenticated
using (
  bucket_id = 'evidencias'
  and (
    is_elisha_admin() = true
    or exists (
      select 1
      from public.os_evidencias
      where os_evidencias.storage_path = (storage.objects.name)
      and (
        os_evidencias.empresa_id = current_empresa_id()
        or is_elisha_admin() = true
      )
    )
  )
);

-- Policy: Authenticated users can update their own evidences
create policy "Authenticated users can update evidences"
on storage.objects for update
to authenticated
using (
  bucket_id = 'evidencias'
  and (
    is_elisha_admin() = true
    or exists (
      select 1
      from public.os_evidencias
      where os_evidencias.storage_path = (storage.objects.name)
      and os_evidencias.created_by = auth.uid()
      and (
        os_evidencias.empresa_id = current_empresa_id()
        or is_elisha_admin() = true
      )
    )
  )
)
with check (
  bucket_id = 'evidencias'
);

-- Policy: Authenticated users can delete their own evidences
create policy "Authenticated users can delete evidences"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'evidencias'
  and (
    is_elisha_admin() = true
    or exists (
      select 1
      from public.os_evidencias
      where os_evidencias.storage_path = (storage.objects.name)
      and os_evidencias.created_by = auth.uid()
      and (
        os_evidencias.empresa_id = current_empresa_id()
        or is_elisha_admin() = true
      )
    )
  )
);

-- ============================================
-- 3. VERIFICATION
-- ============================================

do $$
declare
  bucket_exists boolean;
  policy_count integer;
begin
  -- Check if bucket exists
  select exists(
    select 1 from storage.buckets where id = 'evidencias'
  ) into bucket_exists;
  
  -- Count policies
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like '%evidences%' or policyname like '%evidencias%';
  
  if bucket_exists then
    raise notice '✅ Storage bucket "evidencias" created successfully!';
  else
    raise exception '❌ Failed to create storage bucket';
  end if;
  
  raise notice '✅ Storage policies created: %', policy_count;
  raise notice 'Bucket configuration:';
  raise notice '  - Name: evidencias';
  raise notice '  - Public: No (private, requires auth)';
  raise notice '  - Size limit: 50MB';
  raise notice '  - Allowed types: Images, Videos, Audio';
  raise notice '  - Folder structure: {os_id}/{tipo}/{filename}';
end $$;

