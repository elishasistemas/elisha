-- Script de Diagnóstico: Geração Automática de OS Preventivas
-- Execute este script no Supabase SQL Editor para diagnosticar problemas

-- ============================================
-- 1. VERIFICAR SE TRIGGER EXISTE
-- ============================================
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'trg_equipamentos_generate_preventive_os';

-- ============================================
-- 2. VERIFICAR SE FUNÇÕES EXISTEM
-- ============================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_next_preventive_date',
    'generate_preventive_os_for_equipment',
    'trg_generate_preventive_os_on_equipment',
    'os_preventive_rollforward'
  )
ORDER BY routine_name;

-- ============================================
-- 3. VERIFICAR PLANOS PREVENTIVOS CADASTRADOS
-- ============================================
SELECT 
  tipo_equipamento,
  frequencia,
  intervalo_meses,
  janela_dias,
  ativo,
  empresa_id
FROM public.preventive_plans
WHERE ativo = true
ORDER BY tipo_equipamento, frequencia;

-- ============================================
-- 4. VERIFICAR ÚLTIMOS EQUIPAMENTOS CADASTRADOS
-- ============================================
SELECT 
  e.id,
  e.nome,
  e.tipo,
  e.ativo,
  c.nome as cliente_nome,
  c.ativo as cliente_ativo,
  c.data_fim_contrato,
  e.created_at
FROM public.equipamentos e
INNER JOIN public.clientes c ON c.id = e.cliente_id
ORDER BY e.created_at DESC
LIMIT 10;

-- ============================================
-- 5. VERIFICAR SE HÁ OS PREVENTIVAS PARA OS EQUIPAMENTOS
-- ============================================
SELECT 
  e.id as equipamento_id,
  e.nome as equipamento_nome,
  e.tipo as tipo_equipamento,
  COUNT(os.id) as os_preventivas_count
FROM public.equipamentos e
LEFT JOIN public.ordens_servico os ON os.equipamento_id = e.id AND os.tipo = 'preventiva'
GROUP BY e.id, e.nome, e.tipo
ORDER BY e.created_at DESC
LIMIT 10;

-- ============================================
-- 6. TESTAR GERAÇÃO MANUAL (SUBSTITUA OS UUIDs)
-- ============================================
-- SELECT public.generate_preventive_os_for_equipment(
--   'SUBSTITUA-PELO-UUID-DA-EMPRESA'::uuid,
--   'SUBSTITUA-PELO-UUID-DO-CLIENTE'::uuid,
--   'SUBSTITUA-PELO-UUID-DO-EQUIPAMENTO'::uuid,
--   'ELEVADOR_ELETRICO' -- ou o tipo do equipamento
-- );

