# 🔧 Template: .env.development

## 📋 Instruções

1. **Copie este conteúdo** para um novo arquivo `.env.development` na raiz do projeto
2. **Preencha as credenciais** conforme instruções abaixo
3. **NUNCA** commite este arquivo no Git

---

## 📄 Conteúdo do `.env.development`

```bash
# ===============================================
# 🔧 DESENVOLVIMENTO (Supabase Develop Branch)
# ===============================================
# Branch ID: dahfsyvxvacibowwxgns
# URL Dashboard: https://supabase.com/dashboard/project/dahfsyvxvacibowwxgns
# 
# ⚠️ ATENÇÃO: NÃO COMMITAR ESTE ARQUIVO!
# ⚠️ Este arquivo contém credenciais sensíveis
# ===============================================

# Supabase Development Branch
NEXT_PUBLIC_SUPABASE_URL=https://dahfsyvxvacibowwxgns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<PEGAR_NO_DASHBOARD>
SUPABASE_SERVICE_ROLE_KEY=<PEGAR_NO_DASHBOARD>

# Database (informação pública, apenas para referência)
DATABASE_URL=postgresql://postgres:yLmgxqlLDFoNMXHuSLpLTKKKDJFylDlb@db.dahfsyvxvacibowwxgns.supabase.co:5432/postgres

# Resend (Email) - pode usar mesmo de prod para testes
RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
RESEND_FROM_EMAIL=onboarding@resend.dev

# LogSnag (Analytics/Monitoring) - projeto dev separado recomendado
LOGSNAG_TOKEN=4e19f24446464ac6e84ad36dda4e4bc2
LOGSNAG_PROJECT=elisha-dev
LOGSNAG_ALLOW_CLIENT=true

# Configurações do Sistema
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# Cron Job Secret (para proteger endpoints de cron)
CRON_SECRET=8e50c788fe18daba7ae5e3b1c40c28d9963c63a13d61ab273fa92d4cd6f1196d
```

---

## 🔑 Como pegar as credenciais do Develop Branch

### **Passo 1: Acessar Dashboard**
Abra no navegador:
```
https://supabase.com/dashboard/project/dahfsyvxvacibowwxgns/settings/api
```

### **Passo 2: Copiar Keys**
Na página de **API Settings**, copie:

1. **Project URL** → já está correto: `https://dahfsyvxvacibowwxgns.supabase.co`
2. **anon public** → Cole em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role** → Cole em `SUPABASE_SERVICE_ROLE_KEY`

### **Passo 3: Salvar e Testar**
```bash
# 1. Salvar o arquivo .env.development
# 2. Reiniciar servidor de desenvolvimento
pnpm dev

# 3. Testar se conectou no branch correto
# Abra http://localhost:3000 e veja no console do navegador:
# "[Supabase] Connected to: dahfsyvxvacibowwxgns"
```

---

## 🔄 Alternando entre Ambientes

### **Desenvolvimento (padrão)**
```bash
# Use .env.development
pnpm dev
```

### **Produção (local)**
```bash
# Use .env.local (aponta para prod)
cp .env.local .env.development.backup
pnpm dev
```

---

## ⚠️ Importante

- ✅ `.env.development` está no `.gitignore`
- ✅ Use apenas para testes locais
- ✅ Dados do develop branch NÃO afetam produção
- ✅ Pode quebrar à vontade, é ambiente isolado

---

## 🆘 Troubleshooting

### Erro: "Failed to connect to Supabase"
```bash
# Verificar se o branch está ativo
supabase branches get develop --project-ref wkccxgeevizhxmclvsnz

# Se STATUS != ACTIVE_HEALTHY, aguardar
```

### Erro: "Invalid API key"
```bash
# Verificar se copiou as keys certas do dashboard
# Deve ser do projeto dahfsyvxvacibowwxgns, não wkccxgeevizhxmclvsnz
```

### Erro: "CORS error"
```bash
# Ir no dashboard e adicionar http://localhost:3000 nos CORS
# Settings → API → CORS → Add URL
```

---

**Última atualização**: 2025-10-29

