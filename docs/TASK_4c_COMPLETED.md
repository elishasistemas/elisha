# ✅ Task 4c - Geração Automática de OS Preventivas

## Status: ✅ COMPLETA

**Data de Conclusão:** 2025-11-06  
**Task do Plan.yaml:** `4c-auto-geracao-os-preventivas`

---

## 📋 Objetivo

Implementar sistema de geração automática de OS preventivas:
1. Ao cadastrar equipamento → gerar OS preventivas baseadas nos planos
2. Job recorrente mensal → gerar próximas OS para clientes ativos
3. Vincular checklist template automaticamente ao criar OS

---

## ✅ Implementações Realizadas

### 1. Helper Function: `calculate_next_preventive_date()` ✅

**Arquivo**: `supabase/migrations/20251106000002_create_preventive_os_generation.sql`

**Funcionalidade**:
- Calcula próxima data para OS preventiva
- Baseado em: data base, intervalo em meses, janela em dias
- Retorna primeira data útil dentro da janela

**Lógica**:
```sql
target_date = base_date + intervalo_meses
start_window = target_date - janela_dias
end_window = target_date + janela_dias

Se hoje < start_window → retorna start_window
Se hoje entre start_window e end_window → retorna hoje
Se hoje > end_window → retorna target_date (próximo ciclo)
```

### 2. RPC: `generate_preventive_os_for_equipment()` ✅

**Função**: `public.generate_preventive_os_for_equipment(p_empresa_id uuid, p_cliente_id uuid, p_equipamento_id uuid, p_tipo_equipamento text)`

**Funcionalidades**:
- Valida empresa, cliente e equipamento
- Verifica se cliente está ativo (ativo=true e contrato não vencido)
- Busca todos os planos preventivos ativos para o tipo de equipamento
- Para cada plano:
  - Calcula próxima data usando `calculate_next_preventive_date()`
  - Verifica se OS já existe (evita duplicatas)
  - Cria OS preventiva com:
    - `tipo = 'preventiva'`
    - `status = 'novo'`
    - `prioridade = 'media'`
    - `tecnico_id = null` (sem técnico atribuído)
    - `data_programada` calculada
  - Busca checklist template por tipo_equipamento e frequência
  - Cria snapshot do checklist (se template encontrado)
  - Pré-popula respostas como 'pendente'

**Retorno**:
```json
{
  "success": true,
  "message": "Geradas N OS preventivas",
  "os_created": N,
  "os_list": [
    {
      "os_id": "uuid",
      "frequencia": "mensal",
      "data_programada": "2025-12-01",
      "checklist_id": "uuid"
    }
  ]
}
```

### 3. Trigger: `trg_equipamentos_generate_preventive_os` ✅

**Função**: `public.trg_generate_preventive_os_on_equipment()`

**Funcionalidade**:
- Executado AFTER INSERT em `equipamentos`
- Chama `generate_preventive_os_for_equipment()` automaticamente
- Gera OS preventivas ao cadastrar novo equipamento

**Trigger**:
```sql
CREATE TRIGGER trg_equipamentos_generate_preventive_os
  AFTER INSERT ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_generate_preventive_os_on_equipment();
```

### 4. RPC: `os_preventive_rollforward()` ✅

**Função**: `public.os_preventive_rollforward()`

**Funcionalidade**:
- Job recorrente para gerar próximas OS preventivas
- Processa todos os equipamentos de clientes ativos
- Para cada equipamento:
  - Verifica se já existe OS preventiva futura
  - Se não existir, chama `generate_preventive_os_for_equipment()`
- Não reabre OS antigas (apenas cria futuras)

**Retorno**:
```json
{
  "success": true,
  "message": "Rollforward concluído: N OS geradas",
  "total_os_created": N,
  "equipamentos_processed": M,
  "details": [...]
}
```

### 5. Job Recorrente: pg_cron (Opcional) ✅

**Configuração**:
- Tenta habilitar extensão `pg_cron` (se disponível)
- Agenda job mensal: dia 1 de cada mês às 2h
- Cron: `0 2 1 * *`

**Nota**: Se `pg_cron` não estiver disponível, o job pode ser executado manualmente ou via Edge Function.

---

## 🗄️ Estrutura de Dados

### Funções Criadas

```sql
-- Helper: Calcula próxima data
CREATE FUNCTION calculate_next_preventive_date(
  p_base_date date,
  p_intervalo_meses integer,
  p_janela_dias integer
) RETURNS date;

-- RPC: Gera OS preventivas para equipamento
CREATE FUNCTION generate_preventive_os_for_equipment(
  p_empresa_id uuid,
  p_cliente_id uuid,
  p_equipamento_id uuid,
  p_tipo_equipamento text
) RETURNS jsonb;

-- Trigger function: Chamado ao inserir equipamento
CREATE FUNCTION trg_generate_preventive_os_on_equipment()
RETURNS trigger;

-- RPC: Job recorrente mensal
CREATE FUNCTION os_preventive_rollforward()
RETURNS jsonb;
```

### Triggers Criados

```sql
CREATE TRIGGER trg_equipamentos_generate_preventive_os
  AFTER INSERT ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_generate_preventive_os_on_equipment();
```

---

## 🎯 Fluxo de Funcionamento

### 1. Cadastro de Equipamento

