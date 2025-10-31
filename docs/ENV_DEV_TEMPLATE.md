# 🟢 Template de .env.local para Desenvolvimento

Copie este conteúdo para `.env.local` na raiz do projeto:

```bash
# ===============================================
# 🟢 AMBIENTE DE DESENVOLVIMENTO (Branch Dev)
# ===============================================
# Branch ID: ecvjgixhcfmkdfbnueqh
# Dashboard: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
# ===============================================

# Supabase Dev Branch
NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD>
SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD>

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# Resend - Email Transacional (opcional para dev)
# RESEND_API_KEY=re_your_api_key_here
# RESEND_FROM_EMAIL=onboarding@resend.dev

# LogSnag - Telemetria (opcional para dev)
# LOGSNAG_TOKEN=your_logsnag_token
# LOGSNAG_PROJECT=elisha-dev
# LOGSNAG_ALLOW_CLIENT=false

# Cron/Snapshot (opcional)
# CRON_SECRET=your_shared_secret
```

## 📝 Como Usar

1. **Obter as credenciais**:
   - Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
   - Copie a `anon public` key
   - Copie a `service_role` key

2. **Criar o arquivo**:
   ```bash
   cd /Users/iversondantas/Projects/Elisha/web-admin
   touch .env.local
   ```

3. **Preencher as credenciais**:
   - Substitua `<COPIAR_DO_DASHBOARD>` pelas chaves copiadas
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role

4. **Rodar o projeto**:
   ```bash
   pnpm dev
   ```

