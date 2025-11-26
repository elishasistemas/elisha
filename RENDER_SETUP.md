# 🚀 Configuração de Produção no Render

## 📋 Visão Geral

Este guia mostra como configurar as variáveis de ambiente no Render para os ambientes de **Produção**.

### Arquitetura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Frontend PROD  │────────▶│  Backend PROD   │────────▶│  Supabase PROD  │
│  (Render)       │         │  (Render)       │         │  (Cloud)        │
│  localhost:3000 │         │  localhost:3001 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## 🔴 Configuração PRODUÇÃO no Render

### 1. Frontend (apps/web)

Acesse: https://dashboard.render.com/web/seu-servico-frontend/env

**Variáveis de Ambiente:**

```bash
# Supabase PROD
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<pegar_no_dashboard_prod>
SUPABASE_SERVICE_ROLE_KEY=<pegar_no_dashboard_prod>

# URLs do Sistema
NEXT_PUBLIC_APP_URL=https://seu-frontend.onrender.com
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com

# Configurações do App
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267
NODE_ENV=production
```

**Como pegar as chaves do Supabase PROD:**
1. Acesse: https://supabase.com/dashboard/projects
2. Selecione seu projeto de **PRODUÇÃO**
3. Vá em `Settings` → `API`
4. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (🔐 **NUNCA compartilhe**)

---

### 2. Backend API (apps/api)

Acesse: https://dashboard.render.com/web/seu-servico-backend/env

**Variáveis de Ambiente:**

```bash
# Configurações da API
PORT=3001
NODE_ENV=production

# CORS - Frontend permitido
FRONTEND_URL=https://seu-frontend.onrender.com
FRONTEND_ALLOW_ALL_ORIGINS=false

# Supabase PROD (mesmas chaves do frontend)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<pegar_no_dashboard_prod>
SUPABASE_SERVICE_ROLE_KEY=<pegar_no_dashboard_prod>
```

---

## 🟢 Configuração DESENVOLVIMENTO (Local)

### Já Configurado! ✅

Seus arquivos `.env.local` já estão configurados para:

- **Frontend**: `apps/web/.env.local`
  - Aponta para `http://localhost:3001` (backend local)
  - Usa banco DEV do Supabase

- **Backend**: `apps/api/.env.local`
  - Aceita requisições de `http://localhost:3000`
  - Usa banco DEV do Supabase

### Rodar localmente:

```bash
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
pnpm dev
```

---

## 🔍 Como Identificar Qual Ambiente Está Rodando

### Frontend:
```javascript
console.log('Ambiente:', process.env.NODE_ENV)
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Backend:
```javascript
console.log('Ambiente:', process.env.NODE_ENV)
console.log('Frontend permitido:', process.env.FRONTEND_URL)
```

---

## ✅ Checklist de Deploy

### Antes de fazer deploy:

- [ ] Projeto PROD criado no Supabase
- [ ] Migrations aplicadas no banco PROD
- [ ] Variáveis de ambiente configuradas no Render (frontend)
- [ ] Variáveis de ambiente configuradas no Render (backend)
- [ ] CORS configurado corretamente (URL do frontend no backend)
- [ ] Testar localmente antes do deploy

### Após o deploy:

- [ ] Frontend carrega corretamente
- [ ] Backend responde em `/api/v1/health`
- [ ] Login funciona
- [ ] Dados aparecem corretamente
- [ ] CORS não apresenta erros no console

---

## 🆘 Troubleshooting

### Erro: "CORS policy blocked"
- Verifique se `FRONTEND_URL` no backend aponta para a URL correta do frontend
- Exemplo: `https://seu-frontend.onrender.com` (sem barra no final)

### Erro: "Failed to fetch"
- Verifique se `NEXT_PUBLIC_API_URL` no frontend aponta para o backend correto
- Teste o endpoint: `https://seu-backend.onrender.com/api/v1/health`

### Erro: "Invalid API key"
- Verifique se está usando as chaves do projeto correto do Supabase
- DEV local deve usar chaves DEV
- PROD no Render deve usar chaves PROD

---

## 📞 Suporte

Dúvidas? Entre em contato via WhatsApp:
https://wa.me/5581998620267

---

**Atualizado em:** 26/11/2025
