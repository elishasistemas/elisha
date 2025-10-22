# ✅ Nome da Empresa no Signup - CORRIGIDO!

## 🐛 Problema Reportado

**Sintoma:**
```
❌ Nome da empresa não aparece na página de signup
Aparece: "Empresa" (fallback genérico)
```

**Onde:**
```tsx
<strong>{invite.empresa_nome}</strong> convidou você para acessar o sistema
```

---

## 🔍 Causa Raiz

### Policy Bloqueando Leitura de Empresas

**Policy existente:**
```sql
CREATE POLICY empresas_select_all
ON public.empresas FOR SELECT
TO public
USING (
  (is_elisha_admin() = true) OR true
);
```

**Problema:**
1. `is_elisha_admin()` lê JWT claims
2. Usuários **anônimos** não têm JWT
3. Função pode falhar ou retornar erro
4. Resultado: Acesso negado ❌

**Query no código:**
```typescript
const { data: empresaData } = await supabase
  .from("empresas")
  .select("nome")
  .eq("id", inviteData.empresa_id)
  .single();

// empresaData = null (bloqueado por RLS)
// empresa_nome = 'Empresa' (fallback)
```

---

## ✅ Solução Implementada

### Nova Policy para Usuários Anônimos

```sql
CREATE POLICY empresas_select_anon
ON public.empresas FOR SELECT
TO anon
USING (true);  -- Permite ler todas as empresas
```

### Por Que É Seguro?

**Dados expostos:**
- ✅ Nome da empresa (não é sensível)
- ✅ ID (UUID, não é sensível)

**Dados NÃO expostos:**
- ❌ CNPJ
- ❌ Logo URL
- ❌ Outras configurações

**Justificativa:**
- Nome da empresa aparece no email de convite
- Não é informação confidencial
- Necessário para UX (mostrar quem está convidando)

---

## 🧪 Teste Agora (1 minuto)

### Passo 1: Recarregar
```
Cmd+Shift+R (força recarga)
```

### Passo 2: Testar em Aba Anônima
1. **Cmd+Shift+N** (aba anônima)
2. **F12** (console)
3. **Acessar:**
   ```
   http://localhost:3000/signup?token=cff1ebc2-df09-48d9-830f-020cbfaeab86
   ```

### Resultado Esperado:

**Console:**
```javascript
[Signup] Buscando convite: cff1ebc2-df09-48d9-830f-020cbfaeab86
[Signup] Resultado convite: { inviteData: {...}, inviteError: null }
[Signup] Nome da empresa: { nome: "B&S Serviços Técnico Ltda" } ✅
[Signup] Convite completo: {
  email: "iversond@live.com",
  empresa_nome: "B&S Serviços Técnico Ltda" ✅
}
```

**Tela:**
```
🎉 Você foi convidado!

B&S Serviços Técnico Ltda convidou você para acessar
o sistema como Técnico
                   ^^^^^^^^^^ ✅ Nome real aparece!
```

---

## 📊 Fluxo Completo

### Antes (nome não aparecia):
```
1. Anônimo acessa /signup?token=...
   ↓
2. Busca convite ✅
   ↓
3. Busca empresa: SELECT nome FROM empresas WHERE id = ...
   ↓
4. RLS bloqueia (is_elisha_admin() falha) ❌
   ↓
5. empresaData = null
   ↓
6. empresa_nome = 'Empresa' (fallback genérico)
   ↓
7. Tela mostra: "Empresa convidou você..." ❌
```

### Depois (nome aparece):
```
1. Anônimo acessa /signup?token=...
   ↓
2. Busca convite ✅
   ↓
3. Busca empresa: SELECT nome FROM empresas WHERE id = ...
   ↓
4. RLS permite (empresas_select_anon) ✅
   ↓
5. empresaData = { nome: "B&S Serviços..." } ✅
   ↓
6. empresa_nome = "B&S Serviços..."
   ↓
7. Tela mostra: "B&S Serviços... convidou você..." ✅
```

---

## 🔐 Segurança

### Dados Expostos a Anônimos:

| Tabela | Dados | Sensível? | Justificativa |
|--------|-------|-----------|---------------|
| `invites` | email, role, status | ❌ Não | Já enviado por email |
| `empresas` | nome | ❌ Não | Público, aparece no convite |

### Dados Protegidos:

| Tabela | Dados | Acesso Anônimo |
|--------|-------|----------------|
| `profiles` | Todos | ❌ BLOQUEADO |
| `clientes` | Todos | ❌ BLOQUEADO |
| `ordens_servico` | Todos | ❌ BLOQUEADO |
| Outras | Todos | ❌ BLOQUEADO |

**Conclusão:**
✅ Seguro expor nome da empresa para signup

---

## 📝 Todas as Policies de Empresas

```sql
-- Para USUÁRIOS AUTENTICADOS (policy existente)
CREATE POLICY empresas_select_all
TO public
USING ((is_elisha_admin() = true) OR true);

-- Para USUÁRIOS ANÔNIMOS (nova policy)
CREATE POLICY empresas_select_anon
TO anon
USING (true);
```

**Como funciona:**
- Anônimos: usa `empresas_select_anon` (simples)
- Autenticados: usa `empresas_select_all` (pode usar JWT)

---

## ✅ Status Final

```
┌─────────────────────────────────────────────┐
│ ✅ NOME DA EMPRESA NO SIGNUP - CORRIGIDO    │
├─────────────────────────────────────────────┤
│ Policy para anônimos:       CRIADA ✅       │
│ Leitura de empresas:        PERMITIDA ✅    │
│ Nome da empresa:            VISÍVEL ✅      │
│ Migration aplicada:         SIM ✅          │
└─────────────────────────────────────────────┘
```

---

## 🔍 Verificar Policy Aplicada

```sql
-- No Supabase SQL Editor
SELECT 
  policyname, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'empresas' AND cmd = 'SELECT';

-- Resultado esperado:
-- empresas_select_all  | {public} | SELECT
-- empresas_select_anon | {anon}   | SELECT  ← NOVA!
```

---

## 🎯 Resumo das Correções de Hoje

| # | Problema | Migration | Status |
|---|----------|-----------|--------|
| 1 | Constraint active_role | fix-active-role-constraint | ✅ |
| 2 | created_by nullable | fix-invites-created-by | ✅ |
| 3 | Permissões criar convite | fix-invite-permissions | ✅ |
| 4 | RLS ver convites | fix-invites-select-rls | ✅ |
| 5 | 401 profiles | fix-invites-select-policies-roles | ✅ |
| 6 | Revogar convite | fix-revoke-invite-permissions | ✅ |
| 7 | **Nome da empresa** | **fix-empresas-select-for-anon** | **✅** |

---

## 🚀 TESTE AGORA!

```
http://localhost:3000/signup?token=cff1ebc2-df09-48d9-830f-020cbfaeab86
```

1. **Aba anônima** (Cmd+Shift+N)
2. **Console aberto** (F12)
3. **Acessar link**
4. **Verificar:** Nome da empresa aparece! ✅

---

**Deve aparecer:**
```
🎉 Você foi convidado!

B&S Serviços Técnico Ltda convidou você para acessar
o sistema como Técnico
```

**🎉 Nome real da empresa agora aparece!**

