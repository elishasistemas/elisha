# 📧 Configurar Envio de Convites por Email

## 🎯 Situação Atual

Seu sistema **JÁ CRIA convites**, mas não envia emails automaticamente. O admin precisa copiar o link manualmente e enviar.

Para **automatizar o envio de emails**, você tem 2 opções:

---

## ✅ **Opção 1: Usar Resend + Edge Function (Recomendado)**

Você já tem Resend configurado! Vamos criar uma Edge Function que envia o email automaticamente quando um convite é criado.

### **Passo 1: Criar Edge Function no Supabase**

1. Acesse o Supabase Dashboard:
   - **DEV**: https://supabase.com/dashboard/project/tbxumetajqwnmbcqpfmr/functions
   - **PROD**: https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/functions

2. Clique em **"Create a new function"**

3. Nome da função: `send-invite-email`

4. Cole o código:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface InvitePayload {
  email: string
  token: string
  role: string
  empresa_nome: string
}

serve(async (req) => {
  try {
    const { email, token, role, empresa_nome }: InvitePayload = await req.json()

    // URL do convite
    const inviteUrl = `${Deno.env.get('FRONTEND_URL')}/signup?token=${token}`

    // Enviar email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Elisha Admin <noreply@elisha.app>',
        to: [email],
        subject: `Convite para acessar ${empresa_nome} - Elisha Admin`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Você foi convidado para acessar o Elisha Admin</h2>
            <p>Olá!</p>
            <p>Você foi convidado para acessar o sistema <strong>${empresa_nome}</strong> como <strong>${role === 'admin' ? 'Administrador' : 'Técnico'}</strong>.</p>
            
            <p style="margin: 32px 0;">
              <a href="${inviteUrl}" 
                 style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Aceitar Convite
              </a>
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Este convite expira em 7 dias e só pode ser usado uma vez.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Se você não esperava este convite, pode ignorar este email.
            </p>
            
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="color: #999; font-size: 12px;">
              Elisha - Sistema Inteligente de Gestão para Empresas de Elevadores
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Erro ao enviar email')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

5. **Deploy** a função

---

### **Passo 2: Configurar Variáveis de Ambiente**

Na página da Edge Function, adicione:

```
RESEND_API_KEY=re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
FRONTEND_URL=https://elisha-web.onrender.com (PROD) ou https://elisha-web-dev.onrender.com (DEV)
```

---

### **Passo 3: Criar Database Trigger**

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar função que chama a Edge Function quando um convite é criado
CREATE OR REPLACE FUNCTION trigger_send_invite_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_nome TEXT;
  v_function_url TEXT;
BEGIN
  -- Pegar nome da empresa
  SELECT nome INTO v_empresa_nome
  FROM empresas
  WHERE id = NEW.empresa_id;

  -- URL da Edge Function (ajuste conforme seu projeto)
  v_function_url := current_setting('app.settings.supabase_functions_url', true) || '/send-invite-email';
  
  -- Chamar Edge Function via HTTP (não bloqueante)
  PERFORM net.http_post(
    url := v_function_url,
    body := json_build_object(
      'email', NEW.email,
      'token', NEW.token,
      'role', NEW.role,
      'empresa_nome', COALESCE(v_empresa_nome, 'Sistema')
    )::text,
    headers := json_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )::jsonb
  );

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS on_invite_created ON invites;
CREATE TRIGGER on_invite_created
  AFTER INSERT ON invites
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_invite_email();
```

---

## ✅ **Opção 2: Configurar SMTP no Supabase (Mais Simples, Menos Flexível)**

1. Acesse: https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/settings/auth

2. Vá em **"SMTP Settings"**

3. Configure com Resend ou outro provedor:

### **Usando Resend como SMTP:**

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP Username: resend
SMTP Password: re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc
Sender Email: noreply@elisha.app (configure um domínio verificado na Resend)
```

### **Usando Gmail (para testes):**

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP Username: seu-email@gmail.com
SMTP Password: senha-de-app (não a senha normal!)
```

**Importante:** Para Gmail, você precisa gerar uma "Senha de app" em:
https://myaccount.google.com/apppasswords

4. Teste enviando um email de teste pelo dashboard

---

## 🎯 **Qual Opção Escolher?**

| Critério | Opção 1 (Edge Function) | Opção 2 (SMTP) |
|----------|------------------------|----------------|
| **Controle do template** | ✅ Total | ⚠️ Limitado |
| **Customização** | ✅ Máxima | ⚠️ Básica |
| **Complexidade** | ⚠️ Média | ✅ Fácil |
| **Velocidade** | ✅ Rápido | ✅ Rápido |
| **Custo** | ✅ Grátis (Resend tier gratuito) | ✅ Grátis |
| **Recomendado para** | Produção | Testes/MVP |

---

## 🚀 **Recomendação:**

Para o seu caso, sugiro:

1. **Curto prazo (agora):** Use **Opção 2 (SMTP)** para começar a enviar emails rapidamente
2. **Médio prazo:** Migre para **Opção 1 (Edge Function)** quando quiser templates mais bonitos e controle total

---

## 📝 **Próximos Passos:**

Quer que eu te ajude a:
1. ✅ Configurar o SMTP no Supabase agora (5 minutos)?
2. ✅ Criar a Edge Function completa (15 minutos)?
3. ✅ Configurar um domínio customizado na Resend para emails profissionais?

Escolha uma opção e te guio passo a passo! 🚀
