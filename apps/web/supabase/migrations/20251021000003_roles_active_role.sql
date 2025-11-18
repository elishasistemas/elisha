-- Perfis com papéis múltiplos e modo ativo (adaptado para tabela 'profiles')
alter table public.profiles
  add column if not exists roles text[] not null default '{}',
  add column if not exists active_role text check (active_role in ('gestor','tecnico') or active_role is null),
  add column if not exists tecnico_id uuid;

-- Helpers de contexto (JWT claims)
create or replace function public.current_active_role() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'active_role','')
$$;

create or replace function public.current_tecnico_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'tecnico_id','')::uuid
$$;

create or replace function public.current_empresa_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb->>'empresa_id','')::uuid
$$;

-- Helper para verificar se usuário é elisha_admin
create or replace function public.is_elisha_admin() returns boolean
language sql stable as $$
  select coalesce(
    (select p.is_elisha_admin 
     from public.profiles p 
     where p.user_id = auth.uid()),
    false
  )
$$;

-- RLS nas ordens de serviço (exemplo)
alter table public.ordens_servico enable row level security;

DROP POLICY IF EXISTS os_select ON public.ordens_servico;
CREATE POLICY os_select
  ON public.ordens_servico
  FOR SELECT
  USING (
    empresa_id = public.current_empresa_id()
    AND (
      public.current_active_role() = 'gestor'
      OR (public.current_active_role() = 'tecnico' AND tecnico_id = public.current_tecnico_id())
    )
  );

-- Replicar o padrão de RLS conforme necessário:
--   os_checklists, checklist_respostas, orcamentos, clientes, contratos, sites

