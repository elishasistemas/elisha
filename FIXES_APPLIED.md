# ✅ Correções Aplicadas - Sistema de Convites

## 🐛 Problema Original

**Erro:**
```
Erro ao criar convite: insert or update on table "invites" violates foreign key constraint "invites_created_by_fkey"
```

**Causa:**
- A coluna `created_by` tinha constraint `NOT NULL` e foreign key para `auth.users(id)`
- Quando super admin criava convite, o `created_by` era um UUID inválido (`00000000-0000-0000-0000-000000000000`)
- Esse UUID não existia na tabela `auth.users`, causando violação da foreign key

---

## ✅ Solução Implementada

### 1. **Migration SQL** ✅
**Arquivo:** `supabase/migrations/2025-10-22-fix-invites-created-by.sql`

```sql
-- Remove NOT NULL constraint from created_by
ALTER TABLE public.invites 
  ALTER COLUMN created_by DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN public.invites.created_by IS 
  'User who created the invite. Can be NULL for super admin invites.';
```

**Aplicada com sucesso:** ✅ Migration executada no Supabase

---

### 2. **Código da API** ✅
**Arquivo:** `src/app/api/admin/create-company-user/route.ts`

**Antes:**
```typescript
const createdBy = created_by || '00000000-0000-0000-0000-000000000000'

const { data: inviteData, error: inviteError } = await supabase
  .from('invites')
  .insert({
    empresa_id: empresaId,
    email: email.trim().toLowerCase(),
    role: roleToUse,
    created_by: createdBy, // UUID inválido
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  })
```

**Depois:**
```typescript
const invitePayload: any = {
  empresa_id: empresaId,
  email: email.trim().toLowerCase(),
  role: roleToUse,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}

// Adicionar created_by apenas se fornecido e válido
if (created_by && created_by !== '') {
  invitePayload.created_by = created_by
}

const { data: inviteData, error: inviteError } = await supabase
  .from('invites')
  .insert(invitePayload) // created_by é NULL se não fornecido
```

---

## 🎯 O Que Mudou

### Antes:
- ❌ `created_by` era obrigatório (NOT NULL)
- ❌ Usava UUID inválido como fallback
- ❌ Violava foreign key constraint

### Depois:
- ✅ `created_by` é opcional (pode ser NULL)
- ✅ Se usuário está logado → usa o user.id real
- ✅ Se não tem usuário → deixa NULL
- ✅ Não viola constraint

---

## 📊 Impacto

### Casos de Uso:

#### 1. Super Admin cria convite (impersonando)
- **created_by**: ID do super admin (válido) ✅
- **Comportamento**: Convite criado com sucesso
- **Rastreabilidade**: Sabe quem criou o convite

#### 2. Super Admin cria convite (sem estar logado no frontend)
- **created_by**: NULL
- **Comportamento**: Convite criado com sucesso
- **Rastreabilidade**: Sabe que foi criado via API admin

#### 3. Admin da empresa cria convite
- **created_by**: ID do admin (válido) ✅
- **Comportamento**: Convite criado com sucesso
- **Rastreabilidade**: Sabe quem criou o convite

---

## 🧪 Testes Necessários

Consulte o arquivo `test-invite-flow.md` para instruções detalhadas de teste.

### Checklist Rápido:
- [ ] Criar convite como super admin (impersonando)
- [ ] Verificar que não dá erro de foreign key
- [ ] Copiar link do convite
- [ ] Aceitar convite em aba anônima
- [ ] Criar senha e logar
- [ ] Verificar que novo usuário tem acesso ao dashboard
- [ ] (Opcional) Verificar se email foi enviado

---

## 🚀 Status Atual

- ✅ Migration aplicada no Supabase (local)
- ✅ Código da API ajustado
- ✅ Sem erros de lint
- ✅ Servidor rodando em background (`pnpm dev`)
- ⏳ **Aguardando testes manuais**
- ⏳ Deploy no Vercel (após testes passarem)

---

## 📝 Próximos Passos

1. **Testar localmente** (siga `test-invite-flow.md`)
2. **Verificar todos os cenários** passam
3. **Commit das alterações:**
   ```bash
   git add -A
   git commit -m "fix: corrige foreign key constraint em invites.created_by
   
   - Remove constraint NOT NULL de created_by
   - Permite NULL para convites criados por super admin
   - Ajusta API para não enviar UUID inválido
   - Adiciona testes e documentação"
   ```
4. **Push para repositório** (deploy automático no Vercel)
5. **Testar em produção**

---

## 🔍 Arquivos Modificados

1. `supabase/migrations/2025-10-22-fix-invites-created-by.sql` (novo)
2. `src/app/api/admin/create-company-user/route.ts` (modificado)
3. `test-invite-flow.md` (novo)
4. `FIXES_APPLIED.md` (este arquivo)

---

## 💡 Aprendizado

**Lição:** Quando trabalhamos com foreign keys obrigatórias, sempre considere:
1. Todos os usuários que podem criar registros têm ID válido?
2. Existem casos onde o relacionamento pode ser opcional?
3. NULL é aceitável nesse contexto de negócio?

Nesse caso, super admins podem criar convites sem necessariamente serem parte da empresa, então permitir NULL faz sentido.

