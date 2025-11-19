#!/bin/bash

# 🔧 Script de Setup do Ambiente de Desenvolvimento
# Este script aplica todas as migrations no branch develop

set -e  # Exit on error

PROJECT_REF_DEV="dahfsyvxvacibowwxgns"
PROJECT_REF_PROD="wkccxgeevizhxmclvsnz"

echo "🚀 Setup do Ambiente de Desenvolvimento"
echo "======================================="
echo ""

# Verificar se Supabase CLI está instalada
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrada!"
    echo "📦 Instale com: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI encontrada"
echo ""

# Verificar status do branch develop
echo "🔍 Verificando status do branch develop..."
STATUS=$(supabase branches get develop --project-ref $PROJECT_REF_PROD 2>&1 | grep STATUS | awk '{print $NF}')

if [ "$STATUS" != "ACTIVE_HEALTHY" ]; then
    echo "⚠️  Branch develop não está ativo (STATUS: $STATUS)"
    echo "⏳ Aguarde alguns minutos e tente novamente"
    exit 1
fi

echo "✅ Branch develop está ativo!"
echo ""

# Listar migrations
echo "📋 Migrations disponíveis:"
ls -1 supabase/migrations/*.sql | nl
echo ""

# Confirmar
read -p "🤔 Deseja aplicar todas as migrations no branch develop? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 0
fi

# Aplicar migrations
echo ""
echo "🔄 Aplicando migrations no branch develop..."
echo "================================================"

for migration in supabase/migrations/*.sql; do
    filename=$(basename "$migration")
    echo ""
    echo "📄 Aplicando: $filename"
    
    # Executar migration via psql
    PGPASSWORD="yLmgxqlLDFoNMXHuSLpLTKKKDJFylDlb" psql \
        -h db.dahfsyvxvacibowwxgns.supabase.co \
        -U postgres \
        -d postgres \
        -p 5432 \
        -f "$migration" \
        2>&1 | grep -v "^$"
    
    if [ $? -eq 0 ]; then
        echo "  ✅ OK"
    else
        echo "  ❌ ERRO"
        exit 1
    fi
done

echo ""
echo "================================================"
echo "✅ Todas as migrations foram aplicadas com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Copie o template: docs/ENV_DEVELOPMENT_TEMPLATE.md"
echo "  2. Crie .env.development na raiz do projeto"
echo "  3. Preencha as credenciais do dashboard"
echo "  4. Execute: pnpm dev"
echo ""
echo "🔗 Dashboard: https://supabase.com/dashboard/project/dahfsyvxvacibowwxgns"
echo ""

