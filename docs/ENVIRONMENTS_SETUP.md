# 🌍 Guia de Ambientes: Dev & Prod

## 📋 Visão Geral

Este projeto usa **Supabase Preview Branches** para separar ambientes de desenvolvimento e produção.

```
┌─────────────────────────┐
│  PROD (main branch)     │ ← Produção (clientes reais)
│  wkccxgeevizhxmclvsnz   │
│  https://elisha-admin.  │
│  vercel.app             │
└─────────────────────────┘
           ↑
           │ merge após testes
           │
┌─────────────────────────┐
│  DEVELOP (preview)      │ ← Desenvolvimento
│  dahfsyvxvacibowwxgns   │
│  http://localhost:3000  │
└─────────────────────────┘
```

---

## 🔑 Credenciais

### **Produção (Main Branch)**
- **Project ID**: `wkccxgeevizhxmclvsnz`
- **URL**: `https://wkccxgeevizhxmclvsnz.supabase.co`
- **Region**: East US (North Virginia)
- **Database**: `supabase-postgres-17.6.1.029`

### **Desenvolvimento (Develop Branch)**
- **Branch ID**: `dahfsyvxvacibowwxgns`
- **URL**: `https://dahfsyvxvacibowwxgns.supabase.co`
- **Region**: East US (North Virginia) (mesma da prod)
- **Database**: `supabase-postgres-17.6.1.029`

---

## 📂 Arquivos de Configuração

### `.env.local` (Desenvolvimento - Local)
```bash
# Supabase Development Branch
NEXT_PUBLIC_SUPABASE_URL=https://dahfsyvxvacibowwxgns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...develop
SUPABASE_SERVICE_ROLE_KEY=eyJ...develop

# Resend (Dev - usa mesmo de prod, mas emails vão para dev)
RESEND_API_KEY=re_...

# LogSnag (Dev - projeto separado recomendado)
LOGSNAG_API_TOKEN=...
LOGSNAG_PROJECT=elisha-dev
```

### `.env.production` (Produção - Vercel)
```bash
# Supabase Production (Main Branch)
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod
SUPABASE_SERVICE_ROLE_KEY=eyJ...prod

# Resend (Prod)
RESEND_API_KEY=re_...

# LogSnag (Prod)
LOGSNAG_API_TOKEN=...
LOGSNAG_PROJECT=elisha-prod
```

---

## 🚀 Workflow de Desenvolvimento

### **1. Desenvolvimento Local**

```bash
# 1. Criar feature branch no Git
git checkout -b feature/task-5

# 2. Garantir que .env.local aponta para develop
cat .env.local | grep SUPABASE_URL
# Deve mostrar: https://dahfsyvxvacibowwxgns.supabase.co

# 3. Desenvolver normalmente
pnpm dev

# 4. Testar localmente contra branch develop
# (dados de teste não afetam produção)
```

### **2. Migrations**

```bash
# Aplicar migrations no develop
pnpm db:migrate:dev

# Testar se funcionou
pnpm db:status:dev

# Se OK, aplicar em produção
pnpm db:migrate:prod
```

### **3. Deploy**

```bash
# 1. Fazer commit
git add .
git commit -m "feat: nova funcionalidade"

# 2. Push para GitHub
git push origin feature/task-5

# 3. Criar Pull Request no GitHub
# - Vercel auto-deploys preview (usa develop branch)
# - Testar no preview

# 4. Merge to main
# - Vercel auto-deploys prod (usa main branch)
# - Supabase aplica migrations automaticamente
```

---

## 🛠️ Scripts Úteis

### `package.json` (adicionar)

```json
{
  "scripts": {
    "db:migrate:dev": "supabase db push --project-ref dahfsyvxvacibowwxgns",
    "db:migrate:prod": "supabase db push --project-ref wkccxgeevizhxmclvsnz",
    "db:status:dev": "supabase branches get develop --project-ref wkccxgeevizhxmclvsnz",
    "db:status:prod": "supabase projects list",
    "db:seed:dev": "supabase db seed --project-ref dahfsyvxvacibowwxgns",
    "db:reset:dev": "supabase branches delete develop --project-ref wkccxgeevizhxmclvsnz && supabase branches create develop --project-ref wkccxgeevizhxmclvsnz --persistent"
  }
}
```

---

## 📊 Checklist de Setup

### **Desenvolvedor Novo no Projeto**

- [ ] Clonar repositório
- [ ] Copiar `.env.example` para `.env.local`
- [ ] Pedir credenciais do **develop branch** para admin
- [ ] Atualizar `.env.local` com as credenciais
- [ ] `pnpm install`
- [ ] `pnpm dev`
- [ ] Testar login (dados de teste)

### **Admin/DevOps**

- [ ] Criar branch develop no Supabase (já feito ✅)
- [ ] Configurar variáveis de ambiente no Vercel
  - [ ] Production: main branch credentials
  - [ ] Preview: develop branch credentials (opcional)
- [ ] Aplicar todas migrations no develop
- [ ] Popular develop com dados de teste
- [ ] Configurar LogSnag projects (dev + prod)

---

## 🔒 Segurança

### **NUNCA**:
- ❌ Commitar `.env.local` ou `.env.production`
- ❌ Compartilhar `SERVICE_ROLE_KEY` publicamente
- ❌ Testar em produção sem testar em dev antes
- ❌ Aplicar migrations diretamente em prod sem revisar

### **SEMPRE**:
- ✅ Usar `.env.example` como template
- ✅ Guardar credenciais em gerenciador de senhas (1Password/Bitwarden)
- ✅ Testar em develop antes de prod
- ✅ Fazer backup antes de migrations grandes
- ✅ Revisar RLS policies antes de deploy

---

## 🆘 Troubleshooting

### **Erro: "Invalid API key"**
```bash
# Verificar se .env.local tem credenciais corretas
cat .env.local | grep SUPABASE

# Se estiver errado, corrigir e reiniciar dev server
pnpm dev
```

### **Erro: "Database connection failed"**
```bash
# Verificar status do branch
pnpm db:status:dev

# Se CREATING_PROJECT, aguardar
# Se ERROR, reportar no Supabase Dashboard
```

### **Migrations não aplicadas**
```bash
# Verificar migrations pendentes
cd supabase/migrations
ls -la

# Aplicar manualmente
supabase db push --project-ref dahfsyvxvacibowwxgns
```

---

## 📞 Contatos

- **Admin**: Iverson Dantas
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/idantas/Elisha-admin

---

**Última atualização**: 2025-10-29  
**Versão**: 1.0.0

