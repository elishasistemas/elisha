# 🚀 Guia: Retomar Implementação do Plan.yaml em DEV

## Situação Atual

- ✅ Branch atual: `feat/auth-and-dashboard`
- ✅ Task 3 do plan.yaml: **COMPLETA** (Check-in implementado)
- 🔄 Task 4 do plan.yaml: **PENDENTE** (Checklist + Laudo + Evidências)
- 📍 Ambiente: Produção configurada (wkccxgeevizhxmclvsnz)

## Objetivo

Configurar ambiente local para continuar implementação usando **branch DEV do Supabase** (ecvjgixhcfmkdfbnueqh).

## 📋 Passos para Configurar DEV

### Opção 1: Criar Nova Branch de Desenvolvimento (RECOMENDADO)

```bash
# 1. Salvar mudanças atuais (se houver)
git add .
git commit -m "fix(prod): RLS policies e configurações de produção"

# 2. Criar branch de desenvolvimento
git checkout -b dev

# 3. Configurar .env.local para DEV
cp env.example .env.local
# Editar .env.local e configurar credenciais DEV
```

### Opção 2: Continuar na Branch Atual (Alternativa)

```bash
# Apenas configurar .env.local para DEV
# O git tracking não muda, mas você trabalha localmente contra DEV
```

## 🔧 Configurar .env.local para DEV

1. **Criar arquivo** (se não existir):
```bash
touch .env.local
```

2. **Adicionar conteúdo**:
```bash
# ===============================================
# 🟢 AMBIENTE DE DESENVOLVIMENTO (Branch Dev)
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
# RESEND_API_KEY=re_your_api_key_here
# RESEND_FROM_EMAIL=noreply@elisha.com.br
```

3. **Obter credenciais**:
   - Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api
   - Copie `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copie `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Verificar Configuração

```bash
# Executar script de verificação
pnpm run verify-prod-branch

# Ou verificar manualmente
cat .env.local | grep SUPABASE_URL
# Deve mostrar: https://ecvjgixhcfmkdfbnueqh.supabase.co
```

## 📝 Task 4 do Plan.yaml - Próximos Passos

A Task 4 está **PENDENTE** e precisa:

### 1. Checklist
- Renderizar itens do template vinculado à OS
- Usar fonte/relacionamento real do schema

### 2. Laudo/Observações
- Textarea com autosave (debounce)
- Reexibição ao recarregar

### 3. Evidências
- Criar utilitária `uploadOsEvidence(os_id, file, kind)`
- Upload para Storage (bucket oficial)
- Registro na tabela `os_evidencias`
- Suportar: foto, vídeo, áudio e nota (texto)

### 4. RLS
- Garantir leitura/escrita apenas para envolvidos

### 5. Testes
- Upload simulado
- Persistência do laudo/checklist

## 🚀 Comandos Rápidos

```bash
# Configurar tudo automaticamente
./scripts/setup-dev-env.sh

# Verificar branch Supabase configurada
pnpm run verify-prod-branch

# Iniciar servidor de desenvolvimento
pnpm dev

# Verificar se está conectado na branch DEV
# No console do navegador:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
# Deve mostrar: https://ecvjgixhcfmkdfbnueqh.supabase.co
```

## 🔄 Workflow Recomendado

1. **Desenvolvimento Local (DEV branch)**
   - Trabalhar em features novas
   - Testar contra branch DEV do Supabase
   - Commits na branch `dev` ou branch específica da feature

2. **Produção (Main branch)**
   - Merge das features validadas
   - Deploy para Vercel
   - Usar branch PROD do Supabase

## 📖 Referências

- Plan.yaml: `.cursor/plan.yaml`
- Template DEV: `docs/ENV_DEV_TEMPLATE.md`
- Setup DEV: `docs/DEV_BRANCH_SETUP.md`
- Script setup: `scripts/setup-dev-env.sh`

## ⚠️ Importante

- **NÃO commitar `.env.local`** (já está no .gitignore)
- **Sempre verificar** qual branch Supabase está configurada antes de trabalhar
- **Aplicar migrations** na branch DEV antes de desenvolver features novas

