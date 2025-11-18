# ✅ Task 4b - Persistir Planos Preventivos por Tipo

## Status: ✅ COMPLETA

**Data de Conclusão:** 2025-11-06  
**Task do Plan.yaml:** `4b-salvar-planos-preventivos`

---

## 📋 Objetivo

Criar tabela e RPCs para salvar regras de agenda por tipo de equipamento (intervalo_meses, janela_dias), conforme definido em `data.preventive_plan_rules` do `plan.yaml`.

---

## ✅ Implementações Realizadas

### 1. Migration: Criar tabela `preventive_plans` ✅

**Arquivo**: `supabase/migrations/20251106000001_create_preventive_plans.sql`

**Estrutura da Tabela**:
```sql
CREATE TABLE public.preventive_plans (
  id uuid PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  tipo_equipamento text NOT NULL,
  frequencia text NOT NULL, -- 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'
  intervalo_meses integer NOT NULL CHECK (intervalo_meses > 0),
  janela_dias integer NOT NULL CHECK (janela_dias > 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Índices Criados**:
- `idx_preventive_plans_empresa_id` - Para filtrar por empresa
- `idx_preventive_plans_tipo_equipamento` - Para filtrar por tipo
- `idx_preventive_plans_empresa_tipo_ativo` - Composto para queries eficientes
- `idx_preventive_plans_frequencia` - Para filtrar por frequência
- `idx_preventive_plans_unique_active` - **Índice parcial único**: garante apenas um plano ativo por empresa/tipo/frequência

**RLS Policies**:
- ✅ SELECT: Usuários da mesma empresa ou elisha_admin
- ✅ INSERT: Usuários da mesma empresa ou elisha_admin
- ✅ UPDATE: Usuários da mesma empresa ou elisha_admin
- ✅ DELETE: Apenas elisha_admin (planos devem ser desativados, não deletados)

### 2. RPC: `upsert_preventive_plan()` ✅

**Função**: `public.upsert_preventive_plan(p_empresa_id uuid, p_planos jsonb)`

**Funcionalidades**:
- Recebe objeto JSONB com estrutura: `{tipo_equipamento: {frequencia: {intervalo_meses, janela_dias}}}`
- Valida `empresa_id` antes de inserir/atualizar
- Desativa planos antigos automaticamente (mantém apenas o mais recente ativo)
- Faz upsert (insere novo ou atualiza existente)
- Retorna JSONB com resultado da operação

**Estrutura de entrada esperada**:
```json
{
  "ELEVADOR_ELETRICO": {
    "mensal": {"intervalo_meses": 1, "janela_dias": 7},
    "trimestral": {"intervalo_meses": 3, "janela_dias": 14}
  },
  "ELEVADOR_HIDRAULICO": {
    "mensal": {"intervalo_meses": 1, "janela_dias": 7},
    "bimestral": {"intervalo_meses": 2, "janela_dias": 7}
  }
}
```

**Formato de saída**:
```json
[
  {
    "tipo_equipamento": "ELEVADOR_ELETRICO",
    "frequencia": "mensal",
    "plan_id": "uuid",
    "intervalo_meses": 1,
    "janela_dias": 7
  }
]
```

### 3. Helper Function: `get_preventive_plan()` ✅

**Função**: `public.get_preventive_plan(p_empresa_id uuid, p_tipo_equipamento text, p_frequencia text)`

**Funcionalidades**:
- Retorna o plano preventivo ativo para um tipo e frequência específicos
- Útil para consultas rápidas durante geração de OS preventivas
- Retorna apenas planos ativos

### 4. Scripts de Seed ✅

**Arquivos**:
- `scripts/seed-preventive-plans.ts` - Script TypeScript usando Supabase client
- `scripts/seed_preventive_plans.sql` - Script SQL puro

**Planos Incluídos**:
- **ELEVADOR_ELETRICO**: mensal, trimestral, semestral, anual (4 planos)
- **ELEVADOR_HIDRAULICO**: mensal, bimestral, trimestral, semestral, anual (5 planos)
- **PLATAFORMA_VERTICAL**: mensal, bimestral, semestral, anual (4 planos)

**Total**: 13 planos preventivos

---

## 🗄️ Estrutura de Dados

### Tabela `preventive_plans`

```sql
CREATE TABLE public.preventive_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_equipamento text NOT NULL,
  frequencia text NOT NULL,
  intervalo_meses integer NOT NULL CHECK (intervalo_meses > 0),
  janela_dias integer NOT NULL CHECK (janela_dias > 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Índices Criados

```sql
-- Índices simples
CREATE INDEX idx_preventive_plans_empresa_id ON preventive_plans(empresa_id);
CREATE INDEX idx_preventive_plans_tipo_equipamento ON preventive_plans(tipo_equipamento);
CREATE INDEX idx_preventive_plans_frequencia ON preventive_plans(frequencia);

-- Índice composto
CREATE INDEX idx_preventive_plans_empresa_tipo_ativo 
  ON preventive_plans(empresa_id, tipo_equipamento, ativo);

-- Índice parcial único (garante apenas um plano ativo)
CREATE UNIQUE INDEX idx_preventive_plans_unique_active 
  ON preventive_plans(empresa_id, tipo_equipamento, frequencia) 
  WHERE ativo = true;
```

---

## 🎯 Planos Criados

### ELEVADOR_ELETRICO
- ✅ Mensal: 1 mês, janela 7 dias
- ✅ Trimestral: 3 meses, janela 14 dias
- ✅ Semestral: 6 meses, janela 14 dias
- ✅ Anual: 12 meses, janela 30 dias

### ELEVADOR_HIDRAULICO
- ✅ Mensal: 1 mês, janela 7 dias
- ✅ Bimestral: 2 meses, janela 7 dias
- ✅ Trimestral: 3 meses, janela 14 dias
- ✅ Semestral: 6 meses, janela 14 dias
- ✅ Anual: 12 meses, janela 30 dias

### PLATAFORMA_VERTICAL
- ✅ Mensal: 1 mês, janela 7 dias
- ✅ Bimestral: 2 meses, janela 7 dias
- ✅ Semestral: 6 meses, janela 14 dias
- ✅ Anual: 12 meses, janela 30 dias

**Total**: 13 planos preventivos criados

---

## 🔐 Segurança (RLS)

A função `upsert_preventive_plan()` é `security definer`, o que significa:
- Executa com privilégios do criador da função
- Valida `empresa_id` antes de inserir/atualizar
- Respeita RLS da tabela `preventive_plans` (já configurada)

**Grants**:
```sql
grant execute on function public.upsert_preventive_plan(uuid, jsonb) 
  to authenticated;

grant execute on function public.get_preventive_plan(uuid, text, text) 
  to authenticated;
```

---

## 📝 Como Usar

### 1. Aplicar Migration

```bash
# Via Supabase Dashboard SQL Editor
# https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new
# Copiar conteúdo de: supabase/migrations/20251106000001_create_preventive_plans.sql

# Ou via Supabase CLI (se linkado)
supabase db push
```

### 2. Inserir Planos

```bash
# Método 1: TypeScript
npx tsx scripts/seed-preventive-plans.ts <empresa_id>

# Método 2: SQL
# Editar script e substituir UUID da empresa
psql -f scripts/seed_preventive_plans.sql
```

### 3. Verificar Planos Criados

```sql
select 
  tipo_equipamento,
  frequencia,
  intervalo_meses,
  janela_dias,
  ativo,
  created_at
from public.preventive_plans
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and ativo = true
order by tipo_equipamento, frequencia;
```

### 4. Usar Planos em Código

```typescript
// Buscar plano específico
const { data: plan } = await supabase.rpc('get_preventive_plan', {
  p_empresa_id: empresaId,
  p_tipo_equipamento: 'ELEVADOR_ELETRICO',
  p_frequencia: 'mensal'
})

// Upsert planos
const { data: resultado } = await supabase.rpc('upsert_preventive_plan', {
  p_empresa_id: empresaId,
  p_planos: {
    ELEVADOR_ELETRICO: {
      mensal: { intervalo_meses: 1, janela_dias: 7 }
    }
  }
})
```

---

## 🧪 Como Testar

### 1. Testar RPC

```sql
-- Testar inserção de planos
select public.upsert_preventive_plan(
  'SEU-UUID-AQUI'::uuid,
  '{
    "ELEVADOR_ELETRICO": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 7}
    }
  }'::jsonb
);
```

### 2. Verificar Planos

```sql
-- Listar todos os planos por tipo
select 
  tipo_equipamento,
  count(*) as total_planos,
  string_agg(frequencia, ', ') as frequencias
from public.preventive_plans
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and ativo = true
group by tipo_equipamento;
```

### 3. Testar Helper Function

```sql
-- Buscar plano específico
select * from public.get_preventive_plan(
  'SEU-UUID-AQUI'::uuid,
  'ELEVADOR_ELETRICO',
  'mensal'
);
```

### 4. Testar Desativação Automática

```sql
-- Inserir novo plano (deve desativar o antigo)
select public.upsert_preventive_plan(
  'SEU-UUID-AQUI'::uuid,
  '{
    "ELEVADOR_ELETRICO": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 10}
    }
  }'::jsonb
);

-- Verificar que apenas um está ativo
select count(*) 
from public.preventive_plans
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and tipo_equipamento = 'ELEVADOR_ELETRICO'
  and frequencia = 'mensal'
  and ativo = true;
-- Deve retornar 1
```

---

## ⚠️ Notas Importantes

1. **UUID da Empresa**: Sempre substituir `SUBSTITUA-PELO-UUID-DA-EMPRESA` no script SQL antes de executar.

2. **Desativação Automática**: Ao inserir um novo plano para o mesmo tipo/frequência, o plano antigo é automaticamente desativado (não deletado).

3. **Índice Parcial Único**: Garante que apenas um plano ativo existe por empresa/tipo/frequência. Planos inativos podem existir em múltiplas versões.

4. **RLS**: Todas as políticas RLS verificam `empresa_id` e `is_elisha_admin()`.

5. **Validações**: 
   - `intervalo_meses` deve ser > 0
   - `janela_dias` deve ser > 0
   - `frequencia` deve ser uma das: mensal, bimestral, trimestral, semestral, anual

---

## 🔄 Próximos Passos (Task 4c)

- Task 4c: Geração automática de OS preventivas
  - Criar Edge Function `os_on_customer_equipment_created`
  - Criar trigger AFTER INSERT em `equipamentos`
  - Criar Job recorrente `os_preventive_rollforward`
  - Usar planos preventivos para calcular datas de OS

---

## ✅ Checklist de Conclusão

- [x] Migration criada para tabela `preventive_plans`
- [x] RPC `upsert_preventive_plan()` criada
- [x] Helper function `get_preventive_plan()` criada
- [x] Scripts de seed criados (SQL e TypeScript)
- [x] Índices criados para performance
- [x] Índice parcial único para garantir apenas um plano ativo
- [x] RLS policies aplicadas
- [x] Documentação criada

---

**Task 4b: ✅ COMPLETA**

