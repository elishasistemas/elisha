# 🌍 Guia Completo: 3 Ambientes (Local, Preview, Production)

## 📋 Visão Geral dos Ambientes

```
┌─────────────────┬──────────────────┬─────────────────┬──────────────────┐
│   AMBIENTE      │     LOCAL        │   PREVIEW (DEV) │   PRODUCTION     │
├─────────────────┼──────────────────┼─────────────────┼──────────────────┤
│ Branch Git      │ feature/*        │ dev             │ main             │
│ Frontend URL    │ localhost:3000   │ elisha-web-dev  │ elisha-web       │
│ Backend URL     │ localhost:3001   │ elisha-api-dev  │ elisha-api       │
│ Supabase DB     │ DEV              │ DEV             │ PROD             │
│ Hospedagem      │ Sua máquina      │ Render          │ Render           │
└─────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

---

## 🔧 1. AMBIENTE LOCAL (Desenvolvimento)

### Propósito
Desenvolvimento local na sua máquina, usando banco de dados DEV do Supabase.

### Configuração

#### Frontend: `apps/web/.env.local`
```env
# API Backend - Local
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase - Projeto DEV
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_dev
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_dev

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### Backend: `apps/api/.env.local`
```env
PORT=3001
NODE_ENV=development

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000,https://elisha-web-dev.onrender.com
FRONTEND_ALLOW_ALL_ORIGINS=false

# Supabase - Projeto DEV
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_dev
SUPABASE_SERVICE_ROLE_KEY=sua_service_key_dev
```

### Como Rodar
```bash
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/v1/docs

---

## 🔄 2. AMBIENTE PREVIEW (Development no Render)

### Propósito
Ambiente de testes/homologação hospedado no Render, usando banco DEV.

### Branch: `dev`

### Configuração no Render

#### **elisha-web-dev** (ou elisha-web Preview Environment)

**Settings → Environment:**
- Branch: `dev`
- Build Command: `cd apps/web && pnpm install && pnpm build`
- Start Command: `cd apps/web && pnpm start`

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://elisha-api-dev.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copiar_do_supabase_dev>
SUPABASE_SERVICE_ROLE_KEY=<copiar_do_supabase_dev>
NEXT_PUBLIC_APP_URL=https://elisha-web-dev.onrender.com
NODE_ENV=development
```

#### **elisha-api-dev** (ou elisha-api Preview Environment)

**Settings → Environment:**
- Branch: `dev`
- Build Command: `cd apps/api && npm install && npm run build`
- Start Command: `cd apps/api && npm run start:prod`

**Environment Variables:**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=https://elisha-web-dev.onrender.com
FRONTEND_ALLOW_ALL_ORIGINS=false
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copiar_do_supabase_dev>
SUPABASE_SERVICE_ROLE_KEY=<copiar_do_supabase_dev>
```

**URLs:**
- Frontend: https://elisha-web-dev.onrender.com
- Backend: https://elisha-api-dev.onrender.com
- Swagger: https://elisha-api-dev.onrender.com/api/v1/docs

---

## 🚀 3. AMBIENTE PRODUCTION

### Propósito
Ambiente de produção real, hospedado no Render, usando banco PROD.

### Branch: `main`

### Configuração no Render

#### **elisha-web** (Production Environment)

**Settings → Environment:**
- Branch: `main`
- Build Command: `cd apps/web && pnpm install && pnpm build`
- Start Command: `cd apps/web && pnpm start`

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://elisha-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=<URL_DO_PROJETO_PROD>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copiar_do_supabase_prod>
SUPABASE_SERVICE_ROLE_KEY=<copiar_do_supabase_prod>
NEXT_PUBLIC_APP_URL=https://elisha-web.onrender.com
NODE_ENV=production
```

#### **elisha-api** (Production Environment)

**Settings → Environment:**
- Branch: `main`
- Build Command: `cd apps/api && npm install && npm run build`
- Start Command: `cd apps/api && npm run start:prod`

