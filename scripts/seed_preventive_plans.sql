-- Script: Seed Preventive Plans
-- Description: Insere planos preventivos por tipo de equipamento conforme definido no plan.yaml
-- Usage: Execute este script após aplicar a migration 20251106000001_create_preventive_plans.sql
-- 
-- IMPORTANTE: Substitua o UUID da empresa antes de executar!

-- ============================================
-- CONFIGURAÇÃO: Substitua pelo UUID da sua empresa
-- ============================================
\set empresa_id 'SUBSTITUA-PELO-UUID-DA-EMPRESA'

-- ============================================
-- PLANOS PREVENTIVOS POR TIPO DE EQUIPAMENTO
-- ============================================

-- Chamar a função RPC com os planos
select public.upsert_preventive_plan(
  :'empresa_id'::uuid,
  '{
    "ELEVADOR_ELETRICO": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 7},
      "trimestral": {"intervalo_meses": 3, "janela_dias": 14},
      "semestral": {"intervalo_meses": 6, "janela_dias": 14},
      "anual": {"intervalo_meses": 12, "janela_dias": 30}
    },
    "ELEVADOR_HIDRAULICO": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 7},
      "bimestral": {"intervalo_meses": 2, "janela_dias": 7},
      "trimestral": {"intervalo_meses": 3, "janela_dias": 14},
      "semestral": {"intervalo_meses": 6, "janela_dias": 14},
      "anual": {"intervalo_meses": 12, "janela_dias": 30}
    },
    "PLATAFORMA_VERTICAL": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 7},
      "bimestral": {"intervalo_meses": 2, "janela_dias": 7},
      "semestral": {"intervalo_meses": 6, "janela_dias": 14},
      "anual": {"intervalo_meses": 12, "janela_dias": 30}
    }
  }'::jsonb
) as resultado;

-- Verificar planos criados
select 
  id,
  tipo_equipamento,
  frequencia,
  intervalo_meses,
  janela_dias,
  ativo,
  created_at
from public.preventive_plans
where empresa_id = :'empresa_id'::uuid
  and ativo = true
order by tipo_equipamento, frequencia;

