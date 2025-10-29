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

-- RLS nas ordens de serviço (exemplo)
alter table public.ordens_servico enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='ordens_servico' and polname='os_select') then
    create policy os_select on public.ordens_servico for select
      using (
        empresa_id = public.current_empresa_id()
        and (
          public.current_active_role() = 'gestor'
          or (public.current_active_role() = 'tecnico' and tecnico_id = public.current_tecnico_id())
        )
      );
  end if;
end$$;

-- Replicar o padrão de RLS conforme necessário:
--   os_checklists, checklist_respostas, orcamentos, clientes, contratos, sites

