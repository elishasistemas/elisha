-- RLS adicionais seguindo padrão do brief

-- os_checklists
alter table if exists public.os_checklists enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='os_checklists' and polname='os_checklists_select') then
    create policy os_checklists_select on public.os_checklists for select
      using (
        empresa_id = public.current_empresa_id()
        and (
          public.current_active_role() = 'gestor'
          or (
            public.current_active_role() = 'tecnico'
            and exists (
              select 1 from public.ordens_servico os
              where os.id = os_checklists.os_id
                and os.tecnico_id = public.current_tecnico_id()
            )
          )
        )
      );
  end if;
end$$;

-- checklist_respostas
alter table if exists public.checklist_respostas enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='checklist_respostas' and polname='checklist_respostas_select') then
    create policy checklist_respostas_select on public.checklist_respostas for select
      using (
        exists (
          select 1 from public.os_checklists oc
          join public.ordens_servico os on os.id = oc.os_id
          where oc.id = checklist_respostas.os_checklist_id
            and oc.empresa_id = public.current_empresa_id()
            and (
              public.current_active_role() = 'gestor' or (
                public.current_active_role() = 'tecnico' and os.tecnico_id = public.current_tecnico_id()
              )
            )
        )
      );
  end if;
end$$;

-- clientes (acesso por empresa)
alter table if exists public.clientes enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename='clientes' and polname='clientes_select') then
    create policy clientes_select on public.clientes for select
      using (
        empresa_id = public.current_empresa_id()
      );
  end if;
end$$;

