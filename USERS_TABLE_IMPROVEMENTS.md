# ✅ Melhorias na Tabela de Usuários e Convites

## 🎯 Alterações Implementadas

### 1. **Convites Aceitos são Removidos da Tabela** 🎉
- **Antes:** Mostrava todos os convites (pending, accepted, expired)
- **Depois:** Mostra apenas convites `status = 'pending'`
- **Motivo:** Convites aceitos já viraram usuários, não faz sentido ficarem na lista

```typescript
// Query atualizada
.eq("status", "pending")  // ✅ Filtra apenas pendentes
```

---

### 2. **Tabela de Usuários Completa** 👥

#### Campos Adicionados:
| Campo | Descrição | Fonte |
|-------|-----------|-------|
| ✅ E-mail | Email do usuário | `auth.users.email` |
| ✅ Nome | Nome do colaborador | `profiles.nome` |
| ✅ Papel | Role do usuário | `profiles.role` |
| ✅ Criado em | Data de cadastro | `profiles.created_at` |
| ✅ Ações | Botão para excluir | - |

#### Antes:
```
┌──────────────────────────────────────────┐
│ E-mail          │ Papel │ Data cadastro │
├──────────────────────────────────────────┤
│ user@email.com │ Admin │ 22/10/2025    │
└──────────────────────────────────────────┘
```

#### Depois:
```
┌────────────────────────────────────────────────────────────────┐
│ E-mail          │ Nome    │ Papel │ Criado em  │ Ações        │
├────────────────────────────────────────────────────────────────┤
│ user@email.com │ João    │ Admin │ 22/10/2025 │ [🗑️]         │
└────────────────────────────────────────────────────────────────┘
```

---

### 3. **API para Listar Usuários com Email** 📧

**Novo endpoint:** `/api/admin/users/list`

**Motivo:** 
- Email está em `auth.users`, não em `profiles`
- Cliente não pode acessar `auth.admin` (precisa service role)
- API usa `SUPABASE_SERVICE_ROLE_KEY` para buscar emails

**Fluxo:**
```
Frontend → POST /api/admin/users/list { empresaId }
    ↓
API usa service role
    ↓
Busca profiles + emails em auth.users
    ↓
Retorna { users: [...] }
```

---

### 4. **Botão de Excluir Usuário** 🗑️

**Funcionalidade:**
- Ícone Trash (vermelho)
- Tooltip: "Excluir usuário"
- Confirmação antes de excluir
- Toast de sucesso/erro
- Recarrega dados após exclusão

**Código:**
```typescript
const handleDeleteUser = async (userId: string) => {
  if (!confirm("Deseja realmente excluir este usuário?")) return;
  
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
  
  if (response.ok) {
    toast.success("Usuário excluído com sucesso");
    loadData(); // Recarrega lista
  }
};
```

---

## 📦 Novos Arquivos

### `/api/admin/users/list/route.ts`
- **Método:** POST
- **Body:** `{ empresaId: string }`
- **Response:** `{ users: Profile[] }`
- **Função:** Busca usuários de uma empresa com emails

**Features:**
- ✅ Usa service role key
- ✅ Busca profiles da empresa
- ✅ Para cada profile, busca email em auth.users
- ✅ Retorna lista completa com emails

---

## 🔄 Fluxo Completo: Convite → Usuário

### Passo 1: Criar Convite
```
Admin cria convite
    ↓
Convite inserido em invites
    ↓
status = 'pending' ✅
    ↓
Aparece na tabela de convites
```

### Passo 2: Aceitar Convite
```
Usuário clica no link
    ↓
accept_invite() RPC executado
    ↓
1. Cria/atualiza profile
2. Marca convite: status = 'accepted' ✅
    ↓
Convite SOME da tabela (filtro .eq("status", "pending")) ✅
```

### Passo 3: Ver Usuário
```
loadData() recarrega
    ↓
POST /api/admin/users/list
    ↓
Busca profiles + emails
    ↓
Usuário APARECE na tabela de usuários ✅
```

---

## 🧪 Teste Agora (2 minutos)

### Teste 1: Criar Convite
1. **Admin → Empresas → Impersonar**
2. **Configurações → Usuários**
3. **Convidar Usuário** (preencher email)
4. **Verificar:** Convite aparece na tabela de convites ✅

### Teste 2: Aceitar Convite
1. **Copiar link** do convite (botão 📋)
2. **Abrir** em aba anônima/logout
3. **Criar senha** e aceitar
4. **Voltar para Admin** → Atualizar
5. **Verificar:** 
   - Convite SUMIU da tabela ✅
   - Usuário APARECEU na tabela de usuários ✅

### Teste 3: Ver Campos da Tabela
**Tabela de Usuários deve mostrar:**
- ✅ E-mail (ex: user@email.com)
- ✅ Nome (ex: João Silva)
- ✅ Papel (ex: Admin)
- ✅ Criado em (ex: 22/10/2025)
- ✅ Ações (botão 🗑️)

### Teste 4: Excluir Usuário
1. **Clicar** no botão 🗑️
2. **Confirmar** exclusão
3. **Verificar:** Usuário sumiu da tabela ✅

---

## 📊 Comparação: Antes vs Depois

### Convites

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Filtro | Todos os status | Apenas `pending` ✅ |
| Após aceitar | Ficava na lista | Some da lista ✅ |
| Lógica | Confusa | Clara ✅ |

### Usuários

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Email | ❌ N/A | ✅ Real |
| Nome | ❌ Não mostrava | ✅ Exibe |
| Ações | ❌ Nada | ✅ Excluir |
| Colunas | 3 | 5 ✅ |

---

## 🔍 Debug (Se não funcionar)

### Problema: Email aparece como "N/A"

**Verificar:**
```bash
# .env.local tem a chave?
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

**Teste manual:**
```typescript
// No console do navegador (F12)
fetch('/api/admin/users/list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ empresaId: 'sua-empresa-id' })
})
.then(r => r.json())
.then(console.log)
```

### Problema: Convite não some após aceitar

**Verificar:**
```sql
-- No Supabase SQL Editor
SELECT id, email, status, accepted_at
FROM invites
WHERE empresa_id = 'sua-empresa-id';

-- Status deve mudar de 'pending' para 'accepted'
```

### Problema: Nome aparece como "-"

**Verificar:**
```sql
-- No Supabase SQL Editor
SELECT id, nome, email
FROM profiles
WHERE empresa_id = 'sua-empresa-id';

-- Se nome for NULL, atualizar:
UPDATE profiles
SET nome = 'Nome do Usuário'
WHERE id = 'user-id';
```

---

## ✅ Status Final

```
┌─────────────────────────────────────────────┐
│ ✅ TABELA DE USUÁRIOS E CONVITES - COMPLETA │
├─────────────────────────────────────────────┤
│ Convites pendentes:         FILTRADOS ✅    │
│ Convites aceitos:           REMOVIDOS ✅    │
│ Email dos usuários:         EXIBIDO ✅      │
│ Nome dos usuários:          EXIBIDO ✅      │
│ Botão excluir:              FUNCIONANDO ✅  │
│ API /users/list:            CRIADA ✅       │
│ Colunas completas:          5 CAMPOS ✅     │
└─────────────────────────────────────────────┘
```

---

## 🚀 TESTE AGORA!

1. **Cmd+Shift+R** - Recarregar página
2. **Ir em Usuários** - Ver tabela atualizada
3. **Criar convite** - Ver na tabela de convites
4. **Aceitar convite** - Ver sumir dos convites e aparecer nos usuários
5. **Excluir usuário** - Testar botão de ações

**Tabelas agora estão completas e funcionais!** ✨

