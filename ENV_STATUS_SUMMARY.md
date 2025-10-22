# 📊 Status das Variáveis de Ambiente

## 🎯 Resumo Rápido

### Arquivos Criados:
- ✅ `VERCEL_ENV_VERIFICATION.md` - Guia completo de verificação no Vercel
- ✅ `SETUP_ENV_LOCAL.md` - Instruções para criar `.env.local` localmente
- ✅ `env.example` - Atualizado com novas variáveis

---

## 📋 Checklist de Ação

### 1️⃣ Configurar Localmente (.env.local)

```bash
# Criar o arquivo
touch .env.local

# Editar e adicionar as variáveis
# Consulte: SETUP_ENV_LOCAL.md
```

**Variáveis necessárias:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL` (já preenchida)
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (já preenchida)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - **OBTER do Supabase Dashboard**
- ✅ `NEXT_PUBLIC_APP_URL` (localhost para dev)
- ✅ `RESEND_API_KEY` (já tenho: `re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc`)
- ✅ `RESEND_FROM_EMAIL` (padrão: `onboarding@resend.dev`)

---

### 2️⃣ Configurar no Vercel (Produção)

**Link direto:**
🔗 https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables

**Variáveis necessárias (TODAS devem estar em Production + Preview + Development):**

| Variável | Status | Crítico |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ⚠️ Verificar | ✅ Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚠️ Verificar | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **VERIFICAR** | 🔴 **CRÍTICO** |
| `NEXT_PUBLIC_APP_URL` | ⚠️ **VERIFICAR** | ✅ Sim |
| `RESEND_API_KEY` | ⚠️ **VERIFICAR** | 🔴 **CRÍTICO** |
| `RESEND_FROM_EMAIL` | ⚠️ Verificar | ⚠️ Opcional |

---

## 🚨 Variáveis Críticas Faltando

### Se `SUPABASE_SERVICE_ROLE_KEY` não estiver no Vercel:
❌ **Erro 401** ao criar convites  
❌ **Erro 500** ao deletar usuários  
❌ APIs administrativas não funcionam

**Como obter:**
1. Acesse: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
2. Copie a chave **"service_role"** (secret, não a "anon"!)
3. Cole no Vercel em todas as environments

---

### Se `RESEND_API_KEY` não estiver no Vercel:
⚠️ **Erro 500** ao enviar emails  
⚠️ Convites criados mas usuários não recebem email

**Chave disponível:**
```
re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
```

---

### Se `NEXT_PUBLIC_APP_URL` não estiver no Vercel:
⚠️ URLs de convite incorretas (aparecem como localhost)  
⚠️ Emails com links quebrados

**Valor correto para Production:**
```
https://elisha.com.br
```
Ou se ainda não tiver domínio customizado:
```
https://elisha-admin-idantas-projects.vercel.app
```

---

## ✅ Próximos Passos

1. **Verificar Vercel** → Abrir: https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables
2. **Adicionar Faltando** → Se alguma variável crítica estiver faltando, adicionar
3. **Redeploy** → Após adicionar variáveis, fazer redeploy (automatic ou manual)
4. **Criar .env.local** → Seguir instruções em `SETUP_ENV_LOCAL.md`
5. **Testar** → Criar convite e verificar se email é enviado

---

## 🔍 Como Verificar se Está Funcionando

### Teste Local:
```bash
pnpm dev
# Acessar: http://localhost:3000
# Tentar criar convite de usuário
```

### Teste Produção:
```
https://elisha.com.br (ou URL do Vercel)
# Tentar criar convite de usuário
# Verificar se email é recebido
```

---

## 📞 Links Úteis

- **Vercel Env Vars**: https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables
- **Supabase API Keys**: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
- **Resend API Keys**: https://resend.com/api-keys
- **Resend Domains**: https://resend.com/domains

