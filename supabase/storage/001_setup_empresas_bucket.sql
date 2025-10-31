-- Storage Setup: Create empresas bucket and policies
-- Version: 0.3.0
-- Description: Sets up storage bucket for company logos with proper access policies

-- ============================================
-- 1. CREATE STORAGE BUCKET
-- ============================================

-- Create public bucket for empresas (logos, documents, etc.)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'empresas',
  'empresas',
  true,  -- public bucket (anyone can read)
  2097152,  -- 2MB limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- ============================================
-- 2. CREATE STORAGE POLICIES
-- ============================================

-- Policy: Authenticated users can upload to empresas/logos/
create policy "Authenticated users can upload company logos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'empresas'
  and (storage.foldername(name))[1] = 'logos'
  and auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update their own company logos
create policy "Authenticated users can update company logos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'empresas'
  and (storage.foldername(name))[1] = 'logos'
  and auth.role() = 'authenticated'
)
with check (
  bucket_id = 'empresas'
  and (storage.foldername(name))[1] = 'logos'
);

-- Policy: Authenticated users can delete their own company logos
create policy "Authenticated users can delete company logos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'empresas'
  and (storage.foldername(name))[1] = 'logos'
  and auth.role() = 'authenticated'
);

-- Policy: Public can read all files in empresas bucket
create policy "Public can read company assets"
on storage.objects for select
to public
using (bucket_id = 'empresas');

-- ============================================
-- 3. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get public URL for a file
create or replace function public.get_empresa_logo_url(file_path text)
returns text
language plpgsql
security definer
as $$
declare
  bucket_url text;
begin
  -- Get the Supabase storage public URL
  select concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/empresas/',
    file_path
  ) into bucket_url;
  
  return bucket_url;
end;
$$;

comment on function public.get_empresa_logo_url is 'Helper to generate public URL for empresa logo';

-- ============================================
-- 4. VERIFICATION
-- ============================================

do $$
declare
  bucket_exists boolean;
  policy_count integer;
begin
  -- Check if bucket exists
  select exists(
    select 1 from storage.buckets where id = 'empresas'
  ) into bucket_exists;
  
  -- Count policies
  select count(*) into policy_count
  from pg_policies
  where schemaname = 'storage'
  and tablename = 'objects'
  and policyname like '%company%';
  
  if bucket_exists then
    raise notice '✅ Storage bucket "empresas" created successfully!';
  else
    raise exception '❌ Failed to create storage bucket';
  end if;
  
  raise notice '✅ Storage policies created: %', policy_count;
  raise notice 'Bucket configuration:';
  raise notice '  - Name: empresas';
  raise notice '  - Public: Yes (read-only)';
  raise notice '  - Size limit: 2MB';
  raise notice '  - Allowed types: JPEG, PNG, GIF, WebP, SVG';
  raise notice '  - Folder structure: empresas/logos/{empresa_id}-logo-{timestamp}.{ext}';
end $$;

