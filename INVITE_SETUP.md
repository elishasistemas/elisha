# 🎯 Setup do Sistema de Convites

Este documento explica como configurar o sistema de convites por e-mail para cadastro multiempresa.

## 📋 Pré-requisitos

- Projeto Supabase configurado
- Tabelas `empresas` e `profiles` criadas
- Acesso ao Supabase Dashboard ou CLI

## 🚀 Instalação

### Passo 1: Executar Migração SQL

Execute o arquivo de migração SQL no seu projeto Supabase:

**Opção A: Via Supabase Dashboard**

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/001_create_invites_system.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** para executar

**Opção B: Via Supabase CLI**

```bash
# Faça login no Supabase CLI (se ainda não fez)
npx supabase login

# Link seu projeto local ao projeto remoto
npx supabase link --project-ref SEU_PROJECT_REF

# Execute a migração
npx supabase db push
```

### Passo 2: Verificar Instalação

Execute a seguinte query para verificar se tudo foi criado corretamente:

```sql
-- Verificar tabela
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'invites'
);

-- Verificar funções RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_invite', 'accept_invite', 'revoke_invite');

-- Verificar policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'invites';
```

Você deve ver:
- ✅ Tabela `invites` existe
- ✅ 3 funções RPC criadas
- ✅ 4 policies criadas

## 📖 Como Usar

### 1. Admin Cria Convite

1. Faça login como admin da empresa
2. Vá em **Configurações** (ícone de engrenagem na sidebar)
3. Clique em **Usuários** ou acesse `/settings/users`
4. Clique em **"Convidar colaborador"**
5. Preencha:
   - E-mail do colaborador
   - Papel (Admin, Gestor ou Técnico)
6. Clique em **"Criar convite"**
7. **Copie o link** gerado e envie para o colaborador

### 2. Colaborador Aceita Convite

**Cenário A: Usuário Novo**
1. Abra o link recebido (formato: `https://seu-dominio.com/signup?token=UUID`)
2. Preencha e-mail (deve ser o mesmo do convite)
3. Crie uma senha (mínimo 6 caracteres)
4. Confirme a senha
5. Clique em **"Criar conta e aceitar convite"**
6. Será redirecionado para o dashboard

**Cenário B: Usuário Existente**
1. Abra o link recebido
2. Clique em **"Fazer login"**
3. Entre com suas credenciais
4. O convite será aceito automaticamente
5. Será redirecionado para o dashboard

### 3. Admin Gerencia Convites

Na página `/settings/users`, você pode:

- **Ver usuários ativos** da empresa
- **Ver convites** (pendentes, aceitos, expirados, revogados)
- **Revogar convites** pendentes
- **Atualizar** a lista

## 🔐 Segurança

### Controles Implementados

- ✅ **Isolamento por empresa**: Cada empresa só vê seus dados
- ✅ **Role-based access**: Apenas admins criam/gerenciam convites
- ✅ **Token único**: Cada convite tem token UUID único
- ✅ **Expiração**: Convites expiram em 7 dias (configurável)
- ✅ **Single use**: Tokens só podem ser usados uma vez
- ✅ **RLS**: Todas as queries protegidas por Row Level Security

### Validações

- Email é obrigatório e validado
- Role deve ser: `admin`, `gestor` ou `tecnico`
- Token expirado → erro com mensagem apropriada
- Token já usado → erro com mensagem apropriada
- Apenas admin da empresa pode criar/revogar convites

## 🧪 Testando

### Teste 1: Criar Convite (Admin)

```sql
-- Como admin, criar convite
SELECT * FROM create_invite(
  p_empresa_id := 'UUID_DA_SUA_EMPRESA',
  p_email := 'teste@exemplo.com',
  p_role := 'tecnico',
  p_expires_days := 7
);
```

### Teste 2: Aceitar Convite (Usuário)

```sql
-- Após autenticação, aceitar convite
SELECT * FROM accept_invite(
  p_token := 'TOKEN_DO_CONVITE'
);
```

### Teste 3: Revogar Convite (Admin)

```sql
-- Como admin, revogar convite
CALL revoke_invite(
  p_invite_id := 'UUID_DO_CONVITE'
);
```

## 📊 Estrutura de Dados

### Tabela `invites`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Primary key |
| empresa_id | uuid | Referência para empresas |
| email | text | E-mail do convidado |
| role | text | Papel: admin, gestor, tecnico |
| token | uuid | Token único para aceitar |
| status | text | pending, accepted, revoked, expired |
| expires_at | timestamptz | Data de expiração |
| created_by | uuid | Admin que criou |
| accepted_by | uuid | Usuário que aceitou |
| created_at | timestamptz | Data de criação |
| accepted_at | timestamptz | Data de aceitação |

## 🔧 Configurações Avançadas

### Alterar Tempo de Expiração

Por padrão, convites expiram em 7 dias. Para alterar:

```typescript
// No InviteDialog.tsx
const { data, error } = await supabase.rpc("create_invite", {
  p_empresa_id: empresaId,
  p_email: email,
  p_role: role,
  p_expires_days: 14, // 14 dias ao invés de 7
});
```

### Limpar Convites Expirados

Execute periodicamente:

```sql
-- Marcar convites expirados como expired
UPDATE public.invites
SET status = 'expired'
WHERE status = 'pending'
  AND expires_at < now();

-- Opcional: deletar convites antigos (mais de 30 dias)
DELETE FROM public.invites
WHERE created_at < now() - interval '30 days'
  AND status IN ('expired', 'revoked', 'accepted');
```

## ❓ Troubleshooting

### Erro: "You do not have permission"

**Causa**: Usuário não é admin da empresa

**Solução**: Verifique que o usuário tem `role = 'admin'` na tabela `profiles`

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE user_id = 'UUID_DO_USUARIO';
```

### Erro: "Invalid or already used token"

**Causa**: Token inválido, já aceito ou revogado

**Solução**: 
1. Verifique o status do convite:
```sql
SELECT * FROM public.invites WHERE token = 'SEU_TOKEN';
```
2. Se necessário, crie um novo convite

### Erro: "Invite expired"

**Causa**: Convite passou da data de expiração

**Solução**: Admin deve criar um novo convite para o mesmo usuário

### RLS bloqueando queries

**Causa**: Políticas RLS muito restritivas

**Solução**: Verifique que o usuário tem `empresa_id` correto no profile:

```sql
SELECT * FROM public.profiles WHERE user_id = auth.uid();
```

## 🚀 Próximos Passos

- [ ] Implementar notificação por email ao criar convite
- [ ] Adicionar histórico de ações de convites
- [ ] Implementar renovação de convites expirados
- [ ] Adicionar bulk invite (múltiplos emails de uma vez)
- [ ] Dashboard de analytics de convites

## 📚 Referências

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Shadcn UI](https://ui.shadcn.com)

