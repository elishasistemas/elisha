# 🐛 DEBUG: Novo Usuário Não Aparece na Lista

## 🎯 Problema Relatado

**Sintoma:**
- Login funcionou ✅
- Usuário criou conta via convite ✅  
- Mas ao entrar na lista de técnicos (impersonando), o novo cadastro **NÃO** aparece ❌

---

## 🔍 Investigação

### 1. Estrutura da Tabela `profiles`

```sql
-- supabase/migrations/002_create_core_tables.sql (linha 38-47)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),      ← ID do registro (PK)
  user_id uuid not null unique references auth.users (id) on delete cascade, ← ID do auth
  empresa_id uuid references public.empresas (id) on delete set null,
  nome text,
  funcao text,
  role text not null default 'tecnico' check (role in ('admin', 'gestor', 'tecnico')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Importante:**
- `profiles.id` = UUID gerado automaticamente (chave primária do registro)
- `profiles.user_id` = UUID do usuário no `auth.users` (FK)
- **São colunas DIFERENTES!**

---

### 2. Função `accept_invite` (Criação do Profile)

```sql
-- supabase/migrations/001_create_invites_system.sql (linha 190-194)
insert into public.profiles (user_id, empresa_id, role, created_at)
values (v_user, v_invite.empresa_id, v_invite.role, now())
on conflict (user_id) do update 
set empresa_id = excluded.empresa_id, 
    role = excluded.role;
```

**Análise:**
- ✅ Insere `user_id` (correto!)
- ✅ Insere `empresa_id` (correto!)
- ✅ Insere `role` (correto!)
- ⚠️ **Mas não insere o `id`** (será gerado automaticamente)

---

### 3. API `/api/admin/users/list` (Busca de Usuários)

```typescript
// src/app/api/admin/users/list/route.ts (linha 35-39)
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, empresa_id, role, nome, created_at')  ← Seleciona 'id'
  .eq('empresa_id', empresaId)
  .order('created_at', { ascending: false })
```

**Problema identificado:**
- Seleciona apenas `id`, não `user_id` ❌

```typescript
// linha 50-66
const usersWithEmail = await Promise.all(
  (profiles || []).map(async (profile) => {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)
                                                                                        ↑
                                                                    ❌ ERRO AQUI!
```

**O problema:**
- `profile.id` = UUID do registro do profile (ex: `abc-123-def`)
- `profile.user_id` = UUID do usuário no auth (ex: `xyz-789-ghi`)
- API está usando `profile.id` para buscar no `auth.users` ❌
- **Deveria usar `profile.user_id`** ✅

---

## ✅ Solução

### Fix na API `/api/admin/users/list`

**Arquivo:** `src/app/api/admin/users/list/route.ts`

#### Mudança 1: Incluir `user_id` no SELECT
```typescript
// ❌ Antes (linha 35-39)
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, empresa_id, role, nome, created_at')
  .eq('empresa_id', empresaId)
  .order('created_at', { ascending: false })

// ✅ Depois
const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, user_id, empresa_id, role, nome, created_at')  ← Adicionar user_id
  .eq('empresa_id', empresaId)
  .order('created_at', { ascending: false })
```

#### Mudança 2: Usar `user_id` para buscar email
```typescript
// ❌ Antes (linha 52)
const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

// ✅ Depois
const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id)
```

---

## 🧪 Teste de Verificação

### Passo 1: Verificar se profile foi criado

```sql
-- No Supabase SQL Editor
SELECT 
  id,
  user_id,
  empresa_id,
  role,
  nome,
  created_at
FROM public.profiles
WHERE empresa_id = '<id-da-empresa-que-está-impersonando>'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- ✅ Deve mostrar o novo usuário criado

### Passo 2: Verificar auth.users

```sql
-- No Supabase SQL Editor  
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = '<email-do-convite>'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- ✅ Deve mostrar o usuário no auth
- ✅ `email_confirmed_at` deve estar preenchido (se desabilitou confirmação)

### Passo 3: Relacionar profile com auth

```sql
-- No Supabase SQL Editor
SELECT 
  p.id as profile_id,
  p.user_id,
  p.empresa_id,
  p.role,
  au.email,
  au.created_at as auth_created_at,
  p.created_at as profile_created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.user_id
WHERE p.empresa_id = '<id-da-empresa-que-está-impersonando>'
ORDER BY p.created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- ✅ Deve mostrar o relacionamento correto
- ✅ `p.user_id` = `au.id`

---

## 📊 Diagnóstico Completo

### Cenário 1: Profile não foi criado

**Sintomas:**
```sql
SELECT * FROM profiles WHERE user_id = '<user-id>';
-- Retorna 0 linhas ❌
```

**Causa:**
- Função `accept_invite` falhou
- Verificar logs do console no signup

**Solução:**
- Testar função `accept_invite` manualmente
- Verificar RLS policies

### Cenário 2: Profile foi criado mas API não retorna

**Sintomas:**
```sql
SELECT * FROM profiles WHERE empresa_id = '<empresa-id>';
-- Mostra o novo usuário ✅

-- Mas a interface não mostra ❌
```

**Causa:**
- API está usando `profile.id` ao invés de `profile.user_id` ❌
- Email não é encontrado no `auth.users`

**Solução:**
- **Aplicar fix descrito acima** ✅

### Cenário 3: Profile criado com empresa_id errada

**Sintomas:**
```sql
SELECT * FROM profiles WHERE user_id = '<user-id>';
-- Mostra profile com empresa_id diferente ❌
```

**Causa:**
- Convite foi criado para empresa errada
- Bug na função `accept_invite`

**Solução:**
- Verificar `invites.empresa_id`
- Atualizar profile manualmente se necessário

---

## ✅ Aplicar Fix Agora

Vou corrigir o arquivo agora:

**Arquivo:** `src/app/api/admin/users/list/route.ts`

**Mudanças:**
1. ✅ Adicionar `user_id` no SELECT
2. ✅ Usar `profile.user_id` ao buscar email no auth
3. ✅ Adicionar logs de debug

---

## 🚨 Ação Imediata

Depois do fix:
1. **Recarregar** a página de usuários
2. **Verificar** se novo usuário aparece
3. **Testar** criação de novo usuário
4. **Confirmar** email aparece corretamente

---

**Status:** Identificado e pronto para correção! 🔧

