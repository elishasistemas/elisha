-- Resetar políticas RLS para empresas e profiles
-- Data: 2025-11-19

-- Remover todas as políticas existentes nas tabelas
DROP POLICY IF EXISTS "Admins can delete their empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins can update their empresa" ON public.empresas;
DROP POLICY IF EXISTS "Only admins can create empresas" ON public.empresas;
DROP POLICY IF EXISTS "Users can view their own empresa" ON public.empresas;
DROP POLICY IF EXISTS empresas_select_all ON public.empresas;
DROP POLICY IF EXISTS empresas_select_anon ON public.empresas;

DROP POLICY IF EXISTS "Admins can update profiles from same empresa" ON public.profiles;
DROP POLICY IF EXISTS "Profiles created via trigger or invite system only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles from same empresa" ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_any ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas permissivas
CREATE POLICY empresas_select_all ON public.empresas FOR SELECT USING (true);
CREATE POLICY empresas_insert_all ON public.empresas FOR INSERT WITH CHECK (true);
CREATE POLICY empresas_update_all ON public.empresas FOR UPDATE USING (true);
CREATE POLICY empresas_delete_all ON public.empresas FOR DELETE USING (true);

CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_all ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY profiles_update_all ON public.profiles FOR UPDATE USING (true);
CREATE POLICY profiles_delete_all ON public.profiles FOR DELETE USING (true);
