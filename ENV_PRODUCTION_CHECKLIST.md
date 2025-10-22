# Checklist de Variáveis de Ambiente - Produção

## ✅ Variáveis Obrigatórias no Vercel

Certifique-se de que todas essas variáveis estão configuradas no **Vercel → Settings → Environment Variables**:

### 1. Supabase (Obrigatórias)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (PRIVADA - NUNCA COMMITAR)
```

### 2. URL da Aplicação (Obrigatória)
```bash
NEXT_PUBLIC_APP_URL=https://web-admin-two-nu.vercel.app
```

### 3. Resend (Email - Obrigatória para envio de convites)
```bash
RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
RESEND_FROM_EMAIL=onboarding@resend.dev  # (ou seu domínio verificado)
```

---

## 🔍 Como Verificar

### Via Vercel Dashboard:
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Confirme que todas as variáveis acima estão presentes
3. Verifique se estão marcadas para **Production**, **Preview** e **Development**

### Via Terminal (local):
```bash
# Verificar se .env.local contém todas
cat .env.local | grep -E "SUPABASE|RESEND|NEXT_PUBLIC"
```

---

## ⚠️ Problemas Comuns

### Erro: "Não autenticado" ao criar convite
- **Causa**: `SUPABASE_SERVICE_ROLE_KEY` não está configurada
- **Solução**: Adicionar a key no Vercel e fazer redeploy

### Erro: "User not found" ao deletar
- **Causa**: `SUPABASE_SERVICE_ROLE_KEY` não está configurada ou inválida
- **Solução**: Verificar se a key está correta no Vercel

### Erro: Email não enviado
- **Causa**: `RESEND_API_KEY` não configurada ou inválida
- **Solução**: Verificar API key em https://resend.com/api-keys

---

## 🚀 Depois de Configurar

1. Fazer redeploy no Vercel (ou fazer novo push)
2. Testar fluxo completo:
   - Criar convite como super admin
   - Verificar se email chegou
   - Aceitar convite
   - Verificar acesso ao dashboard

---

## 📝 Notas

- A `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS, use apenas em APIs server-side
- Nunca exponha a service role key no frontend
- A `NEXT_PUBLIC_*` é exposta no frontend (apenas dados públicos)

