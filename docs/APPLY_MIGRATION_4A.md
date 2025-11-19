# 🚀 Como Aplicar a Migration 4a no Dev Branch

## Migration: `20251106000000_add_tipo_equipamento_to_checklists.sql`

Esta migration adiciona:
- ✅ Campo `tipo_equipamento` na tabela `checklists`
- ✅ Índices para performance
- ✅ RPC `upsert_checklist_templates_by_tipo()` para inserir templates

---

## 📋 Método 1: Supabase Dashboard (Recomendado)

### Passos:

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://app.supabase.com/project/ecvjgixhcfmkdfbnueqh/sql/new
   ```

2. **Copie o conteúdo completo da migration:**
   ```bash
   cat supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql
   ```

3. **Cole no SQL Editor e clique em "Run"**

4. **Verifique se foi aplicada:**
   ```sql
   -- Verificar coluna
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
     AND table_name = 'checklists' 
     AND column_name = 'tipo_equipamento';

   -- Verificar função
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
     AND routine_name = 'upsert_checklist_templates_by_tipo';
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
  -f supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql
```

---

## ✅ Verificação Pós-Migration

Execute estas queries para verificar:

```sql
-- 1. Verificar coluna criada
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'checklists' 
  AND column_name = 'tipo_equipamento';

-- 2. Verificar índices criados
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'checklists' 
  AND indexname LIKE '%tipo_equipamento%';

-- 3. Verificar função RPC criada
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'upsert_checklist_templates_by_tipo';

-- 4. Verificar permissões da função
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as granted_to
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_proc_acl a ON p.oid = a.oid
LEFT JOIN pg_roles r ON a.grantee = r.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'upsert_checklist_templates_by_tipo';
```

---

## 🎯 Próximos Passos Após Aplicar Migration

1. ✅ Migration aplicada
2. ⏭️ Executar seed de templates:
   ```bash
   npx tsx scripts/seed-checklist-templates.ts <empresa_id>
   ```

---

## 📝 Notas

- A migration é **idempotente** (pode ser executada múltiplas vezes sem erro)
- Usa `IF NOT EXISTS` para evitar erros se já aplicada
- A função RPC usa `CREATE OR REPLACE` para atualizar se já existir

---

**Arquivo da migration:** `supabase/migrations/20251106000000_add_tipo_equipamento_to_checklists.sql`



