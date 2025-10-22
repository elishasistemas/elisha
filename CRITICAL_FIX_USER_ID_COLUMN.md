# 🚨 FIX CRÍTICO: Coluna user_id Não Existe

## ⚠️ ERRO ATUAL

```
Error: column profiles.user_id does not exist
Code: 42703
```

**Causa:**
- Migration `002_create_core_tables.sql` define coluna `user_id` ✅
- Mas no banco de dados a coluna **NÃO EXISTE** ❌
- Migration não foi aplicada ou foi aplicada incorretamente

---

## 🔍 Diagnóstico

### Verificar estrutura atual no banco:

```sql
-- Execute no Supabase SQL Editor
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Resultado esperado ATUAL (problema):**
```
id          | uuid    | NO  | gen_random_uuid()
empresa_id  | uuid    | YES | null
nome        | text    | YES | null
funcao      | text    | YES | null
role        | text    | NO  | 'tecnico'
created_at  | timestamp | NO | now()
updated_at  | timestamp | NO | now()
roles       | text[]  | NO  | '{}'
active_role | text    | YES | null
...
(SEM user_id ❌)
```

**Resultado esperado DEPOIS do fix:**
```
id          | uuid    | NO  | gen_random_uuid()
user_id     | uuid    | NO  | null  ← ADICIONADA!
empresa_id  | uuid    | YES | null
...
```

---

## ✅ SOLUÇÃO 1: Aplicar Migration (Recomendado)

### Passo 1: Verificar se coluna existe

```sql
-- Execute no Supabase SQL Editor
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
) as user_id_exists;
```

Se retornar `false`, continuar para Passo 2.

### Passo 2: Executar Migration Completa

**Copie e cole TODO o conteúdo abaixo no Supabase SQL Editor:**

```sql
-- ========================================
-- FIX: Adicionar coluna user_id
-- ========================================

-- 1. Adicionar coluna user_id
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Popular user_id com o valor do id
-- (assumindo que id é atualmente a FK para auth.users)
UPDATE public.profiles 
SET user_id = id
WHERE user_id IS NULL;

-- 3. Tornar coluna NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Adicionar constraint UNIQUE
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 5. Adicionar FK para auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 6. Criar índice
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

-- 7. Atualizar comentários
COMMENT ON COLUMN public.profiles.user_id IS 'FK para auth.users - ID do usuário';

-- ========================================
-- Verificação
-- ========================================

-- Verificar se foi criada
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'user_id')
ORDER BY column_name;

-- Verificar dados
SELECT 
  id,
  user_id,
  empresa_id,
  role,
  CASE 
    WHEN id = user_id THEN '✅ Consistente'
    ELSE '❌ Inconsistente'
  END as status
FROM public.profiles
LIMIT 10;
```

### Passo 3: Verificar Sucesso

Após executar, você deve ver:
```
✅ Column user_id added successfully
✅ 10 rows updated (ou quantos perfis existem)
```

---

## ✅ SOLUÇÃO 2: Reverter Código (Temporário)

Se não puder aplicar a migration agora, reverta o código para usar `id`:

```typescript
// src/app/api/admin/users/list/route.ts

// Reverter SELECT (remover user_id)
.select('id, empresa_id, role, nome, created_at')  // SEM user_id

// Reverter getUserById (usar id)
await supabase.auth.admin.getUserById(profile.id)  // Usar id, não user_id
```

**Mas isso NÃO resolve o problema real!** É apenas um workaround.

---

## 🎯 Entendendo o Problema

### Como DEVERIA ser (design correto):

```
profiles:
  id         → Chave primária do registro
  user_id    → FK para auth.users (ID do usuário)
  
auth.users:
  id         → ID do usuário
```

### Como ESTÁ atualmente (problema):

```
profiles:
  id         → Chave primária E FK para auth.users
  user_id    → ❌ NÃO EXISTE!
```

**Por que isso é um problema?**
- `id` está fazendo duplo papel (PK e FK)
- Código espera `user_id` como FK
- Migration não foi aplicada corretamente

---

## 🚀 EXECUTE AGORA (2 minutos)

### Checklist:

```
1. ✅ Abrir Supabase Dashboard
   https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz

2. ✅ SQL Editor

3. ✅ Copiar e colar query do "Passo 2" acima

4. ✅ Executar (Run)

5. ✅ Verificar mensagens de sucesso

6. ✅ Recarregar página /settings/users

7. ✅ Confirmar que usuários aparecem!
```

---

## 🔍 Debug: Por que a migration não foi aplicada?

**Possíveis causas:**

### 1. Migration nunca foi executada
```sql
-- Verificar histórico de migrations
SELECT * FROM supabase_migrations.schema_migrations
WHERE version LIKE '%002_create_core_tables%'
ORDER BY inserted_at DESC;
```

### 2. Tabela foi criada manualmente antes
Se a tabela já existia quando a migration rodou, o `CREATE TABLE IF NOT EXISTS` não adicionou a coluna.

### 3. Erro silencioso na migration
A migration falhou mas não foi reportado.

---

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Estado Atual):

**Estrutura:**
```sql
profiles (
  id uuid PRIMARY KEY,           ← PK e FK
  empresa_id uuid,
  role text,
  ...
)
```

**API:**
```typescript
getUserById(profile.user_id)    ❌ Erro: coluna não existe
```

### ✅ DEPOIS (Correto):

**Estrutura:**
```sql
profiles (
  id uuid PRIMARY KEY,           ← Apenas PK
  user_id uuid UNIQUE,           ← FK para auth.users
  empresa_id uuid,
  role text,
  ...
)
```

**API:**
```typescript
getUserById(profile.user_id)    ✅ Funciona!
```

---

## ⚠️ IMPORTANTE

**NÃO DELETE a tabela profiles!**

Se deletar, você perde:
- Todos os perfis de usuários
- Relacionamentos com empresas
- Configurações de roles

**A migration cuida disso preservando os dados!** ✅

---

## 🧪 Teste Após Aplicar

### 1. Verificar coluna existe:
```sql
SELECT user_id FROM public.profiles LIMIT 1;
```

Deve retornar um UUID (não erro).

### 2. Verificar dados consistentes:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(DISTINCT user_id) as users_unicos
FROM public.profiles;
```

Ambos devem ser iguais.

### 3. Testar API:
```
1. Recarregar /settings/users
2. Verificar console
3. Usuários devem aparecer ✅
```

---

## ✅ Status Atual

```
┌─────────────────────────────────────────────┐
│ 🚨 AÇÃO NECESSÁRIA                          │
├─────────────────────────────────────────────┤
│ Problema:    user_id não existe no banco ❌ │
│ Solução:     Migration criada ✅            │
│ Status:      AGUARDANDO EXECUÇÃO ⏳         │
│                                              │
│ EXECUTE A MIGRATION NO SUPABASE!            │
└─────────────────────────────────────────────┘
```

---

## 🔗 Links Úteis

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz
```

**SQL Editor:**
```
Dashboard → SQL Editor → New Query
```

---

## 📞 Se Encontrar Problemas

### Erro: "constraint already exists"
```sql
-- Remover constraint antiga primeiro
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_unique;

-- Depois executar migration novamente
```

### Erro: "foreign key violation"
```sql
-- Verificar perfis órfãos
SELECT p.* 
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE au.id IS NULL;

-- Deletar perfis órfãos (se necessário)
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);
```

---

**🚀 EXECUTE A MIGRATION AGORA E RECARREGUE A PÁGINA!** ✅

