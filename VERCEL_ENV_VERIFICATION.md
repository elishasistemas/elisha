# 🔍 Verificação de Variáveis de Ambiente - Vercel

## 📋 Checklist de Variáveis Obrigatórias

### ✅ Como Verificar no Vercel

1. **Acesse o Dashboard do Vercel:**
   ```
   https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables
   ```

2. **Verifique se TODAS estas variáveis estão configuradas:**

---

## 🔑 Variáveis Obrigatórias

### 1. Supabase (3 variáveis)

#### ✓ `NEXT_PUBLIC_SUPABASE_URL`
- **Valor**: `https://wkccxgeevizhxmclvsnz.supabase.co`
- **Environment**: Production, Preview, Development (todas)
- **Status**: ⚠️ Verificar no Vercel

#### ✓ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY2N4Z2Vldml6aHhtY2x2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODc5NDYsImV4cCI6MjA3NTg2Mzk0Nn0.vWxJw8TcmLn0KUN-nJ-hEkNr6ejJeKLeBUgSXeaRgV0`
- **Environment**: Production, Preview, Development (todas)
- **Status**: ⚠️ Verificar no Vercel

#### ✓ `SUPABASE_SERVICE_ROLE_KEY` 🔒 **PRIVADA**
- **Onde obter**: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
- **Environment**: Production, Preview, Development (todas)
- **⚠️ CRÍTICO**: Esta variável é necessária para:
  - Criar convites de usuário
  - Deletar usuários
  - Operações administrativas
- **Status**: ⚠️ **VERIFICAR SE ESTÁ CONFIGURADA** - Sem ela, as APIs de admin falham!

---

### 2. URL da Aplicação (1 variável)

#### ✓ `NEXT_PUBLIC_APP_URL`
- **Production**: `https://elisha.com.br` (ou o domínio principal)
- **Preview**: `https://elisha-admin-git-feat-auth-and-dashboard-idantas-projects.vercel.app`
- **Development**: `http://localhost:3000`
- **⚠️ IMPORTANTE**: URLs de convite e emails dependem desta variável
- **Status**: ⚠️ Verificar no Vercel

---

### 3. Resend - Email (2 variáveis)

#### ✓ `RESEND_API_KEY` 🔒 **PRIVADA**
- **Valor**: `re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc`
- **Environment**: Production, Preview, Development (todas)
- **⚠️ CRÍTICO**: Sem esta variável, emails de convite não são enviados!
- **Status**: ⚠️ **VERIFICAR SE ESTÁ CONFIGURADA**

#### ✓ `RESEND_FROM_EMAIL`
- **Valor padrão**: `onboarding@resend.dev`
- **Valor recomendado**: Seu domínio verificado (ex: `noreply@elisha.com.br`)
- **Environment**: Production, Preview, Development (todas)
- **Status**: ⚠️ Verificar no Vercel

---

## 🎯 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ Vercel Environment Variables - elisha-admin                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📡 NEXT_PUBLIC_SUPABASE_URL              [✓] Configurada   │
│ 🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY         [✓] Configurada   │
│ 🔒 SUPABASE_SERVICE_ROLE_KEY             [?] Verificar     │
│                                                             │
│ 🌐 NEXT_PUBLIC_APP_URL                   [?] Verificar     │
│                                                             │
│ 📧 RESEND_API_KEY                        [?] Verificar     │
│ 📬 RESEND_FROM_EMAIL                     [?] Verificar     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Como Adicionar Variáveis Faltando

### Via Vercel Dashboard:

1. Acesse: https://vercel.com/idantas-projects/elisha-admin/settings/environment-variables
2. Clique em **"Add New"**
3. Preencha:
   - **Key**: Nome da variável (ex: `SUPABASE_SERVICE_ROLE_KEY`)
   - **Value**: Valor da variável
   - **Environments**: Selecione **Production**, **Preview**, e **Development**
4. Clique em **"Save"**
5. **Importante**: Após adicionar, faça **Redeploy** do projeto

### Via Vercel CLI:

```bash
# Exemplo: Adicionar SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

# Exemplo: Adicionar RESEND_API_KEY
vercel env add RESEND_API_KEY production preview development
```

---

## 🔴 Variáveis Faltando = Erros Esperados

| Variável Faltando | Erro Esperado |
|-------------------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **401 "Não autenticado"** ao criar convites<br>❌ **500** ao deletar usuários |
| `RESEND_API_KEY` | ❌ **500** ao enviar emails<br>⚠️ Convites criados mas emails não enviados |
| `NEXT_PUBLIC_APP_URL` | ⚠️ URLs de convite incorretas (localhost) |
| `RESEND_FROM_EMAIL` | ⚠️ Emails enviados de `onboarding@resend.dev` |

---

## ✅ Próximos Passos

1. **Verificar Vercel Dashboard** - Conferir quais variáveis estão configuradas
2. **Adicionar Faltando** - Usar o dashboard ou CLI
3. **Redeploy** - Após adicionar variáveis, fazer redeploy do projeto
4. **Testar** - Criar convite e verificar se email é enviado

---

## 📞 Obter Chaves

### Supabase Service Role Key
```
https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
```
👉 Copie a chave **"service_role"** (não a "anon"!)

### Resend API Key
```
https://resend.com/api-keys
```
👉 Sua chave: `re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc` (já configurada no .env.local)

### Verificar Domínio Resend
```
https://resend.com/domains
```
👉 Se tiver domínio verificado (ex: `elisha.com.br`), use `noreply@elisha.com.br` em `RESEND_FROM_EMAIL`

