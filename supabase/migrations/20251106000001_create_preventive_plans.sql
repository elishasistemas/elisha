-- Migration: Create Preventive Plans System
-- Version: 1.0.0
-- Description: Cria tabela e RPCs para gerenciar planos preventivos por tipo de equipamento

-- ============================================
-- 1. CREATE preventive_plans TABLE
-- ============================================

create table if not exists public.preventive_plans (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo_equipamento text not null,
  frequencia text not null, -- 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'
  intervalo_meses integer not null check (intervalo_meses > 0),
  janela_dias integer not null check (janela_dias > 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique partial index: apenas um plano ativo por empresa/tipo/frequencia
create unique index if not exists idx_preventive_plans_unique_active 
  on public.preventive_plans(empresa_id, tipo_equipamento, frequencia) 
  where ativo = true;

-- Indexes
create index if not exists idx_preventive_plans_empresa_id 
  on public.preventive_plans(empresa_id);

create index if not exists idx_preventive_plans_tipo_equipamento 
  on public.preventive_plans(tipo_equipamento);

create index if not exists idx_preventive_plans_empresa_tipo_ativo 
  on public.preventive_plans(empresa_id, tipo_equipamento, ativo);

create index if not exists idx_preventive_plans_frequencia 
  on public.preventive_plans(frequencia);

-- Comments
comment on table public.preventive_plans is 
  'Planos preventivos por tipo de equipamento e frequência. Define intervalo e janela para geração automática de OS preventivas.';

comment on column public.preventive_plans.tipo_equipamento is 
  'Tipo de equipamento (ELEVADOR_ELETRICO, ELEVADOR_HIDRAULICO, PLATAFORMA_VERTICAL, etc.)';

comment on column public.preventive_plans.frequencia is 
  'Frequência do plano: mensal, bimestral, trimestral, semestral, anual';

comment on column public.preventive_plans.intervalo_meses is 
  'Intervalo em meses entre cada OS preventiva';

comment on column public.preventive_plans.janela_dias is 
  'Janela em dias antes/depois da data programada para gerar a OS';

-- Enable RLS
alter table public.preventive_plans enable row level security;

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- SELECT: Usuários da mesma empresa ou elisha_admin
create policy "preventive_plans_select_same_empresa"
  on public.preventive_plans
  for select
  using (
    empresa_id = current_empresa_id() 
    or exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'elisha_admin'
    )
  );

-- INSERT: Usuários da mesma empresa ou elisha_admin
create policy "preventive_plans_insert_same_empresa"
  on public.preventive_plans
  for insert
  with check (
    empresa_id = current_empresa_id() 
    or exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'elisha_admin'
    )
  );

-- UPDATE: Usuários da mesma empresa ou elisha_admin
create policy "preventive_plans_update_same_empresa"
  on public.preventive_plans
  for update
  using (
    empresa_id = current_empresa_id() 
    or exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'elisha_admin'
    )
  );

-- DELETE: Apenas elisha_admin (planos não devem ser deletados, apenas desativados)
create policy "preventive_plans_delete_elisha_admin"
  on public.preventive_plans
  for delete
  using (
    exists (
      select 1 from public.profiles 
      where user_id = auth.uid() 
      and role = 'elisha_admin'
    )
  );

-- ============================================
-- 3. CREATE RPC FOR UPSERT PREVENTIVE PLANS
-- ============================================

create or replace function public.upsert_preventive_plan(
  p_empresa_id uuid,
  p_planos jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_tipo text;
  v_frequencia text;
  v_config jsonb;
  v_plan_id uuid;
  v_existing_id uuid;
begin
  -- Validate empresa_id
  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'Empresa não encontrada: %', p_empresa_id;
  end if;

  -- Loop through tipos de equipamento
  for v_tipo, v_config in 
    select key, value from jsonb_each(p_planos)
  loop
    -- Loop through frequencias do tipo
    for v_frequencia, v_config in 
      select key, value from jsonb_each(v_config)
    loop
      -- Check if plan already exists
      select id into v_existing_id
      from public.preventive_plans
      where empresa_id = p_empresa_id
        and tipo_equipamento = v_tipo
        and frequencia = v_frequencia
        and ativo = true
      limit 1;

      if v_existing_id is not null then
        -- Update existing plan
        update public.preventive_plans
        set
          intervalo_meses = (v_config->>'intervalo_meses')::integer,
          janela_dias = (v_config->>'janela_dias')::integer,
          updated_at = now()
        where id = v_existing_id
        returning id into v_plan_id;
      else
        -- Deactivate old plans for this tipo/frequencia (if any)
        update public.preventive_plans
        set ativo = false, updated_at = now()
        where empresa_id = p_empresa_id
          and tipo_equipamento = v_tipo
          and frequencia = v_frequencia
          and ativo = true;

        -- Insert new plan
        insert into public.preventive_plans (
          empresa_id,
          tipo_equipamento,
          frequencia,
          intervalo_meses,
          janela_dias,
          ativo
        ) values (
          p_empresa_id,
          v_tipo,
          v_frequencia,
          (v_config->>'intervalo_meses')::integer,
          (v_config->>'janela_dias')::integer,
          true
        )
        returning id into v_plan_id;
      end if;

      -- Add to result
      v_result := v_result || jsonb_build_object(
        'tipo_equipamento', v_tipo,
        'frequencia', v_frequencia,
        'plan_id', v_plan_id,
        'intervalo_meses', (v_config->>'intervalo_meses')::integer,
        'janela_dias', (v_config->>'janela_dias')::integer
      );
    end loop;
  end loop;

  return v_result;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.upsert_preventive_plan(uuid, jsonb) 
  to authenticated;

-- Comment
comment on function public.upsert_preventive_plan(uuid, jsonb) is 
  'Upsert planos preventivos por tipo de equipamento. Recebe objeto com estrutura: {tipo_equipamento: {frequencia: {intervalo_meses, janela_dias}}}. Desativa planos antigos e mantém apenas o mais recente ativo.';

-- ============================================
-- 4. HELPER FUNCTION: Get active plan
-- ============================================

create or replace function public.get_preventive_plan(
  p_empresa_id uuid,
  p_tipo_equipamento text,
  p_frequencia text
)
returns table (
  id uuid,
  intervalo_meses integer,
  janela_dias integer,
  ativo boolean
)
language plpgsql
security definer
stable
as $$
begin
  return query
  select 
    pp.id,
    pp.intervalo_meses,
    pp.janela_dias,
    pp.ativo
  from public.preventive_plans pp
  where pp.empresa_id = p_empresa_id
    and pp.tipo_equipamento = p_tipo_equipamento
    and pp.frequencia = p_frequencia
    and pp.ativo = true
  limit 1;
end;
$$;

-- Grant execute
grant execute on function public.get_preventive_plan(uuid, text, text) 
  to authenticated;

-- Comment
comment on function public.get_preventive_plan(uuid, text, text) is 
  'Retorna o plano preventivo ativo para um tipo de equipamento e frequência específicos.';

