-- Script: Seed Checklist Templates by Equipment Type
-- Description: Insere templates de checklist por tipo de equipamento conforme definido no plan.yaml
-- Usage: Execute este script após aplicar a migration 20251106000000_add_tipo_equipamento_to_checklists.sql
-- 
-- IMPORTANTE: Substitua o UUID da empresa antes de executar!

-- ============================================
-- CONFIGURAÇÃO: Substitua pelo UUID da sua empresa
-- ============================================
\set empresa_id 'SUBSTITUA-PELO-UUID-DA-EMPRESA'

-- ============================================
-- TEMPLATES DE CHECKLIST POR TIPO DE EQUIPAMENTO
-- ============================================

-- Chamar a função RPC com os templates
select public.upsert_checklist_templates_by_tipo(
  :'empresa_id'::uuid,
  '[
    {
      "tipo_equipamento": "ELEVADOR_ELETRICO",
      "norma_base": ["NBR 16083", "NBR 16858-1", "NBR 16858-7", "NM 313"],
      "ciclos": {
        "mensal": {
          "itens": [
            "Funcionamento das botoeiras de cabine",
            "Funcionamento das botoeiras de pavimento",
            "Iluminacao da cabine e ventilador",
            "Sistema de alarme e interfone",
            "Nivelamento entre andares dentro da tolerancia da norma",
            "Ausencia de ruidos, vibracoes ou trancos anormais",
            "Lubrificacao de guias",
            "Funcionamento das portas de pavimento e cabina",
            "Limpeza do poco"
          ]
        },
        "trimestral": {
          "itens": [
            "Limpeza de quadro de comando eletrico; conexoes firmes e aterramento correto",
            "Reaperto de conexoes e conferencias de aterramento",
            "Limpeza da casa de maquinas e conferencia de iluminacao",
            "Cabos de tracao e polias sem desgaste ou desfiamento",
            "Verificacao do limitador de velocidade e freio de emergencia",
            "Teste dos intertravamentos das portas de pavimento",
            "Limpeza de contatos de portas de pavimento"
          ]
        },
        "semestral": {
          "itens": [
            "Inspecao detalhada no operador de portas",
            "Limpeza e lubrificacao do operador de portas",
            "Verificacao da estrutura da cabine e contrapeso",
            "Teste dos dispositivos de parada e fim de curso"
          ]
        },
        "anual": {
          "itens": [
            "Ensaios de seguranca do freio de emergencia",
            "Auditoria anual de conformidade e emissao de relatorio tecnico"
          ]
        }
      }
    },
    {
      "tipo_equipamento": "ELEVADOR_HIDRAULICO",
      "norma_base": ["NBR 16083", "NBR 16858-2", "NBR 16858-7", "NM 313"],
      "ciclos": {
        "mensal": {
          "itens": [
            "Funcionamento das botoeiras de cabine",
            "Funcionamento das botoeiras de pavimento",
            "Iluminacao da cabine e ventilador",
            "Sistema de alarme e interfone",
            "Nivelamento entre andares dentro da tolerancia da norma",
            "Ausencia de ruidos, vibracoes ou trancos anormais",
            "Lubrificacao de guias",
            "Funcionamento das portas de pavimento e cabina",
            "Limpeza do poco"
          ]
        },
        "bimestral": {
          "itens": [
            "Nivel e qualidade do oleo hidraulico dentro da faixa",
            "Ausencia de vazamentos em mangueiras, conexoes e cilindros",
            "Bombas e valvulas sem ruido excessivo",
            "Funcionamento das botoeiras e alarmes de cabine",
            "Limpeza geral da casa de maquinas",
            "Teste do dispositivo de descida de emergencia"
          ]
        },
        "trimestral": {
          "itens": [
            "Inspecao detalhada no operador de portas",
            "Limpeza e lubrificacao do operador de portas",
            "Verificacao da estrutura da cabine e contrapeso",
            "Teste dos dispositivos de parada e fim de curso"
          ]
        },
        "semestral": {
          "itens": [
            "Verificacao do pistao quanto a corrosao ou empeno",
            "Inspecao estrutural do cilindro e guias do pistao",
            "Teste das valvulas de seguranca e travas hidraulicas",
            "Inspecao do quadro eletrico e aterramento",
            "Teste do sistema de parada e freio de seguranca"
          ]
        },
        "anual": {
          "itens": [
            "Ensaios de seguranca do freio de emergencia",
            "Auditoria anual de conformidade e emissao de relatorio tecnico"
          ]
        }
      }
    },
    {
      "tipo_equipamento": "PLATAFORMA_VERTICAL",
      "norma_base": ["NBR 9050", "NBR ISO 9386-1"],
      "ciclos": {
        "mensal": {
          "itens": [
            "Verificar comandos de subida e descida na cabine",
            "Verificar comandos de subida e descida no pavimento",
            "Testar botao de parada de emergencia e alarme sonoro",
            "Conferir estado estrutural: trincas, corrosao, fixacoes",
            "Conferir guarda-corpos e fechamento lateral ate 1,10 m",
            "Verificar sinalizacao visual e tatil conforme NBR 9050"
          ]
        },
        "bimestral": {
          "itens": [
            "Inspecionar sistema hidraulico: mangueiras, cilindros, conexoes",
            "Conferir nivel e contaminacao do fluido hidraulico",
            "Verificar comunicacao de auxilio: interfone ou botao",
            "Verificar nivelamento da plataforma em todos os andares"
          ]
        },
        "semestral": {
          "itens": [
            "Testar travas de seguranca e antiqueda",
            "Conferir freios, rodas ou estabilizadores quando aplicavel",
            "Verificar sinalizacao de area de embarque e desembarque",
            "Verificar aterramento e quadro eletrico"
          ]
        }
      }
    }
  ]'::jsonb
) as resultado;

-- Verificar templates criados
select 
  id,
  nome,
  tipo_equipamento,
  tipo_servico,
  jsonb_array_length(itens) as total_itens,
  abnt_refs,
  versao,
  ativo
from public.checklists
where empresa_id = :'empresa_id'::uuid
  and origem = 'elisha'
  and tipo_equipamento is not null
order by tipo_equipamento, nome;



