# 🚀 Configuração de Ambiente no Vercel

## 📋 Visão Geral

O Vercel **NÃO** lê os arquivos `.env.*` do seu repositório por segurança. Você precisa configurar as variáveis de ambiente manualmente no dashboard.

---

## 🔐 Por Que o Vercel Não Lê Arquivos .env?

**Segurança**! ✅
- `.env.*` contém credenciais sensíveis
- Se fossem commitados, ficariam expostos no GitHub
- Vercel força você a configurar no dashboard (mais seguro)

---

## 🎯 Ambientes do Vercel

O Vercel tem **3 ambientes**:

```
┌──────────────────────────────────────────┐
│  1. Production      (Branch: main)       │ → Clientes reais
├──────────────────────────────────────────┤
│  2. Preview         (PRs e branches)     │ → Testes antes do merge
├──────────────────────────────────────────┤
│  3. Development     (Local)              │ → Seu computador
└──────────────────────────────────────────┘
```

---

## 📊 Fluxo Completo

### **Desenvolvimento Local** 🟢

```bash
# Seu computador
$ pnpm dev

Lê arquivo local:
  .env.development

Conecta em:
  dahfsyvxvacibowwxgns (DEV) ✅
```

### **Preview Deploy** (Pull Requests) 🔵

```
# Vercel faz deploy automático de PRs
GitHub PR → Vercel Deploy

Usa variáveis do Vercel:
  Environment: Preview
  Pode usar DEV ou PROD (sua escolha)

Conecta em:
  dahfsyvxvacibowwxgns (DEV) ✅ (recomendado para PRs)
```

### **Production Deploy** (Main Branch) 🔴

```
# Deploy em produção
Git push to main → Vercel Deploy

Usa variáveis do Vercel:
  Environment: Production

Conecta em:
  wkccxgeevizhxmclvsnz (PROD) ✅
```

---

## 🛠️ Configurar Vercel (Passo a Passo)

### **1. Acessar Dashboard**

```
https://vercel.com/dashboard
```

1. Selecione o projeto: `elisha-admin`
2. Vá em: **Settings** → **Environment Variables**

### **2. Configurar Variáveis de PRODUÇÃO**

Clique em **Add New**:

#### **Variável 1: NEXT_PUBLIC_SUPABASE_URL**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://wkccxgeevizhxmclvsnz.supabase.co
Environment: ☑️ Production
```

#### **Variável 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <pegar do .env.local.backup>
Environment: ☑️ Production
```

#### **Variável 3: SUPABASE_SERVICE_ROLE_KEY**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: <pegar do .env.local.backup>
Environment: ☑️ Production
```

#### **Variável 4: RESEND_API_KEY**
```
Key: RESEND_API_KEY
Value: <sua key>
Environment: ☑️ Production
```

#### **Variável 5: LOGSNAG_TOKEN**
```
Key: LOGSNAG_TOKEN
Value: <sua key>
Environment: ☑️ Production
```

#### **Variável 6: LOGSNAG_PROJECT**
```
Key: LOGSNAG_PROJECT
Value: elisha (ou elisha-prod)
Environment: ☑️ Production
```

#### **Variável 7: CRON_SECRET**
```
Key: CRON_SECRET
Value: <gerar hash aleatório>
Environment: ☑️ Production
```

### **3. Configurar Variáveis de PREVIEW** (Opcional)

Para testar PRs contra o banco de DEV:

```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://dahfsyvxvacibowwxgns.supabase.co
Environment: ☑️ Preview

Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <pegar do .env.development>
Environment: ☑️ Preview

Key: SUPABASE_SERVICE_ROLE_KEY
Value: <pegar do .env.development>
Environment: ☑️ Preview
```

---

## 🔍 Como Verificar Qual Banco o Vercel Está Usando

### **Método 1: Ver nas Variáveis de Ambiente**

1. Vercel Dashboard → Settings → Environment Variables
2. Procurar `NEXT_PUBLIC_SUPABASE_URL`
3. Ver o valor:
   - `wkccxgeevizhxmclvsnz` → **PROD** ✅
   - `dahfsyvxvacibowwxgns` → **DEV** (não recomendado em prod)

### **Método 2: Console do Navegador (no site deployado)**

1. Abrir seu site: `https://elisha-admin.vercel.app`
2. Abrir DevTools (F12)
3. No Console:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
4. Ver a URL retornada

