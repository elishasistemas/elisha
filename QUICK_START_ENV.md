# 🚀 Quick Start - Configurar Variáveis de Ambiente

## ⚡ Status Atual

Executei o comando `pnpm check-env` e detectei:

### 🔴 Faltando Localmente (.env.local):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← **CRÍTICA**
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY` ← **CRÍTICA**
- `RESEND_FROM_EMAIL` (opcional)

### ⚠️ Faltando no Vercel (provavelmente):
- `SUPABASE_SERVICE_ROLE_KEY` ← **CRÍTICA**
- `RESEND_API_KEY` ← **CRÍTICA**
- `NEXT_PUBLIC_APP_URL` ← **CRÍTICA**

---

## 🎯 Ação Imediata (5 minutos)

### 1. Configurar Localmente

```bash
# 1. Criar o arquivo
touch .env.local

# 2. Copiar este conteúdo para dentro do .env.local:
```

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY2N4Z2Vldml6aHhtY2x2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODc5NDYsImV4cCI6MjA3NTg2Mzk0Nn0.vWxJw8TcmLn0KUN-nJ-hEkNr6ejJeKLeBUgSXeaRgV0

# 🔒 OBTER ESTA CHAVE NO SUPABASE
SUPABASE_SERVICE_ROLE_KEY=COLE_AQUI

# Configurações do Sistema
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# 📧 Resend
RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
RESEND_FROM_EMAIL=onboarding@resend.dev
```

```bash
# 3. Obter SUPABASE_SERVICE_ROLE_KEY
# Abra este link e copie a chave "service_role":
```
🔗 https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api

```bash
# 4. Colar no .env.local no lugar de "COLE_AQUI"

# 5. Verificar se está tudo ok
pnpm check-env
```

---

### 2. Configurar no Vercel (Produção)

🔗 **Abra este link:** https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables

**Adicione estas 6 variáveis (clique "Add New" para cada uma):**

#### Variável 1: NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://wkccxgeevizhxmclvsnz.supabase.co
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variável 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY2N4Z2Vldml6aHhtY2x2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODc5NDYsImV4cCI6MjA3NTg2Mzk0Nn0.vWxJw8TcmLn0KUN-nJ-hEkNr6ejJeKLeBUgSXeaRgV0
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variável 3: SUPABASE_SERVICE_ROLE_KEY 🔴 CRÍTICA
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [OBTER DO SUPABASE - mesma que você colocou no .env.local]
Environments: ✓ Production  ✓ Preview  ✓ Development
```
🔗 Obter em: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api

#### Variável 4: NEXT_PUBLIC_APP_URL 🔴 CRÍTICA
```
Key: NEXT_PUBLIC_APP_URL
Value Production: https://elisha.com.br
Value Preview: https://elisha-admin-git-feat-auth-and-dashboard-idantas-projects.vercel.app
Value Development: http://localhost:3000
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variável 5: RESEND_API_KEY 🔴 CRÍTICA
```
Key: RESEND_API_KEY
Value: re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
Environments: ✓ Production  ✓ Preview  ✓ Development
```

#### Variável 6: RESEND_FROM_EMAIL
```
Key: RESEND_FROM_EMAIL
Value: onboarding@resend.dev
Environments: ✓ Production  ✓ Preview  ✓ Development
```

---

## 🔄 Após Adicionar no Vercel

**1. Fazer Redeploy:**
```
Vercel → Deployments → Latest → ... → Redeploy
```

Ou espere o próximo commit (deploy automático).

**2. Testar em Produção:**
- Acesse: https://elisha.com.br
- Tente criar um convite de usuário
- Verifique se o email é recebido

---

## ✅ Verificar Status

### Local:
```bash
pnpm check-env
```

Deve mostrar: **✅ Todas as variáveis de ambiente estão configuradas!**

### Produção:
1. Acesse: https://elisha.com.br
2. Vá em "Admin" → "Empresas"
3. Impersonar uma empresa
4. Ir em "Configurações" → "Usuários"
5. Clicar "Convidar Usuário"
6. Preencher e enviar

**Resultado esperado:**
- ✅ Convite criado com sucesso
- ✅ Link de convite gerado
- ✅ Email enviado (verificar inbox)

---

## 🐛 Troubleshooting

### Erro 401 ao criar convite:
```
❌ SUPABASE_SERVICE_ROLE_KEY não está configurada no Vercel
```
→ Adicione no Vercel e faça redeploy

### Erro 500 ao enviar email:
```
❌ RESEND_API_KEY não está configurada no Vercel
```
→ Adicione no Vercel e faça redeploy

### Link de convite com localhost:
```
❌ NEXT_PUBLIC_APP_URL não está configurada no Vercel
```
→ Adicione no Vercel e faça redeploy

---

## 📚 Documentação Completa

- **Local**: `SETUP_ENV_LOCAL.md`
- **Vercel**: `VERCEL_ENV_VERIFICATION.md`
- **Checklist**: `ENV_PRODUCTION_CHECKLIST.md`
- **Status**: `ENV_STATUS_SUMMARY.md`

---

## 🎯 TL;DR (Too Long; Didn't Read)

1. **Local**: Criar `.env.local` → Obter `SUPABASE_SERVICE_ROLE_KEY` → Rodar `pnpm check-env`
2. **Vercel**: Abrir [link](https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables) → Adicionar 6 variáveis → Redeploy
3. **Testar**: Criar convite → Verificar email

**Tempo estimado:** 5-10 minutos