```
1. Usuário cadastra equipamento via UI
2. INSERT em equipamentos
3. Trigger trg_equipamentos_generate_preventive_os executa
4. Busca planos preventivos ativos para tipo_equipamento
5. Para cada plano:
   - Calcula data_programada
   - Cria OS preventiva
   - Vincula checklist template (se encontrado)
6. Retorna lista de OS criadas
```

### 2. Job Recorrente Mensal

```
1. Job executa no dia 1 de cada mês às 2h
2. Busca todos equipamentos de clientes ativos
3. Para cada equipamento:
   - Verifica se há OS preventiva futura
   - Se não houver, gera próximas OS
4. Retorna resumo de OS geradas
```

---

## 🔐 Segurança

- Todas as funções são `security definer` (executam com privilégios do criador)
- Validações de empresa_id, cliente_id e equipamento_id
- Verificação de cliente ativo antes de gerar OS
- Respeita RLS das tabelas envolvidas

**Grants**:
```sql
grant execute on function public.generate_preventive_os_for_equipment(...) 
  to authenticated;

grant execute on function public.os_preventive_rollforward() 
  to authenticated;
```

---

## 📝 Como Usar

### 1. Aplicar Migration

```bash
# Via Supabase Dashboard SQL Editor
# https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new
# Copiar conteúdo de: supabase/migrations/20251106000002_create_preventive_os_generation.sql
```

### 2. Testar Geração Manual

```sql
-- Gerar OS preventivas para um equipamento específico
SELECT public.generate_preventive_os_for_equipment(
  'empresa_id'::uuid,
  'cliente_id'::uuid,
  'equipamento_id'::uuid,
  'ELEVADOR_ELETRICO'
);
```

### 3. Testar Trigger

```sql
-- Inserir novo equipamento (deve gerar OS automaticamente)
INSERT INTO public.equipamentos (
  empresa_id,
  cliente_id,
  nome,
  tipo,
  ativo
) VALUES (
  'empresa_id'::uuid,
  'cliente_id'::uuid,
  'Elevador Teste',
  'ELEVADOR_ELETRICO',
  true
);
```

### 4. Executar Job Recorrente Manualmente

```sql
-- Executar rollforward manualmente
SELECT public.os_preventive_rollforward();
```

---

## 🧪 Como Testar

### 1. Testar Cálculo de Data

```sql
-- Testar função de cálculo
SELECT public.calculate_next_preventive_date(
  current_date,
  1,  -- intervalo_meses
  7   -- janela_dias
);
```

### 2. Verificar OS Geradas

```sql
-- Listar OS preventivas geradas automaticamente
SELECT 
  id,
  numero_os,
  equipamento_id,
  tipo,
  status,
  data_programada,
  observacoes
FROM public.ordens_servico
WHERE tipo = 'preventiva'
  AND observacoes LIKE '%gerada automaticamente%'
ORDER BY data_programada;
```

### 3. Verificar Checklist Vinculado

```sql
-- Verificar se checklist foi vinculado
SELECT 
  os.id as os_id,
  os.numero_os,
  oc.id as checklist_id,
  oc.template_snapshot->>'nome' as checklist_nome,
  COUNT(cr.id) as respostas_count
FROM public.ordens_servico os
LEFT JOIN public.os_checklists oc ON oc.os_id = os.id
LEFT JOIN public.checklist_respostas cr ON cr.os_checklist_id = oc.id
WHERE os.tipo = 'preventiva'
  AND os.observacoes LIKE '%gerada automaticamente%'
GROUP BY os.id, os.numero_os, oc.id, oc.template_snapshot;
```

---

## ⚠️ Notas Importantes

1. **Cliente Ativo**: OS só são geradas se cliente está ativo (`ativo=true` e `data_fim_contrato` não vencido)

2. **Evita Duplicatas**: Verifica se OS já existe antes de criar (mesmo equipamento + data_programada)

3. **Checklist Template**: Tenta encontrar template por tipo_equipamento e frequência. Se não encontrar, tenta qualquer template preventivo do tipo.

4. **Sem Técnico**: OS são criadas sem técnico atribuído (`tecnico_id=null`). Técnico pode ser atribuído depois.

5. **Job Recorrente**: Se `pg_cron` não estiver disponível, pode ser executado manualmente ou via Edge Function agendada.

6. **Data Base**: Usa `current_date` como data base para cálculo. Pode ser ajustado para usar data de cadastro do equipamento.

---

## 🔄 Próximos Passos (Task 4d)

- Task 4d: Atribuição de técnico e reagendamento
  - UI para atribuir técnico à OS preventiva
  - UI para reagendar data_programada
  - RPCs para atualizar técnico e data

---

## ✅ Checklist de Conclusão

- [x] Função `calculate_next_preventive_date()` criada
- [x] RPC `generate_preventive_os_for_equipment()` criada
- [x] Trigger `trg_equipamentos_generate_preventive_os` criado
- [x] RPC `os_preventive_rollforward()` criada
- [x] Job recorrente configurado (pg_cron)
- [x] Vinculação automática de checklist template
- [x] Pré-população de respostas do checklist
- [x] Validações de cliente ativo
- [x] Prevenção de duplicatas
- [x] Documentação criada

---

**Task 4c: ✅ COMPLETA**

