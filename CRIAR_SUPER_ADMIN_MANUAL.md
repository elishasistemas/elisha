# 🔐 Criar Super Admin Manualmente

**Problema**: A criação via SQL direta não funciona corretamente para autenticação do Supabase.

**Solução**: Criar o usuário através do Dashboard do Supabase.

---

## 📋 Passo a Passo

### 1. Acessar Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto **Elisha**

### 2. Criar Usuário no Auth

1. No menu lateral, clique em **Authentication** → **Users**
2. Clique no botão **"Add user"** (ou "+ Add user")
3. Selecione **"Create new user"**
4. Preencha os campos:
   - **Email**: `iverson.ux@gmail.com`
   - **Password**: `ElishaAdmin2025!`
   - **Auto Confirm User**: ✅ **MARQUE ESTA OPÇÃO**
5. Clique em **"Create user"**

### 3. Copiar o UUID do Usuário

Após criar, você verá o usuário na lista. **Copie o UUID/ID do usuário** (algo como: `4570ca9d-...`)

### 4. Aguardar Alguns Segundos

O sistema criará automaticamente um profile para o usuário. **Aguarde 5-10 segundos**.

### 5. Executar SQL para Configurar como Super Admin

1. No menu lateral, clique em **SQL Editor**
2. Clique em **"New query"**
3. Cole o SQL abaixo, **substituindo `USER_UUID_AQUI`** pelo UUID copiado:

```sql
-- Atualizar profile para Super Admin
UPDATE public.profiles
SET 
  is_elisha_admin = true,
  role = 'admin',
  roles = ARRAY['admin', 'tecnico', 'elisha_admin']::text[],
  active_role = 'admin',
  empresa_id = null,
  nome = 'Iverson Dantas (Super Admin)',
  funcao = 'admin'
WHERE user_id = 'USER_UUID_AQUI';

-- Atualizar app_metadata do usuário
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'is_elisha_admin', true,
  'roles', ARRAY['admin', 'tecnico', 'elisha_admin']::text[],
  'active_role', 'admin'
)
WHERE id = 'USER_UUID_AQUI';

-- Verificar criação
SELECT 
  u.email,
  p.is_elisha_admin,
  p.role,
  p.roles,
  p.active_role,
  p.funcao,
  u.raw_app_meta_data->>'is_elisha_admin' as meta_elisha_admin
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.id = 'USER_UUID_AQUI';
```

4. Clique em **"Run"** ou pressione **Ctrl+Enter**

### 6. Verificar

Você deve ver uma resposta mostrando:
```
email: iverson.ux@gmail.com
is_elisha_admin: true
role: admin
roles: {admin, tecnico, elisha_admin}
active_role: admin
funcao: admin
meta_elisha_admin: true
```

### 7. Testar Login

1. Acesse: http://localhost:3000/login (ou seu domínio de produção)
2. Email: `iverson.ux@gmail.com`
3. Senha: `ElishaAdmin2025!`
4. Clique em **"Entrar"**

✅ Deve funcionar perfeitamente!

---

## 🔑 Credenciais

**Email**: `iverson.ux@gmail.com`  
**Senha**: `ElishaAdmin2025!`

---

## ❓ Por que este método?

O Supabase Auth usa um sistema específico de hash de senhas que não é compatível com criação manual via SQL. 

Ao criar o usuário pelo Dashboard:
- ✅ Senha é hashada corretamente
- ✅ Email é confirmado automaticamente  
- ✅ Usuário fica imediatamente ativo
- ✅ Pode fazer login sem problemas

---

## 🚨 Troubleshooting

Se ainda não funcionar:

1. **Verificar se o email está confirmado**:
   ```sql
   SELECT email, email_confirmed_at 
   FROM auth.users 
   WHERE email = 'iverson.ux@gmail.com';
   ```
   - Se `email_confirmed_at` for `null`, confirme manualmente no Dashboard

2. **Resetar senha**:
   - No Dashboard: Authentication → Users
   - Clique nos 3 pontinhos ao lado do usuário
   - Selecione "Reset password"
   - Defina nova senha manualmente

