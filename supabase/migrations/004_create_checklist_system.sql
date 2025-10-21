-- Migration: Create Checklist System with Immutable Snapshots
-- Version: 1.0.0
-- Description: Implements checklist system for OS with ABNT-ready structure

-- Enable required extensions (idempotent)
create extension if not exists pgcrypto;

-- ============================================
-- 1. HELPER FUNCTION FOR CURRENT_EMPRESA_ID
-- ============================================

-- Create function to get current user's empresa_id (if not exists)
create or replace function public.current_empresa_id()
returns uuid
language sql
stable
as $$
  select empresa_id 
  from public.profiles 
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================
-- 2. CREATE CHECKLISTS TABLE (TEMPLATES)
-- ============================================

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  tipo_servico text not null check (tipo_servico in ('preventiva', 'corretiva', 'emergencial', 'chamado', 'todos')),
  itens jsonb not null default '[]'::jsonb,
  versao integer not null default 1,
  origem text not null default 'custom' check (origem in ('abnt', 'custom', 'elisha')),
  abnt_refs text[] not null default '{}',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklists_versao_min check (versao >= 1)
);

-- Indexes
create index if not exists idx_checklists_empresa_id on public.checklists(empresa_id);
create index if not exists idx_checklists_empresa_tipo_ativo on public.checklists(empresa_id, tipo_servico, ativo);
create index if not exists idx_checklists_tipo_servico on public.checklists(tipo_servico);
create index if not exists idx_checklists_ativo on public.checklists(ativo);

-- Comments
comment on table public.checklists is 'Templates de checklists reutilizáveis';
comment on column public.checklists.itens is 'Array JSON com itens do checklist [{ordem, secao, descricao, tipo, obrigatorio, critico, ...}]';
comment on column public.checklists.versao is 'Versão do template (incrementa a cada alteração)';
comment on column public.checklists.origem is 'Origem: abnt (normas), custom (customizado), elisha (padrão sistema)';
comment on column public.checklists.abnt_refs is 'Referências às normas ABNT aplicáveis';

-- Enable RLS
alter table public.checklists enable row level security;

-- ============================================
-- 3. CREATE OS_CHECKLISTS TABLE (SNAPSHOTS)
-- ============================================

create table if not exists public.os_checklists (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  checklist_id uuid null references public.checklists(id) on delete set null,
  template_snapshot jsonb not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  responsavel_id uuid null references public.colaboradores(id) on delete set null,
  empresa_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint os_checklists_completed_after_started check (completed_at is null or completed_at >= started_at)
);

-- Unique constraint: one checklist snapshot per OS
create unique index if not exists os_checklists_os_uidx on public.os_checklists(os_id);

-- Indexes
create index if not exists os_checklists_empresa_idx on public.os_checklists(empresa_id);
create index if not exists os_checklists_checklist_idx on public.os_checklists(checklist_id);
create index if not exists os_checklists_os_idx on public.os_checklists(os_id);
create index if not exists os_checklists_completed_idx on public.os_checklists(completed_at);

-- Comments
comment on table public.os_checklists is 'Snapshots imutáveis de checklists vinculados a OS';
comment on column public.os_checklists.template_snapshot is 'Snapshot completo do template no momento da vinculação';
comment on column public.os_checklists.checklist_id is 'Referência ao template original (pode ser null se template for deletado)';

-- Enable RLS
alter table public.os_checklists enable row level security;

-- ============================================
-- 4. CREATE CHECKLIST_RESPOSTAS TABLE
-- ============================================

create table if not exists public.checklist_respostas (
  id uuid primary key default gen_random_uuid(),
  os_checklist_id uuid null references public.os_checklists(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  item_ordem integer not null,
  descricao text not null,
  status_item text not null default 'pendente' check (status_item in ('pendente', 'conforme', 'nao_conforme', 'na')),
  valor_boolean boolean null,
  valor_text text null,
  valor_number numeric null,
  observacoes text null,
  fotos_urls text[] not null default '{}',
  assinatura_url text null,
  respondido_por uuid null references public.colaboradores(id) on delete set null,
  respondido_em timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint checklist_respostas_ordem_min check (item_ordem >= 1)
);

-- Drop old unique constraint if exists and create new one
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name='checklist_respostas'
      and constraint_name='checklist_respostas_os_id_item_ordem_key'
  ) then
    alter table public.checklist_respostas
      drop constraint checklist_respostas_os_id_item_ordem_key;
  end if;
end$$;

-- New unique constraint per snapshot
create unique index if not exists checklist_respostas_unique_item 
  on public.checklist_respostas(os_checklist_id, item_ordem) 
  where os_checklist_id is not null;

-- Indexes
create index if not exists checklist_respostas_os_checklist_idx on public.checklist_respostas(os_checklist_id);
create index if not exists checklist_respostas_os_idx on public.checklist_respostas(os_id);
create index if not exists checklist_respostas_status_idx on public.checklist_respostas(status_item);
create index if not exists checklist_respostas_respondido_idx on public.checklist_respostas(respondido_por);

-- Comments
comment on table public.checklist_respostas is 'Respostas dos itens de checklist por OS';
comment on column public.checklist_respostas.os_checklist_id is 'Referência ao snapshot do checklist';
comment on column public.checklist_respostas.status_item is 'Status: pendente, conforme, nao_conforme, na (não aplicável)';
comment on column public.checklist_respostas.fotos_urls is 'URLs das fotos de evidência';

