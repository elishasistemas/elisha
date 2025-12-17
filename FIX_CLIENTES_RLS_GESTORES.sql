-- Fix: Permitir que gestores também possam atualizar clientes
-- Executar no Supabase SQL Editor

-- Dropar política atual
drop policy if exists "Admins can update clientes" on public.clientes;

-- Criar política que permite admin E gestor atualizar clientes
create policy "Admins and gestores can update clientes" on public.clientes for update
to authenticated
using (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role in ('admin', 'gestor') or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
)
with check (
  empresa_id in (
    select empresa_id 
    from public.profiles 
    where user_id = auth.uid() 
    and (active_role in ('admin', 'gestor') or is_elisha_admin = true)
  )
  or
  empresa_id in (
    select impersonating_empresa_id
    from public.profiles
    where user_id = auth.uid()
    and is_elisha_admin = true
    and impersonating_empresa_id is not null
  )
);

-- Verificar se a política foi criada
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'clientes' AND cmd = 'UPDATE';
