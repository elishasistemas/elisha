# 📝 Como Configurar o .env.local

O arquivo `.env.local` contém variáveis de ambiente privadas e não deve ser commitado no Git.

---

## 🚀 Passo a Passo

### 1. Criar o arquivo `.env.local` na raiz do projeto

```bash
touch .env.local
```

### 2. Copiar e colar este conteúdo no arquivo:

```env
# Configurações do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY2N4Z2Vldml6aHhtY2x2c256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyODc5NDYsImV4cCI6MjA3NTg2Mzk0Nn0.vWxJw8TcmLn0KUN-nJ-hEkNr6ejJeKLeBUgSXeaRgV0

# 🔒 PRIVADA - Service Role Key do Supabase (NUNCA COMMITAR)
# Obtenha em: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY_AQUI

# Configurações do Sistema
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# 📧 Resend - Email Transacional
# Obtenha em: https://resend.com/api-keys
RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### 3. Substituir `SUA_SERVICE_ROLE_KEY_AQUI` pela chave real

1. Acesse: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
2. Copie a chave **"service_role"** (⚠️ não confunda com "anon"!)
3. Cole no lugar de `SUA_SERVICE_ROLE_KEY_AQUI`

---

## ✅ Verificar se está funcionando

Após criar o `.env.local`, reinicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Se aparecer algum erro sobre variáveis faltando, verifique se o arquivo foi criado corretamente.

---

## 🔒 Segurança

⚠️ **NUNCA** commite o arquivo `.env.local` no Git!

Ele já está protegido pelo `.gitignore`, mas sempre verifique antes de fazer commits.

---

## 📋 Variáveis Explicadas

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada de admin do Supabase | ✅ Sim (APIs admin) |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação (localhost em dev) | ✅ Sim |
| `RESEND_API_KEY` | Chave da API Resend para emails | ✅ Sim (envio de emails) |
| `RESEND_FROM_EMAIL` | Email remetente dos convites | ⚠️ Opcional (padrão: onboarding@resend.dev) |

---

## 🐛 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"
- Verifique se o `.env.local` existe na raiz do projeto
- Verifique se a variável está sem comentário (#)
- Reinicie o servidor (`pnpm dev`)

### Emails não estão sendo enviados
- Verifique se `RESEND_API_KEY` está configurada
- Verifique se o valor está correto: `re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc`

### Erro 401 ao criar convites
- Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada corretamente
- Ela deve começar com `eyJhbG...`