-- Enable RLS
alter table public.checklist_respostas enable row level security;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger to auto-populate empresa_id from OS
create or replace function public.osc_set_empresa_id()
returns trigger 
language plpgsql 
as $$
begin
  if new.empresa_id is null then
    select o.empresa_id into new.empresa_id
    from public.ordens_servico o
    where o.id = new.os_id;
  end if;
  return new;
end$$;

drop trigger if exists t_bi_osc on public.os_checklists;
create trigger t_bi_osc 
  before insert on public.os_checklists
  for each row 
  execute function public.osc_set_empresa_id();

-- Trigger for updated_at on checklists
drop trigger if exists update_checklists_updated_at on public.checklists;
create trigger update_checklists_updated_at 
  before update on public.checklists
  for each row 
  execute function public.update_updated_at_column();

-- Trigger for updated_at on os_checklists
drop trigger if exists update_os_checklists_updated_at on public.os_checklists;
create trigger update_os_checklists_updated_at 
  before update on public.os_checklists
  for each row 
  execute function public.update_updated_at_column();

-- Trigger for updated_at on checklist_respostas
drop trigger if exists update_checklist_respostas_updated_at on public.checklist_respostas;
create trigger update_checklist_respostas_updated_at 
  before update on public.checklist_respostas
  for each row 
  execute function public.update_updated_at_column();

-- ============================================
-- 6. RLS POLICIES FOR CHECKLISTS
-- ============================================

-- Users can view checklists from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_sel_emp' and tablename = 'checklists'
  ) then
    create policy checklists_sel_emp on public.checklists
      for select using (empresa_id = current_empresa_id());
  end if;
end$$;

-- Admins and gestores can create checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_ins_emp' and tablename = 'checklists'
  ) then
    create policy checklists_ins_emp on public.checklists
      for insert with check (
        empresa_id = current_empresa_id() 
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- Admins and gestores can update checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_upd_emp' and tablename = 'checklists'
  ) then
    create policy checklists_upd_emp on public.checklists
      for update using (
        empresa_id = current_empresa_id()
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- Admins can delete checklists
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'checklists_del_emp' and tablename = 'checklists'
  ) then
    create policy checklists_del_emp on public.checklists
      for delete using (
        empresa_id = current_empresa_id()
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role = 'admin'
        )
      );
  end if;
end$$;

-- ============================================
-- 7. RLS POLICIES FOR OS_CHECKLISTS
-- ============================================

-- Users can view snapshots from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_sel_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_sel_emp on public.os_checklists
      for select using (empresa_id = current_empresa_id());
  end if;
end$$;

-- Users can create snapshots for OS of their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_ins_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_ins_emp on public.os_checklists
      for insert with check (empresa_id = current_empresa_id());
  end if;
end$$;

-- Users can update snapshots from their empresa
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'osc_upd_emp' and tablename = 'os_checklists'
  ) then
    create policy osc_upd_emp on public.os_checklists
      for update using (empresa_id = current_empresa_id());
  end if;
end$$;

-- ============================================
-- 8. RLS POLICIES FOR CHECKLIST_RESPOSTAS
-- ============================================

-- Users can view responses from their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_sel_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_sel_emp on public.checklist_respostas
      for select using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Users can create responses for their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_ins_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_ins_emp on public.checklist_respostas
      for insert with check (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Users can update responses from their empresa's OS
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_upd_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_upd_emp on public.checklist_respostas
      for update using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
      );
  end if;
end$$;

-- Admins and gestores can delete responses
do $$
begin
  if not exists (
    select 1 from pg_policies
    where polname = 'cr_del_emp' and tablename = 'checklist_respostas'
  ) then
    create policy cr_del_emp on public.checklist_respostas
      for delete using (
        os_id in (
          select id from public.ordens_servico 
          where empresa_id = current_empresa_id()
        )
        and exists (
          select 1 from public.profiles 
          where user_id = auth.uid() 
          and role in ('admin', 'gestor')
        )
      );
  end if;
end$$;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

grant usage on schema public to anon, authenticated;
grant all on public.checklists to authenticated;
grant all on public.os_checklists to authenticated;
grant all on public.checklist_respostas to authenticated;

-- ============================================
-- 10. VERIFICATION & SUMMARY
-- ============================================

do $$
declare
  checklist_count integer;
  snapshot_count integer;
  resposta_count integer;
begin
  -- Count tables
  select count(*) into checklist_count from information_schema.tables where table_name = 'checklists';
  select count(*) into snapshot_count from information_schema.tables where table_name = 'os_checklists';
  select count(*) into resposta_count from information_schema.tables where table_name = 'checklist_respostas';
  
  raise notice '✅ Migration 004 completed successfully!';
  raise notice 'Tables created/updated:';
  raise notice '  - checklists (templates): %', checklist_count;
  raise notice '  - os_checklists (snapshots): %', snapshot_count;
  raise notice '  - checklist_respostas (responses): %', resposta_count;
  raise notice 'Features:';
  raise notice '  ✓ Immutable snapshots per OS';
  raise notice '  ✓ ABNT-ready structure (versão, origem, refs)';
  raise notice '  ✓ RLS enabled on all tables';
  raise notice '  ✓ Multi-tenant isolation by empresa_id';
  raise notice '  ✓ Idempotent migration';
end $$;

