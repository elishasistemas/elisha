# 🌐 URLs dos Ambientes - Elisha

## 📊 Resumo Rápido

### 🟢 LOCAL (Desenvolvimento)
```
Frontend:  http://localhost:3000
Backend:   http://localhost:3001
Swagger:   http://localhost:3001/api/v1/docs
Supabase:  https://tbxumetajqwnmbcqpfmr.supabase.co (DEV)
```

### 🔵 PREVIEW (Render - branch dev)
```
Frontend:  https://elisha-web-dev.onrender.com
Backend:   https://elisha-api-dev.onrender.com
Swagger:   https://elisha-api-dev.onrender.com/api/v1/docs
Supabase:  https://tbxumetajqwnmbcqpfmr.supabase.co (DEV)
```

### 🔴 PRODUCTION (Render - branch main)
```
Frontend:  https://elisha-web.onrender.com
Backend:   https://elisha-api.onrender.com
Swagger:   https://elisha-api.onrender.com/api/v1/docs
Supabase:  https://pfgaepysyopkbnlaiucd.supabase.co (PROD)
```

---

## 🗄️ Projetos Supabase

### DEV
- **URL**: `https://tbxumetajqwnmbcqpfmr.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/tbxumetajqwnmbcqpfmr
- **Uso**: Local + Preview

### PROD
- **URL**: `https://pfgaepysyopkbnlaiucd.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd
- **Uso**: Production

---

## 🔄 Workflow de Deploy

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   feature/*  │──────▶│     dev      │──────▶│     main     │
│   (Local)    │ merge │  (Preview)   │ merge │ (Production) │
└──────────────┘       └──────────────┘       └──────────────┘
       │                       │                       │
       ▼                       ▼                       ▼
  localhost:3000    elisha-web-dev     elisha-web.onrender
                    .onrender.com
```

---

## ✅ Status da Configuração

- [x] Branch `dev` criada
- [x] Arquivos `.env.development` configurados (DEV)
- [x] Arquivos `.env.production` configurados (PROD)
- [x] Arquivos `.env.local` configurados (Local)
- [ ] Render Preview Environment configurado
- [ ] Render Production Environment configurado
- [ ] Migrations aplicadas no banco PROD

---

## 📋 Próximos Passos

### 1. Aplicar Migrations no Supabase PROD

Acesse o SQL Editor do Supabase PROD e aplique as migrations:
https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/sql/new

### 2. Configurar Render

Siga o guia: `RENDER_CONFIG_COMPLETO.md`

**Preview Environment (branch: dev):**
- Frontend: Use variáveis de `apps/web/.env.development`
- Backend: Use variáveis de `apps/api/.env.development`

**Production Environment (branch: main):**
- Frontend: Use variáveis de `apps/web/.env.production`
- Backend: Use variáveis de `apps/api/.env.production`

### 3. Testar Cada Ambiente

```bash
# Local
cd apps/api && npm run start:dev
cd apps/web && pnpm dev

# Preview - push para dev
git checkout dev
git push origin dev

# Production - push para main
git checkout main
git merge dev
git push origin main
```

---

**Última atualização:** 26/11/2025