**Environment Variables:**
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://elisha-web.onrender.com
FRONTEND_ALLOW_ALL_ORIGINS=false
NEXT_PUBLIC_SUPABASE_URL=<URL_DO_PROJETO_PROD>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copiar_do_supabase_prod>
SUPABASE_SERVICE_ROLE_KEY=<copiar_do_supabase_prod>
```

**URLs:**
- Frontend: https://elisha-web.onrender.com
- Backend: https://elisha-api.onrender.com
- Swagger: https://elisha-api.onrender.com/api/v1/docs

---

## 🔄 Workflow de Desenvolvimento

### 1. Desenvolvimento Local
```bash
# Criar nova feature
git checkout dev
git pull origin dev
git checkout -b feature/nova-funcionalidade

# Desenvolver localmente
# ... código ...

# Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"
```

### 2. Deploy para Preview (DEV)
```bash
# Merge para dev
git checkout dev
git merge feature/nova-funcionalidade
git push origin dev

# ✅ Render deploya automaticamente em:
# - https://elisha-web-dev.onrender.com
# - https://elisha-api-dev.onrender.com
```

### 3. Testar no Preview
- Acesse: https://elisha-web-dev.onrender.com
- Teste todas as funcionalidades
- Valide com stakeholders

### 4. Deploy para Production
```bash
# Após testes aprovados
git checkout main
git merge dev
git push origin main

# ✅ Render deploya automaticamente em PRODUÇÃO:
# - https://elisha-web.onrender.com
# - https://elisha-api.onrender.com
```

---

## 📝 Checklist de Setup

### ☐ 1. Criar Projeto Supabase PROD
- [ ] Criar novo projeto no Supabase para produção
- [ ] Copiar URL e chaves (anon_key e service_role_key)
- [ ] Aplicar migrations/schema do projeto DEV

### ☐ 2. Configurar Branch `dev`
- [ ] Criar branch `dev` se não existir: `git checkout -b dev`
- [ ] Push para remote: `git push origin dev`

### ☐ 3. Configurar Render - Preview Environment
- [ ] No projeto `elisha-web`, criar Preview Environment
  - [ ] Branch: `dev`
  - [ ] Configurar variáveis de ambiente (DEV)
- [ ] No projeto `elisha-api`, criar Preview Environment
  - [ ] Branch: `dev`
  - [ ] Configurar variáveis de ambiente (DEV)

### ☐ 4. Configurar Render - Production Environment
- [ ] No projeto `elisha-web`, Production Environment
  - [ ] Branch: `main`
  - [ ] Configurar variáveis de ambiente (PROD)
- [ ] No projeto `elisha-api`, Production Environment
  - [ ] Branch: `main`
  - [ ] Configurar variáveis de ambiente (PROD)

### ☐ 5. Testar Cada Ambiente
- [ ] Local: http://localhost:3000
- [ ] Preview: https://elisha-web-dev.onrender.com
- [ ] Production: https://elisha-web.onrender.com

---

## 🔍 Como Verificar Qual Ambiente Está Rodando

### No Frontend
Adicione no console ou interface:
```typescript
console.log('Ambiente:', process.env.NODE_ENV);
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### No Backend
```typescript
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Frontend URL:', process.env.FRONTEND_URL);
```

---

## 🆘 Troubleshooting

### Erro de CORS
- Verifique se `FRONTEND_URL` no backend inclui a URL do frontend
- No ambiente local, deve ter: `http://localhost:3000`

### Deploy falha no Render
- Verifique se o Build Command está correto
- Verifique se todas as variáveis de ambiente estão configuradas

### Conexão com banco errado
- Verifique `NEXT_PUBLIC_SUPABASE_URL` em cada ambiente
- DEV deve usar: `tbxumetajqwnmbcqpfmr.supabase.co`
- PROD deve usar: URL do seu projeto PROD

---

## 📞 Suporte

- Documentação Render: https://render.com/docs
- Documentação Supabase: https://supabase.com/docs
- GitHub Issues: https://github.com/elishasistemas/elisha/issues

---

**Última atualização:** 26/11/2025
