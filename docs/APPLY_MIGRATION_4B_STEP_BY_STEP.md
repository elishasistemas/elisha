# 🚀 Guia Passo a Passo: Aplicar Migration 4b

## Migration: `20251106000001_create_preventive_plans.sql`

**Status Atual:** ⚠️ Aplicação parcial detectada (tabela existe, mas função RPC pode estar faltando)

---

## 📋 Passo 1: Acessar Supabase Dashboard

1. Abra: https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new
2. Certifique-se de estar no projeto correto (dev branch)

---

## 📋 Passo 2: Copiar e Colar SQL

Copie o conteúdo completo do arquivo:
```bash
cat supabase/migrations/20251106000001_create_preventive_plans.sql
```

Ou abra o arquivo diretamente no editor e copie todo o conteúdo.

---

## 📋 Passo 3: Executar no SQL Editor

1. Cole o SQL completo no editor
2. Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)
3. Aguarde a execução completar

---

## 📋 Passo 4: Verificar Aplicação

Execute estas queries no SQL Editor para verificar:

```sql
-- 1. Verificar tabela
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'preventive_plans';

-- 2. Verificar colunas
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'preventive_plans'
ORDER BY ordinal_position;

-- 3. Verificar função upsert_preventive_plan
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'upsert_preventive_plan';

-- 4. Verificar função get_preventive_plan
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_preventive_plan';

-- 5. Verificar índices
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'preventive_plans';

-- 6. Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'preventive_plans';
```

**Resultado Esperado:**
- ✅ Tabela `preventive_plans` existe com 9 colunas
- ✅ Função `upsert_preventive_plan` existe (tipo: FUNCTION, retorna: jsonb)
- ✅ Função `get_preventive_plan` existe (tipo: FUNCTION, retorna: TABLE)
- ✅ 5 índices criados (incluindo índice parcial único)
- ✅ 4 políticas RLS criadas

---

## 📋 Passo 5: Testar RPC (Opcional)

```sql
-- Testar função upsert_preventive_plan
-- Substitua pelo UUID da sua empresa
SELECT public.upsert_preventive_plan(
  'SEU-UUID-AQUI'::uuid,
  '{
    "ELEVADOR_ELETRICO": {
      "mensal": {"intervalo_meses": 1, "janela_dias": 7}
    }
  }'::jsonb
);

-- Testar função get_preventive_plan
SELECT * FROM public.get_preventive_plan(
  'SEU-UUID-AQUI'::uuid,
  'ELEVADOR_ELETRICO',
  'mensal'
);
```

---

## ✅ Verificação Final

Após aplicar, execute o script de verificação:

```bash
export $(grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.development | xargs)
npx tsx scripts/verify-migration-4b.ts
```

**Resultado Esperado:**
```
✅ Tabela preventive_plans: ✅
✅ Função upsert_preventive_plan: ✅
✅ Função get_preventive_plan: ✅
✅ Índices: ✅

Progresso: 4/4 verificações passaram
✨ Migration 4b foi APLICADA com sucesso!
```

---

## 🎯 Próximos Passos Após Aplicar

1. ✅ Migration aplicada
2. ⏭️ (Opcional) Executar seed de planos:
   ```bash
   npx tsx scripts/seed-preventive-plans.ts <empresa_id>
   ```
3. 🎯 Prosseguir para Tarefa 4c: Geração automática de OS preventivas

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"
- ✅ Normal! A migration usa `IF NOT EXISTS` e `CREATE OR REPLACE`
- Pode executar novamente sem problemas

### Erro: "permission denied"
- Verifique se está usando SERVICE_ROLE_KEY ou usuário com permissões adequadas
- Tente executar no SQL Editor do Dashboard (tem permissões completas)

### Função não aparece após criar
- Aguarde alguns segundos e recarregue o schema cache
- Execute `SELECT pg_get_functiondef('public.upsert_preventive_plan'::regproc);` para verificar

---

**Arquivo da migration:** `supabase/migrations/20251106000001_create_preventive_plans.sql`

