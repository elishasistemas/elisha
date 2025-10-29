# 🔴 Template de Variáveis de Ambiente para Produção (Vercel)

Configure estas variáveis de ambiente no Vercel:

```bash
# ===============================================
# 🔴 AMBIENTE DE PRODUÇÃO (Main Branch)
# ===============================================
# Project ID: wkccxgeevizhxmclvsnz
# Dashboard: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
# ===============================================

# Supabase Production (Main Branch)
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD_PROD>
SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD_PROD>

# App Config
NEXT_PUBLIC_APP_URL=https://elisha-admin.vercel.app
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# Resend - Email Transacional (obrigatório para prod)
RESEND_API_KEY=<COPIAR_DO_DASHBOARD_RESEND>
RESEND_FROM_EMAIL=noreply@elisha.com.br

# LogSnag - Telemetria (recomendado para prod)
LOGSNAG_TOKEN=<COPIAR_DO_DASHBOARD_LOGSNAG>
LOGSNAG_PROJECT=elisha-prod
LOGSNAG_ALLOW_CLIENT=false

# Cron/Snapshot
CRON_SECRET=<GERAR_SECRET_ALEATORIO>
```

## 📝 Como Configurar no Vercel

1. **Acessar o projeto no Vercel**:
   - https://vercel.com/dashboard

2. **Ir para Settings > Environment Variables**

3. **Adicionar cada variável**:
   - Name: Nome da variável (ex: `NEXT_PUBLIC_SUPABASE_URL`)
   - Value: Valor da variável
   - Environment: Selecione `Production`

4. **Obter credenciais do Supabase**:
   - Acesse: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
   - Copie a `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copie a `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

5. **Fazer redeploy**:
   - Após adicionar todas as variáveis, faça um redeploy no Vercel
   - Ou faça um novo push para `main`

## ⚠️ Importante

- Use as credenciais do projeto **main** (`wkccxgeevizhxmclvsnz`)
- **NÃO** use as credenciais da branch dev (`ecvjgixhcfmkdfbnueqh`)
- Verifique se todas as variáveis foram adicionadas antes do deploy

