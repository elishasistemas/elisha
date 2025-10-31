# 🌿 Configuração da Branch DEV do Supabase

## 📊 Informações da Branch

### **Branch Dev**
- **Branch ID**: `ecvjgixhcfmkdfbnueqh`
- **Branch Name**: `dev`
- **Status**: `ACTIVE_HEALTHY` ✅
- **Git Branch**: `feat/auth-and-dashboard`
- **Created**: 2025-10-29

### **URLs**
- **API URL**: `https://ecvjgixhcfmkdfbnueqh.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh
- **Settings API**: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api

### **Credenciais do Banco de Dados**
- **Host**: `db.ecvjgixhcfmkdfbnueqh.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `VbFzuClIShyLvQZyYeZxTBmiILIXSKXi`
- **JWT Secret**: `taEBJzXeNRVuwhrmz0DhPyne9Spy4DrVUCfpO+uLaUoHAQwnLEdsK0Fh7ZVXF3/lkXaHvSVmbosb988IbB5f/A==`

---

## 🔑 Obter Credenciais da API

Para configurar o ambiente local, você precisa das seguintes credenciais:

1. **ANON_KEY**: Chave pública para uso no frontend
2. **SERVICE_ROLE_KEY**: Chave privada para operações administrativas

### Como Obter:

1. Acesse o dashboard da branch dev:
   ```
   https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
   ```

2. Copie as seguintes chaves:
   - **anon public**: Será usado como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: Será usado como `SUPABASE_SERVICE_ROLE_KEY`

---

## ⚙️ Configurar Ambiente Local

### 1. Criar arquivo `.env.local`

```bash
cd /Users/iversondantas/Projects/Elisha/web-admin
cp env.example .env.local
```

### 2. Editar `.env.local` com as credenciais da branch dev

```bash
# Supabase Dev Branch
NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD>
SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD>

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# Resend (opcional para dev)
# RESEND_API_KEY=re_your_api_key_here

# LogSnag (opcional para dev)
# LOGSNAG_TOKEN=your_logsnag_token
# LOGSNAG_PROJECT=elisha-dev
```

### 3. Rodar o projeto

```bash
pnpm dev
```

---

## 🚀 Aplicar Migrations

### Status Atual

As migrations ainda **NÃO** foram aplicadas na branch dev devido a um problema de propagação de DNS. O host `db.ecvjgixhcfmkdfbnueqh.supabase.co` ainda não está resolvendo.

### Opções para Aplicar Migrations

#### **Opção 1: GitHub Integration (Automático)** ✅ Recomendado

A branch dev está conectada à branch Git `feat/auth-and-dashboard`. Quando você fizer push para essa branch, o Supabase tentará aplicar as migrations automaticamente.

```bash
# As migrations estão em: supabase/migrations/
# O Supabase as aplicará automaticamente quando:
# 1. O DNS propagar (pode levar 5-30 minutos)
# 2. Você fizer um novo push para feat/auth-and-dashboard
```

#### **Opção 2: Via Supabase CLI (Manual)**

Quando o DNS resolver (teste com `ping db.ecvjgixhcfmkdfbnueqh.supabase.co`), você pode aplicar manualmente:

```bash
cd /Users/iversondantas/Projects/Elisha/web-admin

# Aplicar migrations via connection string
supabase db push --db-url "postgresql://postgres:VbFzuClIShyLvQZyYeZxTBmiILIXSKXi@db.ecvjgixhcfmkdfbnueqh.supabase.co:5432/postgres"
```

#### **Opção 3: Via Script Node.js (Manual)**

```bash
cd /Users/iversondantas/Projects/Elisha/web-admin
node scripts/apply-migrations-to-dev-branch.js
```

#### **Opção 4: Via Dashboard (Manual)**

1. Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/editor
2. Abra o SQL Editor
3. Copie e cole o conteúdo de cada arquivo em `supabase/migrations/` (em ordem)
4. Execute cada migration

---

## 🔍 Verificar Status

### Verificar se DNS resolveu

```bash
ping db.ecvjgixhcfmkdfbnueqh.supabase.co
# ou
nslookup db.ecvjgixhcfmkdfbnueqh.supabase.co
```

### Verificar status da branch

```bash
supabase branches get dev --project-ref wkccxgeevizhxmclvsnz
```

### Verificar migrations aplicadas

```bash
# Quando o DNS resolver:
supabase db pull --db-url "postgresql://postgres:VbFzuClIShyLvQZyYeZxTBmiILIXSKXi@db.ecvjgixhcfmkdfbnueqh.supabase.co:5432/postgres"
```

---

## 📝 Ambiente de Produção

### **Main Branch (Produção)**
- **Project ID**: `wkccxgeevizhxmclvsnz`
- **URL**: `https://wkccxgeevizhxmclvsnz.supabase.co`
- **Git Branch**: `main`
- **Dashboard**: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz

### Configuração para Produção

No Vercel, configure as variáveis de ambiente com as credenciais do projeto **main** (produção):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD_PROD>
SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD_PROD>
NEXT_PUBLIC_APP_URL=https://elisha-admin.vercel.app
```

---

## 🎯 Workflow Recomendado

### Desenvolvimento Local

1. Use `.env.local` com credenciais da **branch dev**
2. Desenvolva e teste localmente
3. Commit e push para `feat/auth-and-dashboard`
4. As migrations serão aplicadas automaticamente na branch dev (via GitHub integration)

### Produção

1. Quando estiver pronto, faça merge para `main`
2. As migrations serão aplicadas automaticamente na produção
3. Vercel fará deploy automático

---

## ⚠️ Importante

### DNS Propagation

O DNS da branch dev pode levar de **5 a 30 minutos** para propagar completamente. Durante esse tempo:

- ✅ A API REST funcionará normalmente (`https://ecvjgixhcfmkdfbnueqh.supabase.co`)
- ❌ Conexões diretas ao banco via `db.ecvjgixhcfmkdfbnueqh.supabase.co` falharão

### Segurança

- ⚠️ **NUNCA** commite arquivos `.env.local` ou `.env.production`
- ⚠️ **NUNCA** compartilhe `SERVICE_ROLE_KEY` publicamente
- ✅ Use `.env.example` como template
- ✅ Guarde credenciais em gerenciador de senhas

---

## 📞 Suporte

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Repo**: https://github.com/idantas/Elisha-admin

---

**Última atualização**: 2025-10-29  
**Criado por**: AI Assistant

