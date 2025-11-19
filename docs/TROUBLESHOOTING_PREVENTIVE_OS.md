# 🔧 Troubleshooting: Geração Automática de OS Preventivas

## Problema: OS preventivas não são criadas ao cadastrar equipamento

---

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar se Migration foi Aplicada

Execute no SQL Editor do Supabase:

```sql
-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_next_preventive_date',
    'generate_preventive_os_for_equipment',
    'trg_generate_preventive_os_on_equipment',
    'os_preventive_rollforward'
  );

-- Verificar trigger
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger 
WHERE tgname = 'trg_equipamentos_generate_preventive_os';
```

**Se não existir:**
- Aplicar migration: `supabase/migrations/20251106000002_create_preventive_os_generation.sql`

---

### 2. Verificar se há Planos Preventivos Cadastrados

```sql
SELECT 
  tipo_equipamento,
  frequencia,
  intervalo_meses,
  janela_dias,
  ativo
FROM public.preventive_plans
WHERE ativo = true;
```

**Se não houver planos:**
- Executar seed: `npx tsx scripts/seed-preventive-plans.ts <empresa_id>`

---

### 3. Verificar se Cliente está Ativo

```sql
SELECT 
  id,
  nome,
  ativo,
  data_fim_contrato,
  CASE 
    WHEN ativo = false THEN 'Cliente inativo'
    WHEN data_fim_contrato IS NOT NULL AND data_fim_contrato < current_date THEN 'Contrato vencido'
    ELSE 'Cliente ativo'
  END as status
FROM public.clientes
WHERE id = 'UUID-DO-CLIENTE';
```

**Se cliente inativo ou contrato vencido:**
- Ativar cliente: `UPDATE clientes SET ativo = true WHERE id = '...'`
- Atualizar data_fim_contrato se necessário

---

### 4. Verificar Tipo de Equipamento

```sql
SELECT 
  id,
  nome,
  tipo,
  ativo
FROM public.equipamentos
WHERE id = 'UUID-DO-EQUIPAMENTO';
```

**Verificar:**
- `tipo` deve corresponder a um tipo em `preventive_plans.tipo_equipamento`
- Tipos válidos: `ELEVADOR_ELETRICO`, `ELEVADOR_HIDRAULICO`, `PLATAFORMA_VERTICAL`
- `ativo` deve ser `true`

---

### 5. Testar Geração Manual

```sql
SELECT public.generate_preventive_os_for_equipment(
  'UUID-EMPRESA'::uuid,
  'UUID-CLIENTE'::uuid,
  'UUID-EQUIPAMENTO'::uuid,
  'ELEVADOR_ELETRICO' -- ou o tipo do equipamento
);
```

**Se funcionar manualmente mas não automático:**
- O trigger pode não estar ativo ou não foi criado

---

### 6. Recriar Trigger (se necessário)

```sql
-- Remover trigger existente
DROP TRIGGER IF EXISTS trg_equipamentos_generate_preventive_os ON public.equipamentos;

-- Recriar trigger
CREATE TRIGGER trg_equipamentos_generate_preventive_os
  AFTER INSERT ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_generate_preventive_os_on_equipment();
```

---

## 🎯 Checklist Rápido

- [ ] Migration 4c aplicada?
- [ ] Funções RPC criadas?
- [ ] Trigger criado e ativo?
- [ ] Planos preventivos cadastrados para o tipo de equipamento?
- [ ] Cliente está ativo (`ativo = true`)?
- [ ] Contrato não vencido (`data_fim_contrato IS NULL OR data_fim_contrato >= current_date`)?
- [ ] Tipo de equipamento corresponde a um plano preventivo?

---

## 🚀 Solução Rápida

Se nada funcionar, execute este script completo:

```sql
-- 1. Verificar e recriar trigger
DROP TRIGGER IF EXISTS trg_equipamentos_generate_preventive_os ON public.equipamentos;

CREATE TRIGGER trg_equipamentos_generate_preventive_os
  AFTER INSERT ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_generate_preventive_os_on_equipment();

-- 2. Gerar OS manualmente para equipamentos existentes sem OS
DO $$
DECLARE
  v_equipamento RECORD;
BEGIN
  FOR v_equipamento IN
    SELECT DISTINCT
      e.id as equipamento_id,
      e.cliente_id,
      e.empresa_id,
      e.tipo as tipo_equipamento
    FROM public.equipamentos e
    INNER JOIN public.clientes c ON c.id = e.cliente_id
    WHERE e.ativo = true
      AND c.ativo = true
      AND (c.data_fim_contrato IS NULL OR c.data_fim_contrato >= current_date)
      AND NOT EXISTS (
        SELECT 1 
        FROM public.ordens_servico os
        WHERE os.equipamento_id = e.id
          AND os.tipo = 'preventiva'
      )
  LOOP
    PERFORM public.generate_preventive_os_for_equipment(
      v_equipamento.empresa_id,
      v_equipamento.cliente_id,
      v_equipamento.equipamento_id,
      v_equipamento.tipo_equipamento
    );
  END LOOP;
END $$;
```

---

**Arquivo de diagnóstico:** `scripts/diagnose-preventive-os-generation.sql`

