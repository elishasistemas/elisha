# 🎯 Cadastro de Superadmin: fpsjunior87@gmail.com

## 📋 Passo a Passo

### Opção 1: Via Supabase Dashboard (Recomendado)

#### 1. Criar o usuário no Auth

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** (ou **Invite User**)
4. Preencha:
   - **Email**: `fpsjunior87@gmail.com`
   - **Password**: (deixe em branco para enviar magic link OU defina uma senha)
   - **Auto Confirm User**: ✅ (marcar esta opção)
5. Clique em **Create User**

#### 2. Executar o script SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Crie uma nova query
3. Cole o conteúdo do arquivo `scripts/create-elisha-admin-fpsjunior.sql`
4. Clique em **Run** (ou pressione Ctrl+Enter)

#### 3. Verificar

O script retornará uma query mostrando:
- ✅ Email confirmado
- ✅ Nome: FPS Junior (Elisha Admin)
- ✅ Roles: {elisha_admin}
- ✅ Active Role: elisha_admin
- ✅ Is Elisha Admin: true

---

### Opção 2: Via Supabase CLI (se configurado)

```bash
# 1. Criar usuário via CLI
supabase auth admin create-user \
  --email fpsjunior87@gmail.com \
  --email-confirm true

# 2. Executar script SQL
supabase db execute -f scripts/create-elisha-admin-fpsjunior.sql
```

---

### Opção 3: Via API (Programática)

Se preferir criar via código, você pode usar a API do Supabase Admin:

```typescript
// Exemplo usando Supabase Admin API
const { data, error } = await supabase.auth.admin.createUser({
  email: 'fpsjunior87@gmail.com',
  email_confirm: true,
  user_metadata: {
    name: 'FPS Junior'
  }
})

// Depois executar o script SQL para atualizar o profile
```

---

## ✅ Verificação Final

Após executar o script, verifique se tudo está correto:

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.nome,
  p.roles,
  p.active_role,
  p.is_elisha_admin,
  p.empresa_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'fpsjunior87@gmail.com';
```

**Resultado esperado:**
- `email`: fpsjunior87@gmail.com
- `email_confirmed_at`: (data/hora)
- `nome`: FPS Junior (Elisha Admin)
- `roles`: `{elisha_admin}`
- `active_role`: `elisha_admin`
- `is_elisha_admin`: `true`
- `empresa_id`: `NULL`

---

## 🔑 Permissões do Superadmin

Como **Superadmin Elisha**, o usuário terá:

✅ Acesso total a todas as empresas  
✅ Poder de impersonation (assumir identidade de qualquer empresa)  
✅ Criar/editar/deletar qualquer recurso  
✅ Gerenciar usuários e convites  
✅ Ver logs de auditoria  
✅ Acesso a funcionalidades administrativas  

---

## 📝 Notas

- O usuário precisa fazer login pela primeira vez para ativar a sessão
- Se usar magic link, o usuário receberá um email para confirmar
- O `empresa_id` é `NULL` para superadmins (eles não têm empresa fixa)
- O script é idempotente: pode ser executado múltiplas vezes sem problemas

---

**Status**: ⏳ Aguardando execução

