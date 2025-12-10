# Sistema de Convites - OBSOLETO

**Data de Depreciação:** 09/12/2025  
**Status:** Substituído por cadastro direto

## ⚠️ Aviso

O sistema de convites foi **substituído** pelo sistema de **cadastro direto de usuários**.

Admin e Supervisor agora criam usuários diretamente, fornecendo:
- Username (login)
- Senha
- Nome completo
- Email
- Telefone/WhatsApp
- Role (admin/supervisor/técnico)

## Arquivos Obsoletos (NÃO DELETAR ainda - manter para referência)

### Frontend
- `src/components/invite-dialog.tsx` - Dialog de criação de convite
- `apps/web/src/app/signup/page.tsx` - Página de aceitar convite com token
- Referências a `?token=` em signup

### Backend
- `apps/web/src/app/api/admin/create-company-user/route.ts` - API de convite (usa tabela `invites`)
- `apps/web/src/app/api/admin/invite-elisha-admin/route.ts` - Convite para elisha_admin

### Database
- `supabase/migrations/20251208000000_fix_accept_invite_link_tecnico_id.sql` - RPC `accept_invite`
- `supabase/migrations/20251208000001_create_invites_table_and_rpc.sql` - Tabela `invites` e RPC `create_invite`
- Tabela: `public.invites` (manter para dados históricos)
- Função: `public.accept_invite()` (obsoleta)
- Função: `public.create_invite()` (obsoleta)

## Novo Sistema

### Arquivos Implementados

**API:**
- `apps/web/src/app/api/users/create/route.ts` - Cadastro direto de usuários

**Componentes:**
- `apps/web/src/components/users/user-create-dialog.tsx` - Dialog de cadastro direto

**Database:**
- `supabase/migrations/20251209000005_add_username_to_profiles.sql` - Coluna `username` na tabela `profiles`
- `supabase/migrations/20251209000006_create_login_identifier_rpc.sql` - RPC `get_email_from_identifier` para login com username

**Autenticação:**
- `apps/web/src/app/login/page.tsx` - Login aceita username OU email

## Fluxo Novo

1. **Admin/Supervisor** acessa gestão de usuários
2. Clica em **"Criar Usuário"**
3. Preenche formulário com:
   - Username (único, usado para login)
   - Senha (mínimo 8 caracteres)
   - Nome completo
   - Email
   - Telefone/WhatsApp
   - Função/Cargo
   - Role (admin/supervisor/técnico)
4. Sistema cria usuário **imediatamente** via `supabase.auth.admin.createUser()`
5. Profile é criado automaticamente com `username`, `tecnico_id` (se aplicável)
6. **Usuário já pode fazer login** com username ou email + senha

## Vantagens do Novo Sistema

✅ **Sem espera** - Usuário criado instantaneamente  
✅ **Sem email** - Não depende de serviço de email  
✅ **Username** - Login mais simples que email  
✅ **Controle total** - Admin define a senha inicial  
✅ **Menos tabelas** - Remove dependência da tabela `invites`  
✅ **Mais seguro** - Sem tokens públicos expirando

## Migração de Dados

**Não é necessário migrar** dados da tabela `invites`:
- Convites pendentes ficam obsoletos
- Novos usuários serão criados pelo novo fluxo
- Tabela `invites` pode ser mantida para auditoria

## Remoção Futura (após validação em produção)

Após **2-3 semanas** de produção estável:
1. Remover componente `invite-dialog.tsx`
2. Remover página `signup/page.tsx` (ou adaptar para redefinir senha)
3. Remover APIs de invite
4. Comentar migrations de invite
5. (Opcional) Drop table `invites` se não houver dados relevantes

## Documentos Relacionados

- `INSTRUCOES_MIGRATIONS_CHECKOUT.md` - Ordem das migrations
- `LEIA-ME-PRIMEIRO.md` - Guia geral do sistema
