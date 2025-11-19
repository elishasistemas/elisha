-- Migration: Create Preventive OS Generation System
-- Version: 1.0.0
-- Description: Sistema de geração automática de OS preventivas baseado em planos preventivos

-- ============================================
-- 1. HELPER FUNCTION: Calculate next preventive date
-- ============================================

create or replace function public.calculate_next_preventive_date(
  p_base_date date,
  p_intervalo_meses integer,
  p_janela_dias integer
)
returns date
language plpgsql
immutable
as $$
declare
  v_target_date date;
  v_start_window date;
  v_end_window date;
begin
  -- Calculate target date (base_date + intervalo_meses)
  v_target_date := p_base_date + (p_intervalo_meses || ' months')::interval;
  
  -- Calculate window (target_date ± janela_dias)
  v_start_window := v_target_date - (p_janela_dias || ' days')::interval;
  v_end_window := v_target_date + (p_janela_dias || ' days')::interval;
  
  -- Return first date within window
  -- If today is before window start, return window start
  -- If today is within window, return today
  -- If today is after window end, return target_date (next cycle)
  if current_date < v_start_window then
    return v_start_window;
  elsif current_date between v_start_window and v_end_window then
    return current_date;
  else
    -- After window, return target_date for next cycle
    return v_target_date;
  end if;
end;
$$;

comment on function public.calculate_next_preventive_date(date, integer, integer) is 
  'Calcula a próxima data para OS preventiva baseado em data base, intervalo em meses e janela em dias.';

-- ============================================
-- 2. RPC: Generate preventive OS for equipment
-- ============================================

