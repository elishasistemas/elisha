# 🚀 Setup Rápido: Ambientes Dev & Prod

## 📋 Resumo

Este projeto usa **Supabase Branches** para separar desenvolvimento e produção:

- **DEV** (Branch `dev`): `ecvjgixhcfmkdfbnueqh` → Desenvolvimento local
- **PROD** (Main Branch): `wkccxgeevizhxmclvsnz` → Produção (Vercel)

---

## ⚡ Quick Start (5 minutos)

### 1. **Obter Credenciais da Branch Dev**

Acesse o dashboard e copie as chaves:
```
https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
```

Você precisará de:
- ✅ `anon public` → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `service_role` → será `SUPABASE_SERVICE_ROLE_KEY`

### 2. **Criar arquivo `.env.local`**

```bash
cd /Users/iversondantas/Projects/Elisha/web-admin

# Criar arquivo
cat > .env.local << 'EOF'
# Supabase Dev Branch
NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267
EOF

# Editar e preencher as chaves
code .env.local
```

### 3. **Rodar o projeto**

```bash
pnpm install
pnpm dev
```

### 4. **Acessar**

```
http://localhost:3000
```

✅ **Pronto!** Você está rodando contra a **branch dev**.

---

## 📊 Status Atual

### ✅ Concluído

- [x] Branch `dev` criada no Supabase
- [x] Branch conectada ao Git (`feat/auth-and-dashboard`)
- [x] Branch está `ACTIVE_HEALTHY`
- [x] Documentação criada
- [x] Templates de ambiente criados

### ⏳ Pendente

- [ ] **Migrations**: Aguardando propagação do DNS (5-30 min)
  - Host: `db.ecvjgixhcfmkdfbnueqh.supabase.co`
  - Status: DNS não está resolvendo ainda
  - Solução: Aguardar ou aplicar via dashboard

### 🔄 Próximos Passos

1. **Aguardar DNS resolver** (teste com `ping db.ecvjgixhcfmkdfbnueqh.supabase.co`)
2. **Aplicar migrations**:
   - Via GitHub: Fazer push → Supabase aplica automaticamente
   - Via CLI: `supabase db push --db-url "..."`
   - Via Dashboard: Copiar/colar SQL manualmente
3. **Popular dados de teste**

---

## 🔍 Verificar Status

### Verificar branch

```bash
supabase branches get dev --project-ref wkccxgeevizhxmclvsnz
```

### Verificar DNS

```bash
# Se resolver, significa que pode aplicar migrations
ping db.ecvjgixhcfmkdfbnueqh.supabase.co
```

### Listar branches

```bash
supabase branches list --project-ref wkccxgeevizhxmclvsnz
```

---

## 🎯 Produção

### Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em **Settings > Environment Variables**
3. Adicione as variáveis do arquivo `docs/ENV_PROD_TEMPLATE.md`
4. Use as credenciais do projeto **main** (`wkccxgeevizhxmclvsnz`)

---

## 📚 Documentação Completa

- **Setup Detalhado**: `docs/DEV_BRANCH_SETUP.md`
- **Template Dev**: `docs/ENV_DEV_TEMPLATE.md`
- **Template Prod**: `docs/ENV_PROD_TEMPLATE.md`
- **Ambientes**: `docs/ENVIRONMENTS_SETUP.md`

---

## 🆘 Problemas Comuns

### Erro: "Invalid API key"

✅ Verifique se copiou as chaves corretas do dashboard da **branch dev**:
```
https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
```

### Erro: "Database connection failed"

✅ O DNS ainda não propagou. Aguarde 5-30 minutos e tente novamente.

### Migrations não aplicadas

✅ Opções:
1. Aguardar DNS resolver e usar CLI
2. Aplicar manualmente via dashboard SQL Editor
3. Fazer push no Git para trigger automático

---

**Última atualização**: 2025-10-29  
**Status**: Branch criada, aguardando DNS propagar para aplicar migrations

