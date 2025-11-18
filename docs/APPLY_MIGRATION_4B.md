# 🚀 Como Aplicar a Migration 4b no Dev Branch

## Migration: `20251106000001_create_preventive_plans.sql`

Esta migration cria:
- ✅ Tabela `preventive_plans` com RLS
- ✅ RPC `upsert_preventive_plan()` para inserir/atualizar planos
- ✅ Helper function `get_preventive_plan()` para consultas
- ✅ Índices para performance
- ✅ Índice parcial único para garantir apenas um plano ativo

---

## 📋 Método 1: Supabase Dashboard (Recomendado)

### Passos:

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new
   ```

2. **Copie o conteúdo completo da migration:**
   ```bash
   cat supabase/migrations/20251106000001_create_preventive_plans.sql
   ```

3. **Cole no SQL Editor e clique em "Run"**

4. **Verifique se foi aplicada:**
   ```sql
   -- Verificar tabela
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
     AND table_name = 'preventive_plans';

   -- Verificar função RPC
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name = 'upsert_preventive_plan';

   -- Verificar helper function
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name = 'get_preventive_plan';
   ```

---

## 📋 Método 2: Supabase CLI (Se projeto estiver linkado)

```bash
# 1. Verificar se está linkado
supabase projects list

# 2. Se não estiver, linkar o projeto
supabase link --project-ref ecvjgixhcfmkdfbnueqh

# 3. Aplicar migration
supabase db push
```

---

## 📋 Método 3: psql Direto (Se tiver acesso)

```bash
# 1. Obter connection string do Supabase Dashboard
# Settings > Database > Connection string > URI

# 2. Aplicar migration
psql "postgresql://postgres:[PASSWORD]@db.ecvjgixhcfmkdfbnueqh.supabase.co:5432/postgres" \
  -f supabase/migrations/20251106000001_create_preventive_plans.sql
```

---

## ✅ Verificação Pós-Migration

Execute estas queries para verificar:

```sql
-- 1. Verificar tabela criada
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'preventive_plans'
ORDER BY ordinal_position;

-- 2. Verificar índices criados
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'preventive_plans';

-- 3. Verificar função RPC criada
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('upsert_preventive_plan', 'get_preventive_plan');

-- 4. Verificar permissões das funções
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl a ON p.oid = a.oid
LEFT JOIN pg_roles r ON a.grantee = r.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('upsert_preventive_plan', 'get_preventive_plan');
```

---

## 🎯 Próximos Passos Após Aplicar Migration

1. ✅ Migration aplicada
2. ⏭️ Executar seed de planos (opcional):
   ```bash
   npx tsx scripts/seed-preventive-plans.ts <empresa_id>
   ```

---

## 📝 Notas

- A migration é **idempotente** (pode ser executada múltiplas vezes sem erro)
- Usa `IF NOT EXISTS` para evitar erros se já aplicada
- As funções RPC usam `CREATE OR REPLACE` para atualizar se já existirem
- O índice parcial único garante apenas um plano ativo por empresa/tipo/frequência

---

**Arquivo da migration:** `supabase/migrations/20251106000001_create_preventive_plans.sql`

