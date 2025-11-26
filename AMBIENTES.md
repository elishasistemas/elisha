# 🌍 Configuração de Ambientes - Elisha

## 📊 Visão Geral dos Ambientes

### 🟢 DESENVOLVIMENTO (Local)
```
┌─────────────────────┐
│   Desenvolvedor     │
│   (seu computador)  │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Frontend (Web)     │────────▶│  Backend (API)      │
│  localhost:3000     │         │  localhost:3001     │
│  Next.js 15         │         │  NestJS             │
└─────────────────────┘         └─────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │  Supabase DEV       │
                                │  (tbxumetajqwn...)  │
                                │  PostgreSQL + Auth  │
                                └─────────────────────┘
```

### 🔴 PRODUÇÃO (Render)
```
┌─────────────────────┐
│   Usuários Finais   │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐         ┌─────────────────────┐
│  Frontend (Web)     │────────▶│  Backend (API)      │
│  Render/Vercel      │         │  Render             │
│  Next.js 15         │         │  NestJS             │
└─────────────────────┘         └─────────────────────┘
                                          │
                                          ▼
                                ┌─────────────────────┐
                                │  Supabase PROD      │
                                │  (seu-projeto-prod) │
                                │  PostgreSQL + Auth  │
                                └─────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
Elisha-admin/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── .env.local         # 🟢 Configuração DEV (não vai pro Git)
│   │   └── .env.example       # Template para referência
│   │
│   └── api/                    # Backend NestJS
│       ├── .env.local         # 🟢 Configuração DEV (não vai pro Git)
│       └── .env.example       # Template para referência
│
├── RENDER_SETUP.md            # 🔴 Guia de configuração PROD
└── AMBIENTES.md               # 📖 Este arquivo
```

---

## 🟢 Desenvolvimento Local

### Arquivos Configurados

#### `apps/web/.env.local`
```bash
# Banco DEV do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### `apps/api/.env.local`
```bash
# CORS - aceita frontend local
FRONTEND_URL=http://localhost:3000

# Banco DEV do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tbxumetajqwnmbcqpfmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

PORT=3001
NODE_ENV=development
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

**Acessar:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger Docs: http://localhost:3001/api/v1/docs

---

## 🔴 Produção (Render)

### Frontend no Render

**Variáveis de Ambiente:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_prod>
SUPABASE_SERVICE_ROLE_KEY=<sua_chave_prod>

NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com
NEXT_PUBLIC_APP_URL=https://seu-frontend.onrender.com

NODE_ENV=production
```

### Backend no Render

**Variáveis de Ambiente:**
```bash
FRONTEND_URL=https://seu-frontend.onrender.com

NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_prod>
SUPABASE_SERVICE_ROLE_KEY=<sua_chave_prod>

PORT=3001
NODE_ENV=production
```

**📖 Guia completo:** [RENDER_SETUP.md](./RENDER_SETUP.md)

---

## 🔑 Gerenciamento de Chaves

### ✅ Seguro (arquivos NÃO vão pro Git)
- `apps/web/.env.local` ← Suas chaves ficam aqui
- `apps/api/.env.local` ← Suas chaves ficam aqui

### ⚠️ Templates (vão pro Git)
- `apps/web/.env.example` ← Sem valores reais
- `apps/api/.env.example` ← Sem valores reais

### 🔒 Nunca comitar
- Chaves do Supabase (ANON_KEY, SERVICE_ROLE_KEY)
- Tokens do GitHub
- Senhas ou credenciais

---

## 🔄 Fluxo de Trabalho

### Desenvolvendo Localmente
1. ✅ Use `.env.local` com banco DEV
2. ✅ Teste suas mudanças
3. ✅ Commit e push do código (não das chaves!)
4. ✅ Deploy no Render com banco PROD

### Fazendo Deploy
1. ✅ Configure variáveis no Render (via dashboard)
2. ✅ Use chaves do projeto PROD do Supabase
3. ✅ Teste após deploy
4. ✅ Monitore logs do Render

---

## 🆘 Troubleshooting

### Problema: CORS blocked
**Causa:** Backend não permite o frontend  
**Solução:** Verifique `FRONTEND_URL` no backend

### Problema: Failed to fetch
**Causa:** Frontend não encontra o backend  
**Solução:** Verifique `NEXT_PUBLIC_API_URL` no frontend

### Problema: Invalid API key
**Causa:** Usando chaves do ambiente errado  
**Solução:** 
- Local deve usar chaves DEV
- Render deve usar chaves PROD

---

## 📞 Suporte

WhatsApp: https://wa.me/5581998620267

---

**Última atualização:** 26/11/2025
