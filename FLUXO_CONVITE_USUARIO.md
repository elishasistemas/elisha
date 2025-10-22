# 📧 Fluxo de Convite de Usuário

Sistema completo de convite de usuários via Super Admin para empresas clientes.

---

## ✅ O Que Foi Corrigido

### 1. **Constraint de `active_role`**
- ❌ **Antes**: Só permitia `gestor` e `tecnico`
- ✅ **Agora**: Permite `admin`, `gestor`, `tecnico` e `elisha_admin`
- 📁 Migration: `supabase/migrations/2025-10-22-fix-active-role-constraint.sql`

### 2. **Sistema de Convite Unificado**
- ❌ **Antes**: Dois sistemas misturados (Supabase Auth + Tabela Invites)
- ✅ **Agora**: Usa apenas tabela `invites` com tokens
- 🎯 **Vantagem**: Controle total, sem dependência de email externo

### 3. **API Simplificada**
- 📁 `src/app/api/admin/create-company-user/route.ts`
- Usa RPC `create_invite` para criar convites
- Retorna link completo para copiar

### 4. **UserDialog Melhorado**
- Mostra formulário de criação
- Após criar, exibe link para copiar
- Interface igual ao InviteDialog (consistente)

### 5. **Página de Signup Melhorada**
- Mostra nome da empresa convidando
- Badge com papel/função
- Interface clara e amigável

---

## 🚀 Fluxo Completo (Passo a Passo)

### Passo 1: Super Admin Cria Convite

1. **Super Admin** acessa `/admin/companies`
2. Clica em **"Usuário"** na empresa desejada
3. Preenche formulário:
   - Email do usuário
   - Papel: Admin, Gestor ou Técnico
4. Clica em **"Criar Convite"**

**Resultado:**
```
✅ Convite criado!
📋 Link: https://elisha.com.br/signup?token=abc-123-xyz
📧 Email: usuario@empresa.com
🏢 Empresa: Acme Corp
👤 Papel: Administrador
⏰ Expira em 7 dias
```

### Passo 2: Super Admin Envia Link

1. Clica no botão **Copiar** (ícone de clipboard)
2. Envia link por:
   - WhatsApp
   - Email
   - Slack
   - Qualquer canal

### Passo 3: Usuário Recebe Link

```
📨 Mensagem:

Olá! Você foi convidado para acessar o sistema da 
Acme Corp como Administrador.

Clique no link abaixo para criar sua conta:
https://elisha.com.br/signup?token=abc-123-xyz

O link expira em 7 dias.
```

### Passo 4: Usuário Acessa Link

1. Clica no link
2. Sistema verifica:
   - ✅ Token válido?
   - ✅ Não expirou?
   - ✅ Status = pending?
3. Mostra tela de boas-vindas:

```
🎉 Você foi convidado!

Acme Corp convidou você para acessar o sistema como Administrador

E-mail: usuario@empresa.com
Papel: Administrador
```

### Passo 5: Usuário Cria Senha

1. Confirma email (pré-preenchido)
2. Cria senha (mínimo 6 caracteres)
3. Confirma senha
4. Clica em **"Criar conta e aceitar convite"**

**Sistema:**
- Cria conta no Supabase Auth
- Cria/atualiza profile com `empresa_id` e `role`
- Marca convite como `accepted`
- Redireciona para `/dashboard`

### Passo 6: Usuário Acessa Dashboard

✅ **Usuário logado com sucesso!**

- Vê dados da empresa que o convidou
- Tem permissões do papel atribuído
- Pode começar a usar o sistema

---

## 🎯 Cenários Especiais

### Cenário A: Usuário Já Existe

**Se o email já tem conta:**

1. Sistema detecta email existente
2. Atualiza apenas:
   - `empresa_id` → empresa que convidou
   - `role` → papel do convite
3. Redireciona para dashboard
4. Usuário pode fazer login normalmente

### Cenário B: Convite Expirado

**Se passou 7 dias:**

1. Mostra erro: "Este convite expirou"
2. Usuário não consegue aceitar
3. Super Admin precisa criar novo convite

### Cenário C: Convite Já Usado

**Se token já foi aceito:**

1. Mostra erro: "Este convite já foi utilizado"
2. Usuário pode fazer login com credenciais anteriores
3. Ou solicitar novo convite se necessário

---

## 🔒 Segurança

### Validações Implementadas

1. **Token Único**: UUID v4 aleatório
2. **Expiração**: 7 dias (configurável)
3. **Single Use**: Só pode ser aceito uma vez
4. **Isolamento**: Convite vinculado a uma empresa específica
5. **RLS**: Apenas admin da empresa vê/cria convites

### Proteções

```sql
-- Token único e indexado
token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()

-- Expiração obrigatória
expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'

-- Status controlado
status text NOT NULL DEFAULT 'pending' 
  CHECK (status IN ('pending','accepted','revoked','expired'))
```

---

## 📋 Checklist de Setup

### Banco de Dados

- [ ] Rodar migration: `2025-10-22-fix-active-role-constraint.sql`
- [ ] Verificar tabela `invites` existe
- [ ] Verificar RPC `create_invite` funciona
- [ ] Verificar RPC `accept_invite` funciona

### Código

- [ ] API `/api/admin/create-company-user` retorna link
- [ ] UserDialog mostra tela de sucesso com link
- [ ] Página `/signup` mostra nome da empresa
- [ ] Redirect para `/dashboard` após aceitar