create or replace function public.generate_preventive_os_for_equipment(
  p_empresa_id uuid,
  p_cliente_id uuid,
  p_equipamento_id uuid,
  p_tipo_equipamento text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_plan record;
  v_os_id uuid;
  v_data_programada date;
  v_base_date date := current_date;
  v_checklist_id uuid;
  v_os_count integer := 0;
  v_frequencias text[];
  v_freq text;
  v_intervalo_meses integer;
  v_janela_dias integer;
begin
  -- Validate inputs
  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'Empresa não encontrada: %', p_empresa_id;
  end if;

  if not exists (select 1 from public.clientes where id = p_cliente_id and empresa_id = p_empresa_id) then
    raise exception 'Cliente não encontrado ou não pertence à empresa';
  end if;

  if not exists (select 1 from public.equipamentos where id = p_equipamento_id and cliente_id = p_cliente_id) then
    raise exception 'Equipamento não encontrado ou não pertence ao cliente';
  end if;

  -- Check if cliente is active
  if not exists (
    select 1 from public.clientes 
    where id = p_cliente_id 
    and ativo = true
    and (data_fim_contrato is null or data_fim_contrato >= current_date)
  ) then
    -- Cliente inativo, skip generation
    return jsonb_build_object(
      'success', false,
      'message', 'Cliente inativo ou contrato vencido',
      'os_created', 0
    );
  end if;

  -- Definir frequências baseadas no tipo de equipamento (conforme plan.yaml)
  -- ELEVADOR_ELETRICO: mensal, trimestral, semestral, anual
  -- ELEVADOR_HIDRAULICO: mensal, bimestral, trimestral, semestral, anual
  -- PLATAFORMA_VERTICAL: mensal, bimestral, semestral, anual
  case p_tipo_equipamento
    when 'ELEVADOR_ELETRICO' then
      v_frequencias := ARRAY['mensal', 'trimestral', 'semestral', 'anual'];
    when 'ELEVADOR_HIDRAULICO' then
      v_frequencias := ARRAY['mensal', 'bimestral', 'trimestral', 'semestral', 'anual'];
    when 'PLATAFORMA_VERTICAL' then
      v_frequencias := ARRAY['mensal', 'bimestral', 'semestral', 'anual'];
    else
      -- Tipo desconhecido, tentar usar planos preventivos como fallback
      v_frequencias := ARRAY[]::text[];
  end case;

  -- Se não há frequências definidas, usar planos preventivos como fallback
  if array_length(v_frequencias, 1) is null then
    for v_plan in
      select 
        frequencia,
        intervalo_meses,
        janela_dias
      from public.preventive_plans
      where empresa_id = p_empresa_id
        and tipo_equipamento = p_tipo_equipamento
        and ativo = true
      order by intervalo_meses asc
    loop
      v_frequencias := array_append(v_frequencias, v_plan.frequencia);
    end loop;
  end if;

  -- Loop através das frequências definidas
  foreach v_freq in array v_frequencias
  loop
    -- Definir intervalo_meses e janela_dias baseado na frequência (conforme plan.yaml)
    case 
      when v_freq = 'mensal' then
        v_intervalo_meses := 1;
        v_janela_dias := 7;
      when v_freq = 'bimestral' then
        v_intervalo_meses := 2;
        v_janela_dias := 7;
      when v_freq = 'trimestral' then
        v_intervalo_meses := 3;
        v_janela_dias := 14;
      when v_freq = 'semestral' then
        v_intervalo_meses := 6;
        v_janela_dias := 14;
      when v_freq = 'anual' then
        v_intervalo_meses := 12;
        v_janela_dias := 30;
      else
        continue; -- Frequência desconhecida, pular
    end case;
    -- Calculate next preventive date
    v_data_programada := public.calculate_next_preventive_date(
      v_base_date,
      v_intervalo_meses,
      v_janela_dias
    );

    -- Check if OS already exists for this equipment + frequencia + data_programada
    if exists (
      select 1 
      from public.ordens_servico
      where equipamento_id = p_equipamento_id
        and tipo = 'preventiva'
        and data_programada = v_data_programada
        and status not in ('cancelado', 'concluido')
    ) then
      -- OS already exists, skip
      continue;
    end if;

    -- Find checklist template for this tipo_equipamento and frequencia
    -- Try to find template matching tipo_equipamento and frequencia
    select id into v_checklist_id
    from public.checklists
    where empresa_id = p_empresa_id
      and tipo_servico = 'preventiva'
      and tipo_equipamento = p_tipo_equipamento
      and nome ilike '%' || v_freq || '%'
      and ativo = true
    order by created_at desc
    limit 1;

    -- If not found, try to find any preventive template for this tipo_equipamento
    if v_checklist_id is null then
      select id into v_checklist_id
      from public.checklists
      where empresa_id = p_empresa_id
        and tipo_servico = 'preventiva'
        and tipo_equipamento = p_tipo_equipamento
        and ativo = true
      order by created_at desc
      limit 1;
    end if;

    -- Create OS preventiva
    insert into public.ordens_servico (
      empresa_id,
      cliente_id,
      equipamento_id,
      tipo,
      status,
      prioridade,
      data_abertura,
      data_programada,
      tecnico_id,
      observacoes
    ) values (
      p_empresa_id,
      p_cliente_id,
      p_equipamento_id,
      'preventiva',
      'novo',
      'media',
      current_timestamp,
      v_data_programada,
      null, -- No technician assigned by default
      format('OS preventiva gerada automaticamente - Frequência: %s', v_freq)
    )
    returning id into v_os_id;

    v_os_count := v_os_count + 1;

    -- If checklist template found, create snapshot
    if v_checklist_id is not null then
      -- Create checklist snapshot
      insert into public.os_checklists (
        os_id,
        checklist_id,
        template_snapshot,
        empresa_id
      )
      select 
        v_os_id,
        c.id,
        jsonb_build_object(
          'id', c.id,
          'nome', c.nome,
          'tipo_servico', c.tipo_servico,
          'versao', c.versao,
          'itens', c.itens
        ),
        c.empresa_id
      from public.checklists c
      where c.id = v_checklist_id
      on conflict do nothing;

      -- Pre-populate responses (only if not already exists)
      insert into public.checklist_respostas (
        os_checklist_id,
        os_id,
        item_ordem,
        descricao,
        status_item
      )
      select 
        oc.id,
        v_os_id,
        (item->>'ordem')::integer,
        item->>'descricao',
        'pendente'
      from public.os_checklists oc
      cross join lateral jsonb_array_elements(oc.template_snapshot->'itens') as item
      where oc.os_id = v_os_id
        and not exists (
          select 1 
          from public.checklist_respostas cr
          where cr.os_checklist_id = oc.id
            and cr.item_ordem = (item->>'ordem')::integer
        );
    end if;

    -- Add to result
    v_result := v_result || jsonb_build_object(
      'os_id', v_os_id,
      'frequencia', v_freq,
      'data_programada', v_data_programada,
      'checklist_id', v_checklist_id
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'message', format('Geradas %s OS preventivas', v_os_count),
    'os_created', v_os_count,
    'os_list', v_result
  );
end;
$$;

-- Grant execute
grant execute on function public.generate_preventive_os_for_equipment(uuid, uuid, uuid, text) 
  to authenticated;

comment on function public.generate_preventive_os_for_equipment(uuid, uuid, uuid, text) is 
  'Gera OS preventivas automaticamente para um equipamento baseado nos planos preventivos ativos. Retorna lista de OS criadas.';

-- ============================================
-- 3. TRIGGER FUNCTION: On equipment insert
-- ============================================

create or replace function public.trg_generate_preventive_os_on_equipment()
returns trigger
language plpgsql
security definer
as $$
declare
  v_cliente_id uuid;
  v_empresa_id uuid;
  v_result jsonb;
begin
  -- Get cliente_id and empresa_id from equipment
  select cliente_id, empresa_id 
  into v_cliente_id, v_empresa_id
  from public.equipamentos
  where id = new.id;

  if v_cliente_id is null or v_empresa_id is null then
    return new;
  end if;

  -- Check if cliente is active
  if exists (
    select 1 from public.clientes 
    where id = v_cliente_id 
    and ativo = true
    and (data_fim_contrato is null or data_fim_contrato >= current_date)
  ) then
    -- Generate preventive OS
    select public.generate_preventive_os_for_equipment(
      v_empresa_id,
      v_cliente_id,
      new.id,
      new.tipo
    ) into v_result;
  end if;

  return new;
end;
$$;

comment on function public.trg_generate_preventive_os_on_equipment() is 
  'Trigger function que gera OS preventivas automaticamente ao inserir um novo equipamento.';

-- ============================================
-- 4. CREATE TRIGGER: After insert on equipamentos
-- ============================================

drop trigger if exists trg_equipamentos_generate_preventive_os on public.equipamentos;

create trigger trg_equipamentos_generate_preventive_os
  after insert on public.equipamentos
  for each row
  execute function public.trg_generate_preventive_os_on_equipment();

comment on trigger trg_equipamentos_generate_preventive_os on public.equipamentos is 
  'Gera OS preventivas automaticamente ao cadastrar um novo equipamento.';

-- ============================================
-- 5. RPC: Rollforward preventive OS (for recurring job)
-- ============================================

create or replace function public.os_preventive_rollforward()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_equipamento record;
  v_os_count integer := 0;
  v_total_os integer := 0;
  v_result_item jsonb;
begin
  -- Loop through all active equipments with active clients
  for v_equipamento in
    select distinct
      e.id as equipamento_id,
      e.cliente_id,
      e.empresa_id,
      e.tipo as tipo_equipamento
    from public.equipamentos e
    inner join public.clientes c on c.id = e.cliente_id
    where c.ativo = true
      and (c.data_fim_contrato is null or c.data_fim_contrato >= current_date)
      and e.ativo = true
  loop
    -- Check if there are any future preventive OS for this equipment
    -- If not, generate next cycle
    if not exists (
      select 1
      from public.ordens_servico
      where equipamento_id = v_equipamento.equipamento_id
        and tipo = 'preventiva'
        and data_programada > current_date
        and status not in ('cancelado', 'concluido')
    ) then
      -- Generate preventive OS for this equipment
      select public.generate_preventive_os_for_equipment(
        v_equipamento.empresa_id,
        v_equipamento.cliente_id,
        v_equipamento.equipamento_id,
        v_equipamento.tipo_equipamento
      ) into v_result_item;

      if (v_result_item->>'success')::boolean then
        v_os_count := (v_result_item->>'os_created')::integer;
        v_total_os := v_total_os + v_os_count;
        
        v_result := v_result || jsonb_build_object(
          'equipamento_id', v_equipamento.equipamento_id,
          'os_created', v_os_count,
          'details', v_result_item
        );
      end if;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'message', format('Rollforward concluído: %s OS geradas', v_total_os),
    'total_os_created', v_total_os,
    'equipamentos_processed', jsonb_array_length(v_result),
    'details', v_result
  );
end;
$$;

-- Grant execute
grant execute on function public.os_preventive_rollforward() 
  to authenticated;

comment on function public.os_preventive_rollforward() is 
  'Job recorrente que gera próximas OS preventivas para equipamentos de clientes ativos quando não há OS futuras. Deve ser executado mensalmente.';

-- ============================================
-- 6. SETUP PG_CRON (if extension available)
-- ============================================

-- Try to enable pg_cron extension (may fail if not available)
do $$
begin
  create extension if not exists pg_cron;
exception
  when others then
    -- Extension not available, skip
    null;
end $$;

-- Schedule monthly job (if pg_cron is available)
do $$
begin
  -- Remove existing job if exists
  perform cron.unschedule('os_preventive_rollforward_monthly');
  
  -- Schedule monthly job (1st day of month at 2 AM)
  perform cron.schedule(
    'os_preventive_rollforward_monthly',
    '0 2 1 * *', -- Cron: minute=0, hour=2, day=1, month=*, weekday=*
    'select public.os_preventive_rollforward()'
  );
exception
  when others then
    -- pg_cron not available or permission denied, skip
    -- Job can be scheduled manually via Supabase Dashboard or Edge Function
    null;
end $$;

