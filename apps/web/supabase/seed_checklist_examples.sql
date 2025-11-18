-- Seed: Checklist Examples
-- Exemplos de templates de checklist para teste

-- ==================================================
-- IMPORTANTE: Substitua os UUIDs pelos da sua empresa
-- ==================================================

-- Exemplo 1: Manutenção Preventiva - Completa
INSERT INTO public.checklists (
  empresa_id,
  nome,
  tipo_servico,
  versao,
  origem,
  abnt_refs,
  ativo,
  itens
) VALUES (
  'SUBSTITUA-PELO-UUID-DA-EMPRESA',
  'Manutenção Preventiva - Elevador Completo',
  'preventiva',
  1,
  'custom',
  ARRAY['NBR 16083', 'NBR 5666'],
  true,
  '[
    {
      "ordem": 1,
      "secao": "Segurança",
      "descricao": "Verificar desenergização do equipamento antes do início dos trabalhos",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083 - Item 5.2"],
      "evidencias": {
        "fotos_min": 1
      }
    },
    {
      "ordem": 2,
      "secao": "Segurança",
      "descricao": "Conferir uso de EPIs adequados (capacete, luvas, calçado de segurança)",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NR-18"]
    },
    {
      "ordem": 3,
      "secao": "Inspeção Visual",
      "descricao": "Estado geral da cabine (portas, painéis, iluminação)",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 4,
      "secao": "Inspeção Visual",
      "descricao": "Condição dos cabos de tração",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083 - Item 6.4"]
    },
    {
      "ordem": 5,
      "secao": "Medições Elétricas",
      "descricao": "Medição da corrente do motor principal",
      "tipo": "leitura",
      "obrigatorio": true,
      "critico": false,
      "unidade": "A",
      "intervalo_permitido": [0, 50],
      "evidencias": {
        "fotos_min": 1
      }
    },
    {
      "ordem": 6,
      "secao": "Medições Elétricas",
      "descricao": "Tensão de alimentação trifásica",
      "tipo": "leitura",
      "obrigatorio": true,
      "critico": true,
      "unidade": "V",
      "intervalo_permitido": [380, 440]
    },
    {
      "ordem": 7,
      "secao": "Lubrificação",
      "descricao": "Lubrificação das guias e patins",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 8,
      "secao": "Documentação",
      "descricao": "Foto do painel de comando",
      "tipo": "photo",
      "obrigatorio": true,
      "critico": false,
      "evidencias": {
        "fotos_min": 2
      }
    },
    {
      "ordem": 9,
      "secao": "Documentação",
      "descricao": "Foto da casa de máquinas",
      "tipo": "photo",
      "obrigatorio": true,
      "critico": false,
      "evidencias": {
        "fotos_min": 2
      }
    },
    {
      "ordem": 10,
      "secao": "Finalização",
      "descricao": "Assinatura do técnico responsável",
      "tipo": "signature",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 11,
      "secao": "Finalização",
      "descricao": "Observações gerais e recomendações",
      "tipo": "text",
      "obrigatorio": false,
      "critico": false
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Exemplo 2: Manutenção Corretiva - Simplificada
INSERT INTO public.checklists (
  empresa_id,
  nome,
  tipo_servico,
  versao,
  origem,
  abnt_refs,
  ativo,
  itens
) VALUES (
  'SUBSTITUA-PELO-UUID-DA-EMPRESA',
  'Manutenção Corretiva - Chamado',
  'corretiva',
  1,
  'custom',
  ARRAY['NBR 16083'],
  true,
  '[
    {
      "ordem": 1,
      "secao": "Identificação",
      "descricao": "Descrição do problema relatado",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 2,
      "secao": "Identificação",
      "descricao": "Equipamento desenergizado",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 3,
      "secao": "Diagnóstico",
      "descricao": "Causa identificada do problema",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 4,
      "secao": "Intervenção",
      "descricao": "Ações corretivas realizadas",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 5,
      "secao": "Intervenção",
      "descricao": "Foto da peça/componente substituído",
      "tipo": "photo",
      "obrigatorio": false,
      "critico": false,
      "evidencias": {
        "fotos_min": 1
      }
    },
    {
      "ordem": 6,
      "secao": "Teste",
      "descricao": "Equipamento testado e funcionando",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 7,
      "secao": "Finalização",
      "descricao": "Assinatura do cliente (recebimento do serviço)",
      "tipo": "signature",
      "obrigatorio": true,
      "critico": true
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Exemplo 3: Inspeção ABNT NBR 16083 (Segurança)
INSERT INTO public.checklists (
  empresa_id,
  nome,
  tipo_servico,
  versao,
  origem,
  abnt_refs,
  ativo,
  itens
) VALUES (
  'SUBSTITUA-PELO-UUID-DA-EMPRESA',
  'Inspeção de Segurança - NBR 16083',
  'preventiva',
  1,
  'abnt',
  ARRAY['NBR 16083:2012'],
  true,
  '[
    {
      "ordem": 1,
      "secao": "5.2 Requisitos de Segurança",
      "descricao": "Travamento eletromecânico das portas de pavimento",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083:2012 - 5.2.1"]
    },
    {
      "ordem": 2,
      "secao": "5.2 Requisitos de Segurança",
      "descricao": "Dispositivo de limitação de velocidade funcionando",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083:2012 - 5.2.3"]
    },
    {
      "ordem": 3,
      "secao": "5.2 Requisitos de Segurança",
      "descricao": "Para-quedas em condições adequadas",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083:2012 - 5.2.4"]
    },
    {
      "ordem": 4,
      "secao": "6.3 Máquina de Tração",
      "descricao": "Estado dos freios de segurança",
      "tipo": "text",
      "obrigatorio": true,
      "critico": true,
      "abnt_refs": ["NBR 16083:2012 - 6.3.2"]
    },
    {
      "ordem": 5,
      "secao": "6.4 Suspensão da Cabina",
      "descricao": "Número de arames rompidos em cada cabo",
      "tipo": "number",
      "obrigatorio": true,
      "critico": true,
      "unidade": "arames",
      "intervalo_permitido": [0, 5],
      "abnt_refs": ["NBR 16083:2012 - 6.4.1"]
    },
    {
      "ordem": 6,
      "secao": "6.4 Suspensão da Cabina",
      "descricao": "Fotos dos cabos de suspensão",
      "tipo": "photo",
      "obrigatorio": true,
      "critico": true,
      "evidencias": {
        "fotos_min": 3
      }
    },
    {
      "ordem": 7,
      "secao": "7.2 Casa de Máquinas",
      "descricao": "Ventilação adequada da casa de máquinas",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": false,
      "abnt_refs": ["NBR 16083:2012 - 7.2.3"]
    },
    {
      "ordem": 8,
      "secao": "8.5 Iluminação",
      "descricao": "Iluminação de emergência da cabina funcionando",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": false,
      "abnt_refs": ["NBR 16083:2012 - 8.5.2"]
    },
    {
      "ordem": 9,
      "secao": "Certificação",
      "descricao": "Assinatura digital do inspetor credenciado",
      "tipo": "signature",
      "obrigatorio": true,
      "critico": true
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Exemplo 4: Checklist Rápido - Chamado Emergencial
INSERT INTO public.checklists (
  empresa_id,
  nome,
  tipo_servico,
  versao,
  origem,
  abnt_refs,
  ativo,
  itens
) VALUES (
  'SUBSTITUA-PELO-UUID-DA-EMPRESA',
  'Atendimento Emergencial - Resgate',
  'emergencial',
  1,
  'elisha',
  ARRAY[],
  true,
  '[
    {
      "ordem": 1,
      "secao": "Atendimento",
      "descricao": "Há pessoas presas na cabina?",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 2,
      "secao": "Atendimento",
      "descricao": "Número de pessoas na cabina",
      "tipo": "number",
      "obrigatorio": true,
      "critico": true,
      "unidade": "pessoas"
    },
    {
      "ordem": 3,
      "secao": "Atendimento",
      "descricao": "Andar onde a cabina está parada",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 4,
      "secao": "Resgate",
      "descricao": "Manobra de resgate executada com sucesso",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 5,
      "secao": "Resgate",
      "descricao": "Tempo total de resgate (minutos)",
      "tipo": "number",
      "obrigatorio": true,
      "critico": false,
      "unidade": "min"
    },
    {
      "ordem": 6,
      "secao": "Causa",
      "descricao": "Causa provável da parada",
      "tipo": "text",
      "obrigatorio": true,
      "critico": false
    },
    {
      "ordem": 7,
      "secao": "Finalização",
      "descricao": "Equipamento liberado para uso",
      "tipo": "boolean",
      "obrigatorio": true,
      "critico": true
    },
    {
      "ordem": 8,
      "secao": "Finalização",
      "descricao": "Assinatura do responsável do condomínio/cliente",
      "tipo": "signature",
      "obrigatorio": true,
      "critico": true
    }
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- ==================================================
-- VERIFICAÇÃO
-- ==================================================

DO $$
DECLARE
  template_count integer;
BEGIN
  SELECT COUNT(*) INTO template_count FROM public.checklists;
  RAISE NOTICE '✅ Seed de templates de checklist concluído!';
  RAISE NOTICE 'Total de templates criados: %', template_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE: Substitua "SUBSTITUA-PELO-UUID-DA-EMPRESA" pelo UUID real da sua empresa';
  RAISE NOTICE '';
  RAISE NOTICE 'Para obter o UUID da empresa:';
  RAISE NOTICE '  SELECT id, nome FROM public.empresas LIMIT 1;';
END $$;