### **Método 3: Build Logs**

1. Vercel Dashboard → Deployments
2. Clicar no último deploy
3. Ver "Build Logs"
4. Procurar por "Environment" ou "NEXT_PUBLIC_SUPABASE_URL"

---

## 📊 Resumo Visual

### **Onde Cada Ambiente Lê as Variáveis**

```
┌─────────────────────────────────────────────────────┐
│  Local (pnpm dev)                                   │
│  ├─ .env.development    ✅ DEV                      │
│  └─ .env.local          ❌ (backup, não usar)       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Vercel Preview (PRs)                               │
│  ├─ Vercel Dashboard → Preview Vars ✅ DEV          │
│  └─ Arquivos .env.*     ❌ NÃO são lidos            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Vercel Production (main branch)                    │
│  ├─ Vercel Dashboard → Production Vars ✅ PROD      │
│  └─ Arquivos .env.*     ❌ NÃO são lidos            │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Configuração

### **Produção (Obrigatório)**
- [ ] Acessar Vercel Dashboard
- [ ] Ir em Settings → Environment Variables
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_URL` (Production) → **PROD**
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production) → **PROD**
- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` (Production) → **PROD**
- [ ] Adicionar outras variáveis (RESEND, LOGSNAG, etc.)
- [ ] Fazer redeploy: `git push` ou Vercel Dashboard → Redeploy

### **Preview (Opcional)**
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_URL` (Preview) → **DEV**
- [ ] Adicionar `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Preview) → **DEV**
- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` (Preview) → **DEV**
- [ ] Testar criando um PR

---

## 🔄 Workflow Completo

```
1. Desenvolvimento Local (DEV)
   ├─ Arquivo: .env.development
   ├─ Banco: dahfsyvxvacibowwxgns
   └─ Comando: pnpm dev
      ↓
2. Commit & Push
   ├─ git commit -m "feat: nova feature"
   ├─ git push origin feature/x
   └─ Criar PR
      ↓
3. Preview Deploy (DEV)
   ├─ Vercel auto-deploys PR
   ├─ Banco: dahfsyvxvacibowwxgns (se configurado)
   └─ Testar: https://elisha-admin-pr-123.vercel.app
      ↓
4. Merge to Main
   ├─ PR aprovado → merge
   └─ git push origin main
      ↓
5. Production Deploy (PROD)
   ├─ Vercel auto-deploys main
   ├─ Banco: wkccxgeevizhxmclvsnz
   └─ Live: https://elisha-admin.vercel.app
```

---

## 🆘 Troubleshooting

### **Problema: "Deploy conectou em DEV ao invés de PROD"**

```bash
# Verificar variáveis no Vercel:
1. Dashboard → Settings → Environment Variables
2. Procurar NEXT_PUBLIC_SUPABASE_URL
3. Verificar se está com o valor de PROD:
   https://wkccxgeevizhxmclvsnz.supabase.co

# Se estiver errado:
1. Editar a variável
2. Salvar
3. Fazer redeploy
```

### **Problema: "Variáveis não atualizaram após mudança"**

```bash
# Vercel faz cache do build
# Precisa fazer redeploy:

1. Vercel Dashboard → Deployments
2. Clicar nos "..." do último deploy
3. Clicar em "Redeploy"
4. Aguardar novo build
```

### **Problema: "Como pegar credenciais de PROD?"**

```bash
# No seu computador:
cat .env.local.backup | grep SUPABASE

# Copiar os valores para o Vercel Dashboard
```

---

## 🎯 Comandos Úteis

### **Ver variáveis locais (DEV)**
```bash
cat .env.development | grep SUPABASE_URL
```

### **Ver variáveis de backup (PROD)**
```bash
cat .env.local.backup | grep SUPABASE_URL
```

### **Verificar qual arquivo está sendo usado**
```bash
ls .env.local 2>/dev/null && echo "🔴 PROD" || echo "🟢 DEV"
```

---

## 📞 Referências

- **Vercel Docs**: https://vercel.com/docs/environment-variables
- **Next.js Docs**: https://nextjs.org/docs/basic-features/environment-variables
- **Supabase Docs**: https://supabase.com/docs/guides/cli/managing-environments

---

**Última atualização**: 2025-10-29  
**Versão**: 1.0.0

