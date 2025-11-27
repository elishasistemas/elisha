# 🐛 Bug Fix: Sistema de Convites

## ❌ **Problema Identificado**

O sistema de convites tinha 2 bugs críticos que impediam criar e visualizar convites:

### **Bug #1: create_invite bloqueando admins legítimos**
```
Error: "Not allowed: only admin can create invites for this empresa"
```

**Causa:** A função estava usando `profiles.id = auth.uid()`, mas:
- `auth.uid()` retorna o **user_id** (UUID da tabela auth.users)
- `profiles.id` é o **ID do profile** (diferente!)
- Resultado: nunca encontrava o usuário, bloqueava todos

### **Bug #2: Convites não apareciam para usuários anônimos**
```
Error: "The result contains 0 rows"
```

**Causa:** Mesmo problema na RLS policy - usava `profiles.id` em vez de `profiles.user_id`

---

## ✅ **Solução Aplicada**

Criei a migration `20251126000001_fix_invites_user_id.sql` que corrige:

### **1. Função create_invite**
```sql
-- ANTES (errado)
WHERE pr.id = auth.uid()

-- DEPOIS (correto)
WHERE pr.user_id = auth.uid()
```

### **2. RLS Policy invites_select_authenticated**
```sql
-- ANTES (errado)
WHERE p.id = auth.uid()

-- DEPOIS (correto)  
WHERE p.user_id = auth.uid()
```

### **3. RLS Policy invites_select_anonymous**
Adicionado filtro para não mostrar convites expirados:
```sql
USING (
  status = 'pending'
  AND expires_at > now()  -- ← NOVO
)
```

---

## 🚀 **Como Aplicar**

### **Ambiente DEV (teste primeiro):**
```bash
# 1. Acesse o SQL Editor
https://supabase.com/dashboard/project/tbxumetajqwnmbcqpfmr/sql/new

# 2. Cole o conteúdo da migration:
supabase/migrations/20251126000001_fix_invites_user_id.sql

# 3. Execute (Run)

# 4. Teste criar um convite
```

### **Ambiente PROD (após validar no DEV):**
```bash
# 1. Acesse o SQL Editor
https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/sql/new

# 2. Cole a mesma migration

# 3. Execute (Run)
```

---

## ✅ **Validação**

Após aplicar, teste:

### **Teste 1: Criar convite**
1. Login como admin
2. Ir em "Convidar colaborador"
3. Preencher email e role
4. **Esperado:** Convite criado com sucesso, link gerado

### **Teste 2: Visualizar convite (anônimo)**
1. Copiar o link do convite
2. Abrir em aba anônima / logout
3. Colar o link no navegador
4. **Esperado:** Página de signup carrega com dados do convite

---

## 📊 **Estrutura Correta**

### **Tabela profiles:**
```
id: UUID (PK, gerado automaticamente)
user_id: UUID (FK → auth.users.id) ← Este é o que auth.uid() retorna!
empresa_id: UUID
role: TEXT
...
```

### **Como auth.uid() funciona:**
```sql
auth.uid() → retorna user_id da sessão
           → corresponde a auth.users.id
           → corresponde a profiles.user_id (NÃO profiles.id!)
```

---

## 🎯 **Resultado**

Após aplicar esta migration:
- ✅ Admins conseguem criar convites
- ✅ Links de convite funcionam
- ✅ Usuários anônimos conseguem acessar signup via link
- ✅ Convites expirados não aparecem mais

---

## 📝 **Arquivos Relacionados**

- `supabase/migrations/20251126000001_fix_invites_user_id.sql` - Migration completa
- `fix-create-invite-user-id.sql` - Fix isolado da função (para referência)
- `fix-invites-rls-user-id.sql` - Fix isolado das policies (para referência)
- `debug-create-invite.sql` - Queries de debug (se precisar investigar)

---

## 🔍 **Como Identificar Este Bug no Futuro**

Se ver erros como:
- "Not allowed: only admin can create..."
- "The result contains 0 rows" (em queries com auth.uid())
- "User not found" (quando deveria estar logado)

**Verifique:** Você está usando `profiles.id` ou `profiles.user_id` com `auth.uid()`?

**Regra:** Sempre use `profiles.user_id = auth.uid()` ✅
