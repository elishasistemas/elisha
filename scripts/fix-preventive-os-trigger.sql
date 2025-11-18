-- Script: Fix Preventive OS Trigger
-- Aplica as partes faltantes da migration 4c
-- 
-- IMPORTANTE: A função generate_preventive_os_for_equipment foi atualizada para criar
-- TODAS as OS preventivas (mensal, trimestral, semestral, anual) baseado no tipo de equipamento,
-- conforme as regras do plan.yaml, ao invés de depender dos planos preventivos cadastrados.

-- ============================================
-- 1. CRIAR FUNÇÃO os_preventive_rollforward (se não existir)
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
-- 2. VERIFICAR E RECRIAR TRIGGER
-- ============================================

-- Remover trigger existente (se houver)
drop trigger if exists trg_equipamentos_generate_preventive_os on public.equipamentos;

-- Criar trigger
create trigger trg_equipamentos_generate_preventive_os
  after insert on public.equipamentos
  for each row
  execute function public.trg_generate_preventive_os_on_equipment();

comment on trigger trg_equipamentos_generate_preventive_os on public.equipamentos is 
  'Gera OS preventivas automaticamente ao cadastrar um novo equipamento.';

-- ============================================
-- 3. VERIFICAR SE FUNÇÃO TRIGGER EXISTE
-- ============================================

-- Se a função não existir, criar
do $$
begin
  if not exists (
    select 1 from information_schema.routines 
    where routine_schema = 'public' 
      and routine_name = 'trg_generate_preventive_os_on_equipment'
  ) then
    raise notice 'Função trg_generate_preventive_os_on_equipment não existe. Execute a migration completa.';
  else
    raise notice 'Função trg_generate_preventive_os_on_equipment existe.';
  end if;
end $$;

-- ============================================
-- 4. VERIFICAR TRIGGER CRIADO
-- ============================================
select 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
from pg_trigger 
where tgname = 'trg_equipamentos_generate_preventive_os';

