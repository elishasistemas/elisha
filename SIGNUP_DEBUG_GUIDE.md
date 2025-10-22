# 🔍 Debug: Convite Inválido na Página de Signup

## 🐛 Problema Reportado

**Erro:**
```
❌ "Convite inválido ou não encontrado"
```

**URL:**
```
http://localhost:3000/signup?token=cff1ebc2-df09-48d9-830f-020cbfaeab86
```

**Situação:**
- Acessando em aba anônima
- Convite EXISTE no banco ✅
- Status: `pending` ✅
- RLS permite leitura anônima ✅

---

## 🔍 Investigação

### 1. Verificado no Banco
```sql
SELECT * FROM invites 
WHERE token = 'cff1ebc2-df09-48d9-830f-020cbfaeab86';
```

**Resultado:**
- ✅ Convite existe
- ✅ Status: `pending`
- ✅ Expira em: 2025-10-29 (válido)
- ✅ Empresa: B&S Serviços Técnico Ltda

### 2. Verificado RLS
```sql
-- Policy para usuários anônimos
invites_select_anonymous | anon | SELECT | status = 'pending'
```
✅ Policy criada e ativa

### 3. Problema Identificado

**Possível causa:**
- A query no frontend estava usando JOIN com sintaxe complexa
- Supabase client pode ter falhado ao processar o JOIN
- Mudamos para duas queries separadas

---

## ✅ Correção Aplicada

### Código Anterior (com JOIN):
```typescript
const { data: inviteData, error: inviteError } = await supabase
  .from("invites")
  .select(`
    *,
    empresas:empresa_id (
      nome
    )
  `)
  .eq("token", token)
  .single();
```

### Código Novo (queries separadas + logs):
```typescript
// 1. Buscar convite
console.log('[Signup] Buscando convite:', token);
const { data: inviteData, error: inviteError } = await supabase
  .from("invites")
  .select("*")
  .eq("token", token)
  .single();

console.log('[Signup] Resultado convite:', { inviteData, inviteError });

if (inviteError || !inviteData) {
  console.error("[Signup] Erro ao buscar convite:", inviteError);
  setError("Convite inválido ou não encontrado");
  return;
}

// 2. Buscar empresa
const { data: empresaData } = await supabase
  .from("empresas")
  .select("nome")
  .eq("id", inviteData.empresa_id)
  .single();

console.log('[Signup] Nome da empresa:', empresaData);

// 3. Combinar
const inviteWithEmpresa = {
  ...inviteData,
  empresa_nome: empresaData?.nome || 'Empresa'
}

console.log('[Signup] Convite completo:', inviteWithEmpresa);
```

---

## 🧪 TESTE AGORA COM DEBUG

### Passo 1: Abrir Aba Anônima
```
Cmd+Shift+N (Mac)
Ctrl+Shift+N (Windows)
```

### Passo 2: Abrir Console
```
F12 ou Cmd+Option+I (Mac)
Aba "Console"
```

### Passo 3: Acessar o Link
```
http://localhost:3000/signup?token=cff1ebc2-df09-48d9-830f-020cbfaeab86
```

### Passo 4: Ver Logs no Console

**Esperado (sucesso):**
```javascript
[Signup] Buscando convite: cff1ebc2-df09-48d9-830f-020cbfaeab86
[Signup] Resultado convite: {
  inviteData: {
    id: "...",
    email: "iversond@live.com",
    status: "pending",
    ...
  },
  inviteError: null
}
[Signup] Nome da empresa: { nome: "B&S Serviços Técnico Ltda" }
[Signup] Convite completo: {
  email: "iversond@live.com",
  empresa_nome: "B&S Serviços Técnico Ltda",
  ...
}
```

**Se der erro:**
```javascript
[Signup] Buscando convite: cff1ebc2-df09-48d9-830f-020cbfaeab86
[Signup] Resultado convite: {
  inviteData: null,
  inviteError: { message: "...", code: "...", ... }
}
[Signup] Erro ao buscar convite: { ... }
```

---

## 🔍 Possíveis Causas do Erro

### 1. RLS Bloqueando (improvável)
**Sintoma:**
```javascript
inviteError: { code: "PGRST116", message: "..." }
```

**Solução:**
- Verificar se policy `invites_select_anonymous` está ativa
- Verificar se convite tem `status = 'pending'`

### 2. Token Inválido
**Sintoma:**
```javascript
inviteData: null
inviteError: null (ou 404)
```

**Solução:**
- Copiar token correto do banco
- Verificar se não há espaços extras na URL

### 3. Servidor não Inicializado
**Sintoma:**
- Página não carrega
- Network error

**Solução:**
```bash
# Verificar se servidor está rodando
curl http://localhost:3000

# Se não, reiniciar
pnpm dev
```

### 4. Cache do Navegador
**Sintoma:**
- Código antigo ainda executa

**Solução:**
```
Cmd+Shift+R (Mac) - Hard refresh
Ctrl+Shift+F5 (Windows)
```

---

## 📊 Checklist de Verificação

```
✅ Convite existe no banco
✅ Status: 'pending'
✅ Não expirou
✅ RLS policy criada (invites_select_anonymous)
✅ Servidor rodando (localhost:3000)
✅ Logs de debug adicionados
⏳ Testar em aba anônima com console
```

---

## 🔧 Testes Alternativos

### Teste 1: Query Direta no Supabase
```javascript
// No console do navegador (aba anônima)
const { createClient } = supabase
const client = createClient(
  'https://wkccxgeevizhxmclvsnz.supabase.co',
  'SUA_ANON_KEY'
)

const { data, error } = await client
  .from('invites')
  .select('*')
  .eq('token', 'cff1ebc2-df09-48d9-830f-020cbfaeab86')
  .single()

console.log({ data, error })
```

### Teste 2: Acessar Link Direto (sem aba anônima)
```
1. Logout do sistema
2. Acessar o link normalmente
3. Ver se carrega
```

### Teste 3: Criar Novo Convite
```
1. Admin → Impersonar empresa
2. Usuários → Criar novo convite
3. Copiar novo link
4. Testar o novo link
```

---

## 📝 Próximos Passos

### Se Logs Mostrarem Sucesso:
✅ Problema resolvido!
- Página deve carregar corretamente
- Formulário de signup aparece

### Se Logs Mostrarem Erro:
1. **Copie os logs completos** do console
2. **Me envie** os logs
3. **Print da tela** se possível

---

## ✅ Status Atual

```
┌─────────────────────────────────────────────┐
│ 🔍 DEBUG MODE ATIVO                         │
├─────────────────────────────────────────────┤
│ Logs adicionados:           SIM ✅          │
│ Queries separadas:          SIM ✅          │
│ RLS verificada:             OK ✅           │
│ Convite no banco:           OK ✅           │
│ Aguardando teste:           ⏳              │
└─────────────────────────────────────────────┘
```

---

## 🚀 TESTE AGORA!

```
1. Aba anônima (Cmd+Shift+N)
2. Console aberto (F12)
3. Acessar: http://localhost:3000/signup?token=cff1ebc2-df09-48d9-830f-020cbfaeab86
4. Ver logs no console
5. Me mostrar o que aparece!
```

---

**Me envie:**
1. Print dos logs do console
2. Print da tela de erro (se houver)
3. Qualquer mensagem de erro que aparecer

