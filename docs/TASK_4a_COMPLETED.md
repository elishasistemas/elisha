# ✅ Task 4a - Persistir Templates de Checklist por Tipo

## Status: ✅ COMPLETA

**Data de Conclusão:** 2025-11-06  
**Task do Plan.yaml:** `4a-salvar-templates-checklist`

---

## 📋 Objetivo

Salvar no banco os templates de checklist definidos em `data.checklist_templates` do `plan.yaml`, vinculando cada template ao tipo de equipamento (ELEVADOR_ELETRICO, ELEVADOR_HIDRAULICO, PLATAFORMA_VERTICAL).

---

## ✅ Implementações Realizadas

### 1. Migration: Adicionar campo `tipo_equipamento` ✅

**Arquivo**: `supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql`

**Mudanças**:
- Adicionado campo `tipo_equipamento` (text) na tabela `checklists`
- Criado índice `idx_checklists_tipo_equipamento`
- Criado índice composto `idx_checklists_empresa_tipo_equipamento_servico`
- Adicionado comentário explicativo

**Estrutura**:
```sql
alter table public.checklists
  add column if not exists tipo_equipamento text;
```

### 2. RPC: `upsert_checklist_templates_by_tipo()` ✅

**Função**: `public.upsert_checklist_templates_by_tipo(p_empresa_id uuid, p_templates jsonb)`

**Funcionalidades**:
- Recebe array de templates no formato JSONB
- Processa cada template e seus ciclos (mensal, trimestral, semestral, anual, bimestral)
- Converte itens de cada ciclo em formato `ChecklistItem` (ordem, secao, descricao, tipo, obrigatorio, critico, abnt_refs)
- Faz upsert (insere ou atualiza) templates existentes
- Incrementa versão ao atualizar template existente
- Retorna JSONB com resultado da operação

**Estrutura de entrada esperada**:
```json
[
  {
    "tipo_equipamento": "ELEVADOR_ELETRICO",
    "norma_base": ["NBR 16083", "NBR 16858-1"],
    "ciclos": {
      "mensal": {
        "itens": ["Item 1", "Item 2"]
      },
      "trimestral": {
        "itens": ["Item 3", "Item 4"]
      }
    }
  }
]
```

**Formato de saída**:
```json
[
  {
    "tipo_equipamento": "ELEVADOR_ELETRICO",
    "ciclo": "mensal",
    "checklist_id": "uuid",
    "itens_count": 9
  }
]
```

### 3. Script de Seed ✅

**Arquivo**: `scripts/seed_checklist_templates_by_tipo.sql`

**Funcionalidades**:
- Script SQL pronto para executar após aplicar a migration
- Contém todos os templates definidos no `plan.yaml`:
  - ELEVADOR_ELETRICO (mensal, trimestral, semestral, anual)
  - ELEVADOR_HIDRAULICO (mensal, bimestral, trimestral, semestral, anual)
  - PLATAFORMA_VERTICAL (mensal, bimestral, semestral)
- Query de verificação para listar templates criados

**Uso**:
```bash
# 1. Aplicar migration
supabase db push

# 2. Editar script e substituir UUID da empresa
# 3. Executar script
psql -f scripts/seed_checklist_templates_by_tipo.sql
```

---

## 🗄️ Estrutura de Dados

### Tabela `checklists` (atualizada)

```sql
CREATE TABLE public.checklists (
  id uuid PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  nome text NOT NULL,
  tipo_servico text NOT NULL,  -- 'preventiva', 'corretiva', etc.
  tipo_equipamento text,       -- NOVO: 'ELEVADOR_ELETRICO', 'ELEVADOR_HIDRAULICO', etc.
  itens jsonb NOT NULL,        -- Array de ChecklistItem
  versao integer NOT NULL DEFAULT 1,
  origem text NOT NULL DEFAULT 'custom',  -- 'abnt', 'custom', 'elisha'
  abnt_refs text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Índices Criados

```sql
-- Índice simples
CREATE INDEX idx_checklists_tipo_equipamento 
  ON public.checklists(tipo_equipamento);

-- Índice composto para queries eficientes
CREATE INDEX idx_checklists_empresa_tipo_equipamento_servico 
  ON public.checklists(empresa_id, tipo_equipamento, tipo_servico, ativo);
