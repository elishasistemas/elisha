#!/bin/bash

# 🔍 Script para Verificar Configuração dos Ambientes

echo "🔍 Verificando Configuração dos 3 Ambientes"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
  else
    echo -e "${RED}❌${NC} $1 ${YELLOW}(não encontrado)${NC}"
  fi
}

echo "📁 Verificando arquivos de configuração:"
echo ""

echo "Frontend (apps/web):"
check_file "apps/web/.env.local"
check_file "apps/web/.env.development"
check_file "apps/web/.env.production"
check_file "apps/web/.env.example"
echo ""

echo "Backend (apps/api):"
check_file "apps/api/.env.local"
check_file "apps/api/.env.development"
check_file "apps/api/.env.production"
check_file "apps/api/.env.example"
echo ""

echo "🔀 Verificando branches:"
echo ""

CURRENT_BRANCH=$(git branch --show-current)
echo "Branch atual: ${GREEN}$CURRENT_BRANCH${NC}"
echo ""

echo "Branches disponíveis:"
git branch -a | grep -E '(main|dev|master)' | while read branch; do
  echo "  - $branch"
done
echo ""

echo "📋 Resumo dos Ambientes:"
echo ""
echo "┌─────────────────┬──────────────────┬─────────────────┬──────────────────┐"
echo "│   AMBIENTE      │     LOCAL        │   PREVIEW (DEV) │   PRODUCTION     │"
echo "├─────────────────┼──────────────────┼─────────────────┼──────────────────┤"
echo "│ Branch Git      │ $CURRENT_BRANCH  │ dev             │ main             │"
echo "│ Config File     │ .env.local       │ .env.development│ .env.production  │"
echo "│ Supabase DB     │ DEV              │ DEV             │ PROD             │"
echo "└─────────────────┴──────────────────┴─────────────────┴──────────────────┘"
echo ""

echo "💡 Próximos passos:"
echo ""
echo "1. ${YELLOW}Criar projeto Supabase PROD${NC} (se ainda não criou)"
echo "2. ${YELLOW}Configurar .env.local${NC} com suas chaves DEV"
echo "3. ${YELLOW}Criar branch dev${NC}: git checkout -b dev"
echo "4. ${YELLOW}Configurar Render${NC} com Preview e Production environments"
echo ""
echo "📖 Consulte: GUIA_3_AMBIENTES.md para instruções completas"
echo ""
