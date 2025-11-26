# 🚀 Configuração Completa no Render - 3 Ambientes

Este guia explica como configurar **Preview Environment (DEV)** e **Production Environment (PROD)** no Render.

---

## 📋 Pré-requisitos

1. ✅ Conta no Render (https://render.com)
2. ✅ Repositório GitHub conectado
3. ✅ Dois projetos Supabase:
   - DEV: `tbxumetajqwnmbcqpfmr.supabase.co`
   - PROD: (a ser criado)
4. ✅ Branches configuradas:
   - `main` (produção)
   - `dev` (development/preview)

---

## 🎯 Estrutura Final

```
Render Dashboard:
├── elisha-web
│   ├── 🟢 Production (branch: main)
│   └── 🔵 Preview (branch: dev)
│
└── elisha-api
    ├── 🟢 Production (branch: main)
    └── 🔵 Preview (branch: dev)
```

---

## 📝 Passo a Passo

### 1️⃣ Criar Projeto Supabase PROD (se ainda não tem)

1. Acesse: https://app.supabase.com
2. Clique em **"New Project"**
3. Configure:
   - Name: `Elisha Production`
   - Database Password: (anote em local seguro)
   - Region: South America (São Paulo)
4. Aguarde criação (~2 minutos)
5. **Copie as credenciais:**
   - Settings → API
   - Project URL
   - anon/public key
   - service_role key (NUNCA exponha publicamente!)

---

### 2️⃣ Configurar elisha-web no Render

#### A) Configurar Production Environment

1. Acesse: https://dashboard.render.com
2. Selecione o projeto **elisha-web**
3. Vá em **Settings → Environment**
4. Configure:

**General Settings:**
```
Branch: main
Root Directory: (deixe vazio)
Build Command: cd apps/web && pnpm install && pnpm build
Start Command: cd apps/web && pnpm start
```

**Environment Variables (clique em "Add Environment Variable"):**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://elisha-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `<URL_PROD_SUPABASE>` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<ANON_KEY_PROD>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<SERVICE_ROLE_KEY_PROD>` |
| `NEXT_PUBLIC_APP_URL` | `https://elisha-web.onrender.com` |
| `NODE_ENV` | `production` |

5. Clique em **"Save Changes"**

#### B) Criar Preview Environment (DEV)

1. No mesmo projeto **elisha-web**
2. Vá em **Settings → Preview Environments**
3. Clique em **"Add Preview Environment"**
4. Configure:

**General Settings:**
```
Branch: dev
Root Directory: (deixe vazio)
Build Command: cd apps/web && pnpm install && pnpm build
Start Command: cd apps/web && pnpm start
```

**Environment Variables:**

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://elisha-api-dev.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tbxumetajqwnmbcqpfmr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (DEV) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (DEV) |
| `NEXT_PUBLIC_APP_URL` | `https://elisha-web-dev.onrender.com` |
| `NODE_ENV` | `development` |

5. Clique em **"Save Changes"**

---

### 3️⃣ Configurar elisha-api no Render

#### A) Configurar Production Environment

1. Selecione o projeto **elisha-api**
2. Vá em **Settings → Environment**
3. Configure:

**General Settings:**
```
Branch: main
Root Directory: (deixe vazio)
Build Command: cd apps/api && npm install && npm run build
Start Command: cd apps/api && npm run start:prod
```

**Environment Variables:**

| Key | Value |
|-----|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://elisha-web.onrender.com` |
| `FRONTEND_ALLOW_ALL_ORIGINS` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | `<URL_PROD_SUPABASE>` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<ANON_KEY_PROD>` |
| `SUPABASE_SERVICE_ROLE_KEY` | `<SERVICE_ROLE_KEY_PROD>` |

4. Clique em **"Save Changes"**

#### B) Criar Preview Environment (DEV)

1. No mesmo projeto **elisha-api**
2. Vá em **Settings → Preview Environments**
3. Clique em **"Add Preview Environment"**
4. Configure:

**General Settings:**
```
Branch: dev
Root Directory: (deixe vazio)
Build Command: cd apps/api && npm install && npm run build
Start Command: cd apps/api && npm run start:prod
```

**Environment Variables:**

| Key | Value |
|-----|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `development` |
| `FRONTEND_URL` | `https://elisha-web-dev.onrender.com` |
| `FRONTEND_ALLOW_ALL_ORIGINS` | `false` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tbxumetajqwnmbcqpfmr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (DEV) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (DEV) |

5. Clique em **"Save Changes"**

---

## 🔄 Como Funciona o Deploy Automático

### Deploy para Preview (DEV)
```bash
git checkout dev
git add .
git commit -m "feat: nova funcionalidade"
git push origin dev

# ✅ Render detecta push na branch 'dev'
# ✅ Faz deploy automático em:
#    - https://elisha-web-dev.onrender.com
#    - https://elisha-api-dev.onrender.com
```

### Deploy para Production
```bash
git checkout main
git merge dev
git push origin main

# ✅ Render detecta push na branch 'main'
# ✅ Faz deploy automático em:
#    - https://elisha-web.onrender.com
#    - https://elisha-api.onrender.com
```

---

## ✅ Verificar Se Está Funcionando

### 1. Verificar Logs no Render
1. Dashboard Render
2. Selecione o serviço
3. Clique em **"Logs"**
4. Procure por:
   - ✅ `Build successful`
   - ✅ `Deploy successful`
   - ✅ `🚀 Elisha API está rodando`

### 2. Testar URLs

**Preview (DEV):**
- Frontend: https://elisha-web-dev.onrender.com
- Backend: https://elisha-api-dev.onrender.com/api/v1/docs

**Production:**
- Frontend: https://elisha-web.onrender.com
- Backend: https://elisha-api.onrender.com/api/v1/docs

### 3. Verificar Conexão com Supabase

No console do browser (F12):
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

---

## 🆘 Troubleshooting

### ❌ Build falha com erro "pnpm: command not found"

**Solução:**
Adicione variável de ambiente:
```
PNPM_VERSION=8
```

### ❌ Erro 502 Bad Gateway

**Causa:** Backend não está respondendo

**Solução:**
1. Verifique logs do backend
2. Confirme que `PORT=3001` está configurado
3. Confirme que Start Command está correto

### ❌ Erro de CORS

**Causa:** Frontend URL não está em `FRONTEND_URL` do backend

**Solução:**
No backend, configure:
```
FRONTEND_URL=https://elisha-web.onrender.com,https://elisha-web-dev.onrender.com
```

### ❌ Não consegue conectar ao Supabase

**Causa:** Credenciais erradas ou RLS bloqueando

**Solução:**
1. Verifique se copiou as chaves corretas
2. No Supabase, vá em **Authentication → Policies**
3. Verifique se há políticas RLS bloqueando

---

## 📊 Monitoramento

### Render Dashboard
- **Metrics:** CPU, Memory, Response Time
- **Logs:** Real-time logs de cada deploy
- **Events:** Histórico de deploys

### Supabase Dashboard
- **Database:** Uso, queries lentas
- **API:** Requests por endpoint
- **Auth:** Usuários ativos

---

## 🔐 Segurança

### ✅ Boas Práticas Implementadas

1. **Variáveis de ambiente separadas** por ambiente
2. **Service Role Key** nunca exposta no frontend
3. **CORS configurado** restritivamente
4. **RLS habilitado** no Supabase
5. **`.env.local` não commitado** no Git

### ⚠️ NUNCA:

- ❌ Commitar `.env.local` no Git
- ❌ Expor Service Role Key publicamente
- ❌ Desabilitar RLS em produção
- ❌ Usar `FRONTEND_ALLOW_ALL_ORIGINS=true` em produção

---

## 📋 Checklist Final

- [ ] Projeto Supabase PROD criado
- [ ] Credenciais PROD copiadas e salvas
- [ ] Branch `dev` criada e com código atualizado
- [ ] elisha-web Production configurado (branch: main)
- [ ] elisha-web Preview configurado (branch: dev)
- [ ] elisha-api Production configurado (branch: main)
- [ ] elisha-api Preview configurado (branch: dev)
- [ ] Deploy automático testado (push em dev)
- [ ] URLs funcionando (preview e production)
- [ ] Swagger acessível em ambos ambientes
- [ ] Login funcionando em ambos ambientes

---

## 🎉 Pronto!

Agora você tem 3 ambientes configurados:

1. **Local** - Desenvolvimento na sua máquina
2. **Preview** - Testes no Render (branch dev)
3. **Production** - Ambiente real (branch main)

**Workflow:**
```
Local → Preview → Production
  ↓        ↓          ↓
.env.local → dev → main
```

---

**Última atualização:** 26/11/2025