```

---

## 🎯 Templates Criados

### ELEVADOR_ELETRICO
- ✅ Preventiva - ELEVADOR_ELETRICO - Mensal (9 itens)
- ✅ Preventiva - ELEVADOR_ELETRICO - Trimestral (7 itens)
- ✅ Preventiva - ELEVADOR_ELETRICO - Semestral (4 itens)
- ✅ Preventiva - ELEVADOR_ELETRICO - Anual (2 itens)

**Normas**: NBR 16083, NBR 16858-1, NBR 16858-7, NM 313

### ELEVADOR_HIDRAULICO
- ✅ Preventiva - ELEVADOR_HIDRAULICO - Mensal (9 itens)
- ✅ Preventiva - ELEVADOR_HIDRAULICO - Bimestral (6 itens)
- ✅ Preventiva - ELEVADOR_HIDRAULICO - Trimestral (4 itens)
- ✅ Preventiva - ELEVADOR_HIDRAULICO - Semestral (5 itens)
- ✅ Preventiva - ELEVADOR_HIDRAULICO - Anual (2 itens)

**Normas**: NBR 16083, NBR 16858-2, NBR 16858-7, NM 313

### PLATAFORMA_VERTICAL
- ✅ Preventiva - PLATAFORMA_VERTICAL - Mensal (6 itens)
- ✅ Preventiva - PLATAFORMA_VERTICAL - Bimestral (4 itens)
- ✅ Preventiva - PLATAFORMA_VERTICAL - Semestral (4 itens)

**Normas**: NBR 9050, NBR ISO 9386-1

**Total**: 12 templates de checklist criados

---

## 🔐 Segurança (RLS)

A função `upsert_checklist_templates_by_tipo()` é `security definer`, o que significa:
- Executa com privilégios do criador da função
- Valida `empresa_id` antes de inserir/atualizar
- Respeita RLS da tabela `checklists` (já configurada)

**Grant**:
```sql
grant execute on function public.upsert_checklist_templates_by_tipo(uuid, jsonb) 
  to authenticated;
```

---

## 📝 Como Usar

### 1. Aplicar Migration

```bash
# Via Supabase CLI
supabase db push

# Ou executar SQL diretamente
psql -f supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql
```

### 2. Inserir Templates

```bash
# 1. Editar script e substituir UUID da empresa
vim scripts/seed_checklist_templates_by_tipo.sql

# 2. Executar script
psql -f scripts/seed_checklist_templates_by_tipo.sql
```

### 3. Verificar Templates Criados

```sql
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
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and origem = 'elisha'
  and tipo_equipamento is not null
order by tipo_equipamento, nome;
```

### 4. Usar Templates em Código

```typescript
// Buscar template por tipo de equipamento e ciclo
const { data: template } = await supabase
  .from('checklists')
  .select('*')
  .eq('empresa_id', empresaId)
  .eq('tipo_equipamento', 'ELEVADOR_ELETRICO')
  .eq('nome', 'Preventiva - ELEVADOR_ELETRICO - Mensal')
  .eq('tipo_servico', 'preventiva')
  .eq('ativo', true)
  .single()
```

---

## 🧪 Como Testar

### 1. Testar RPC

```sql
-- Testar inserção de templates
select public.upsert_checklist_templates_by_tipo(
  'SEU-UUID-AQUI'::uuid,
  '[
    {
      "tipo_equipamento": "ELEVADOR_ELETRICO",
      "norma_base": ["NBR 16083"],
      "ciclos": {
        "mensal": {
          "itens": ["Teste item 1", "Teste item 2"]
        }
      }
    }
  ]'::jsonb
);
```

### 2. Verificar Templates

```sql
-- Listar todos os templates por tipo
select 
  tipo_equipamento,
  count(*) as total_templates,
  sum(jsonb_array_length(itens)) as total_itens
from public.checklists
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and origem = 'elisha'
  and tipo_equipamento is not null
group by tipo_equipamento;
```

### 3. Testar Atualização

```sql
-- Executar novamente o seed (deve atualizar versão)
-- Verificar que versao incrementou
select nome, versao, updated_at
from public.checklists
where empresa_id = 'SEU-UUID-AQUI'::uuid
  and origem = 'elisha'
order by updated_at desc;
```

---

## ⚠️ Notas Importantes

1. **UUID da Empresa**: Sempre substituir `SUBSTITUA-PELO-UUID-DA-EMPRESA` no script de seed antes de executar.

2. **Versão**: Templates existentes terão versão incrementada ao serem atualizados.

3. **Origem**: Todos os templates criados têm `origem = 'elisha'` para identificação.

4. **Tipo de Serviço**: Todos os templates são do tipo `'preventiva'`.

5. **Formato de Itens**: Cada item do checklist é convertido para o formato `ChecklistItem`:
   - `ordem`: sequencial (1, 2, 3...)
   - `secao`: nome do ciclo (Mensal, Trimestral, etc.)
   - `descricao`: texto do item
   - `tipo`: 'boolean' (padrão)
   - `obrigatorio`: true (padrão)
   - `critico`: false (padrão)
   - `abnt_refs`: array de normas do template

---

## 🔄 Próximos Passos (Task 4b)

- Task 4b: Persistir planos preventivos por tipo
  - Criar tabela `maintenance_plans` ou `preventive_plans`
  - Salvar regras de agenda (intervalo_meses, janela_dias) por tipo
  - Criar RPC para upsert de planos

---

## ✅ Checklist de Conclusão

- [x] Migration criada para adicionar `tipo_equipamento`
- [x] RPC `upsert_checklist_templates_by_tipo()` criada
- [x] Script de seed criado com todos os templates
- [x] Índices criados para performance
- [x] Documentação criada
- [x] Templates prontos para uso

---

**Task 4a: ✅ COMPLETA**



