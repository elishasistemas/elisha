# 🔧 Fix: Trigger de Geração Automática de OS Preventivas

## Problema

Ao cadastrar um equipamento, as OS preventivas não são criadas automaticamente.

---

## ✅ Solução Rápida

Execute este script no Supabase SQL Editor:

**Arquivo:** `scripts/fix-preventive-os-trigger.sql`

Ou copie e cole o conteúdo abaixo:

```sql
-- 1. Criar função os_preventive_rollforward (se não existir)
-- (conteúdo do arquivo fix-preventive-os-trigger.sql)

-- 2. Recriar trigger
DROP TRIGGER IF EXISTS trg_equipamentos_generate_preventive_os ON public.equipamentos;

CREATE TRIGGER trg_equipamentos_generate_preventive_os
  AFTER INSERT ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_generate_preventive_os_on_equipment();
```

---

## 🔍 Verificação

Após executar o script, verifique:

```sql
-- Verificar trigger
SELECT 
  tgname,
  tgrelid::regclass,
  tgenabled
FROM pg_trigger 
WHERE tgname = 'trg_equipamentos_generate_preventive_os';

-- Deve retornar:
-- trigger_name: trg_equipamentos_generate_preventive_os
-- table_name: equipamentos
-- enabled: O (Enabled)
```

---

## 🧪 Teste

1. **Cadastrar novo equipamento** via UI
2. **Verificar se OS foram criadas:**

```sql
SELECT 
  os.id,
  os.numero_os,
  os.tipo,
  os.status,
  os.data_programada,
  e.nome as equipamento_nome
FROM public.ordens_servico os
INNER JOIN public.equipamentos e ON e.id = os.equipamento_id
WHERE os.tipo = 'preventiva'
  AND os.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY os.created_at DESC;
```

---

## 📋 Checklist

- [ ] Função `trg_generate_preventive_os_on_equipment()` existe?
- [ ] Trigger `trg_equipamentos_generate_preventive_os` existe e está ativo?
- [ ] Há planos preventivos cadastrados para o tipo de equipamento?
- [ ] Cliente está ativo?
- [ ] Tipo de equipamento corresponde a um plano preventivo?

---

## 🚀 Gerar OS para Equipamentos Existentes

Se você já tem equipamentos cadastrados e quer gerar OS preventivas para eles:

```sql
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

**Arquivo:** `scripts/fix-preventive-os-trigger.sql`

