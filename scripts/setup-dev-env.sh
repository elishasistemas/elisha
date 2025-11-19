#!/bin/bash

# Script para configurar ambiente de desenvolvimento
# Uso: ./scripts/setup-dev-env.sh

set -e

echo "🚀 Configurando Ambiente de Desenvolvimento"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se está em uma branch de desenvolvimento
CURRENT_BRANCH=$(git branch --show-current)
echo "📦 Branch atual: ${YELLOW}$CURRENT_BRANCH${NC}"

if [[ "$CURRENT_BRANCH" == "main" ]]; then
  echo "⚠️  Você está na branch main. Criando branch de desenvolvimento..."
  git checkout -b dev
  CURRENT_BRANCH="dev"
fi

# 2. Verificar se .env.local existe
if [ ! -f .env.local ]; then
  echo "📝 Criando .env.local a partir do env.example..."
  cp env.example .env.local
  echo "${GREEN}✅ .env.local criado${NC}"
else
  echo "📝 .env.local já existe"
fi

# 3. Verificar se está configurado para DEV
if grep -q "ecvjgixhcfmkdfbnueqh.supabase.co" .env.local; then
  echo "${GREEN}✅ Já está configurado para branch DEV do Supabase${NC}"
else
  echo "${YELLOW}⚠️  Precisa configurar as variáveis para branch DEV:${NC}"
  echo ""
  echo "Edite .env.local e configure:"
  echo "  NEXT_PUBLIC_SUPABASE_URL=https://ecvjgixhcfmkdfbnueqh.supabase.co"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=<COPIAR_DO_DASHBOARD_DEV>"
  echo "  SUPABASE_SERVICE_ROLE_KEY=<COPIAR_DO_DASHBOARD_DEV>"
  echo ""
  echo "Dashboard DEV: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/settings/api"
fi

# 4. Verificar dependências
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  pnpm install
else
  echo "✅ Dependências já instaladas"
fi

echo ""
echo "${GREEN}✅ Ambiente de desenvolvimento configurado!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Configure as credenciais no .env.local (se ainda não fez)"
echo "  2. Execute: pnpm dev"
echo "  3. Acesse: http://localhost:3000"
echo ""
echo "📖 Verifique: SETUP_DEV_ENVIRONMENT.md para mais detalhes"

