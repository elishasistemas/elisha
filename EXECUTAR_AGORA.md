# 🚨 EXECUTE ESTA SQL AGORA NO SUPABASE!

## ⚡ **PASSO A PASSO (2 minutos)**

### **1. Abrir Supabase SQL Editor**
```
https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/sql/new
```

### **2. COPIAR e COLAR este SQL:**

```sql
-- ========================================
-- FIX: Adicionar coluna user_id
-- ========================================

-- 1. Adicionar coluna user_id
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Popular user_id com o valor do id
UPDATE public.profiles 
SET user_id = id
WHERE user_id IS NULL;

-- 3. Tornar coluna NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Adicionar constraint UNIQUE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 5. Adicionar FK para auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Criar índice
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Verificar estrutura
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'user_id')
ORDER BY column_name;

-- Verificar dados (primeiros 5)
SELECT 
  id,
  user_id,
  empresa_id,
  role,
  nome,
  CASE 
    WHEN id = user_id THEN '✅ OK'
    ELSE '⚠️ Diferente'
  END as status
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

### **3. Clicar em "RUN" (ou Ctrl+Enter)**

### **4. Verificar Resultado**

**Você deve ver:**
```
SUCCESS
✅ ALTER TABLE
✅ UPDATE (X rows)
✅ Constraint added
✅ Index created
```

**E na verificação:**
```
column_name | data_type | is_nullable
------------|-----------|-------------
id          | uuid      | NO
user_id     | uuid      | NO
```

### **5. Recarregar a página `/settings/users`**

**Resultado esperado:**
- ✅ Sem erro 500
- ✅ Usuários aparecem na lista
- ✅ Emails carregados

---

## 📋 **Se der erro "user_id already exists"**

Se a coluna já existe mas está com problema, use este SQL alternativo:

```sql
-- Verificar se coluna existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'user_id';

-- Se retornar vazio, a coluna NÃO existe
-- Se retornar 'user_id', a coluna JÁ existe

-- Para recriar (apenas se necessário):
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_id CASCADE;
-- Depois execute o SQL principal acima
```

---

## ⏱️ **FAÇA AGORA!**

```
1. Abrir link do Supabase ✅
2. Colar SQL ✅
3. Clicar RUN ✅
4. Recarregar página ✅
5. SUCESSO! 🎉
```

---

## 🆘 **Se ainda der erro**

Me envie o resultado que apareceu após executar a SQL.