### Testes

- [ ] Super admin consegue criar convite
- [ ] Link é copiável
- [ ] Usuário novo consegue criar conta
- [ ] Usuário é redirecionado para dashboard
- [ ] Convite fica como `accepted`
- [ ] Usuário aparece na empresa correta

---

## 🧪 Como Testar

### 1. Criar Convite

```bash
# Como Super Admin
1. Login: iverson.ux@gmail.com
2. Ir em /admin/companies
3. Clicar "Usuário" em uma empresa
4. Preencher: teste@empresa.com, Admin
5. Criar convite
6. Copiar link gerado
```

### 2. Aceitar Convite

```bash
# Em aba anônima / incógnito
1. Abrir link copiado
2. Verificar se mostra nome da empresa
3. Criar senha: teste123
4. Confirmar senha: teste123
5. Criar conta
6. Verificar redirect para /dashboard
7. Verificar que vê dados da empresa
```

### 3. Validar Banco

```sql
-- Verificar usuário criado
SELECT * FROM auth.users WHERE email = 'teste@empresa.com';

-- Verificar profile
SELECT * FROM profiles WHERE email = 'teste@empresa.com';

-- Verificar convite
SELECT * FROM invites 
WHERE email = 'teste@empresa.com' 
AND status = 'accepted';
```

---

## 📊 Estrutura de Dados

### Tabela: `invites`

```sql
{
  id: 'uuid',
  empresa_id: 'uuid',          -- Empresa que está convidando
  email: 'texto@email.com',    -- Email do convidado
  role: 'admin',               -- Papel: admin, gestor, tecnico
  token: 'uuid-aleatorio',     -- Token único para aceitar
  status: 'pending',           -- pending, accepted, revoked, expired
  expires_at: '2025-10-29',    -- Data de expiração (7 dias)
  created_by: 'uuid',          -- Super admin que criou
  accepted_by: 'uuid',         -- Usuário que aceitou (null se pending)
  created_at: '2025-10-22',
  accepted_at: '2025-10-23'    -- Quando foi aceito
}
```

### API Response: `create_invite`

```json
{
  "success": true,
  "message": "Convite criado para teste@empresa.com",
  "invite": {
    "token": "abc-123-xyz",
    "url": "https://elisha.com.br/signup?token=abc-123-xyz",
    "email": "teste@empresa.com",
    "role": "admin",
    "empresa": "Acme Corp",
    "expires_at": "2025-10-29T10:00:00Z"
  }
}
```

---

## ⚡ Troubleshooting

### Problema: "Erro ao atualizar profile: active_role constraint"

**Causa**: Constraint antiga não permite `admin`

**Solução**: Rodar migration
```sql
-- supabase/migrations/2025-10-22-fix-active-role-constraint.sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_active_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_active_role_check 
  CHECK (active_role IN ('admin', 'gestor', 'tecnico', 'elisha_admin') OR active_role IS NULL);
```

### Problema: "Convite inválido ou não encontrado"

**Causas possíveis:**
1. Token incorreto
2. Convite revogado
3. Convite expirado
4. RLS bloqueando query

**Solução**:
```sql
-- Verificar se convite existe (como service_role)
SELECT * FROM invites WHERE token = 'SEU-TOKEN';

-- Verificar RLS
SHOW rls_enabled ON invites; -- deve ser 'on'
```

### Problema: "Usuário criado mas não aparece na empresa"

**Causa**: Profile não foi criado/atualizado corretamente

**Solução**:
```sql
-- Verificar profile
SELECT * FROM profiles WHERE user_id = 'USER-ID';

-- Se necessário, atualizar manualmente
UPDATE profiles SET
  empresa_id = 'EMPRESA-ID',
  role = 'admin',
  active_role = 'admin',
  roles = ARRAY['admin']
WHERE user_id = 'USER-ID';
```

---

## 🎨 Personalização

### Alterar Tempo de Expiração

```typescript
// Em create-company-user/route.ts
const { data: inviteData } = await supabase.rpc('create_invite', {
  p_empresa_id: empresaId,
  p_email: email,
  p_role: role,
  p_expires_days: 14  // ← Mudar aqui (padrão: 7)
})
```

### Customizar Mensagem de Boas-Vindas

```typescript
// Em src/app/signup/page.tsx
<CardDescription>
  <strong>{invite.empresa_nome}</strong> convidou você...
  // ← Customizar aqui
</CardDescription>
```

### Adicionar Email Automático

```typescript
// Futuro: integrar com serviço de email
await sendEmail({
  to: email,
  subject: `Convite para ${empresa.nome}`,
  body: `Você foi convidado! Acesse: ${inviteUrl}`
})
```

---

## 📚 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/001_create_invites_system.sql` | Sistema de convites original |
| `supabase/migrations/2025-10-22-fix-active-role-constraint.sql` | Fix da constraint |
| `src/app/api/admin/create-company-user/route.ts` | API criar convite |
| `src/components/admin/user-dialog.tsx` | Dialog de criação |
| `src/app/signup/page.tsx` | Página de aceitar convite |

---

**Implementado em:** Outubro 22, 2025  
**Versão:** 2.0.0  
**Status:** ✅ PRONTO PARA USO

**Documentação:** Este arquivo + `README_INVITE_SYSTEM.md`

