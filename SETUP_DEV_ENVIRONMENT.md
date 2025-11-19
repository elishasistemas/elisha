# 🚀 Setup: Ambiente de Desenvolvimento

## Objetivo

Configurar o ambiente local para continuar a implementação do `plan.yaml` usando a **branch dev do Supabase**.

## Passos

### 1. Criar Branch de Desenvolvimento

```bash
# Salvar mudanças atuais da branch feat/auth-and-dashboard
git add .
git commit -m "fix(prod): corrigir RLS policies para clientes e configurar ambiente produção"

# Criar nova branch de desenvolvimento
git checkout -b dev

# Ou se quiser uma branch específica para o plan.yaml
git checkout -b feature/os-checklist-continuation
```

### 2. Configurar Variáveis de Ambiente para DEV

Criar/atualizar `.env.local`:

```bash
# ===============================================
# 🟢 AMBIENTE DE DESENVOLVIMENTO (branch dev)
# ===============================================
# Branch DEV: ecvjgixhcfmkdfbnueqh
# Dashboard: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
# ===============================================

# Supabase Development (Branch dev)
NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD_DEV>
SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD_DEV>

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Elisha
NEXT_PUBLIC_SUPPORT_WHATSAPP_URL=https://wa.me/5581998620267?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20plataforma%20Elisha.%20Pode%20me%20orientar%3F

# Resend (opcional para dev)
# RESEND_API_KEY=<COPIAR_DO_DASHBOARD_RESEND>
# RESEND_FROM_EMAIL=noreply@elisha.com.br
```

### 3. Obter Credenciais da Branch DEV

1. Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
2. Copie:
   - **Project URL**: `https://ecvjgixhcfmkdfbnueqh.supabase.co`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Verificar Status do Plan.yaml

O plan.yaml está em `.cursor/plan.yaml`. Verificar qual task está pendente:
- Task 0: ✅ COMPLETA (Mapeamento de schema)
- Task 1: ✅ COMPLETA 
- Task 2: ✅ COMPLETA
- Task 3: ✅ COMPLETA (Check-in implementado)
- Task 4: 🔄 PENDENTE - Checklist + Laudo + Evidências
- Task 5: ⏳ PENDENTE - Checkout + Estado do Equipamento

### 5. Aplicar Migrations na Branch DEV

```bash
# Verificar se há migrations pendentes
ls -la supabase/migrations/

# Aplicar migrations na branch dev
# Opção 1: Via Supabase CLI (se configurado)
supabase db push --project-ref ecvjgixhcfmkdfbnueqh

# Opção 2: Via script
node scripts/apply-migrations-to-dev-branch.js

# Opção 3: Via MCP Supabase (já aplicamos algumas)
```

### 6. Iniciar Servidor de Desenvolvimento

```bash
# Instalar dependências (se necessário)
pnpm install

# Iniciar servidor
pnpm dev
```

### 7. Verificar Conexão com Branch DEV

No console do navegador (F12), verificar:
```javascript
// Deve mostrar a URL da branch DEV
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// Esperado: https://ecvjgixhcfmkdfbnueqh.supabase.co
```

## 📝 Checklist

- [ ] Criar branch de desenvolvimento
- [ ] Configurar `.env.local` com credenciais da branch DEV
- [ ] Verificar se migrations estão aplicadas na branch DEV
- [ ] Testar conexão com Supabase DEV
- [ ] Verificar status atual do plan.yaml
- [ ] Continuar implementação da Task 4 (Checklist + Laudo + Evidências)

## 🔄 Voltar para Produção

Se precisar voltar a trabalhar na produção:
```bash
git checkout feat/auth-and-dashboard
# Atualizar .env.local com credenciais da branch PROD
```

## 📖 Referências

- Template DEV: `docs/ENV_DEV_TEMPLATE.md`
- Setup DEV: `docs/DEV_BRANCH_SETUP.md`
- Plan.yaml: `.cursor/plan.yaml`

