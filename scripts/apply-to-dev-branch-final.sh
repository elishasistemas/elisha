#!/bin/bash

# Script para aplicar TODAS as migrations na branch DEV correta
# Branch ID: ecvjgixhcfmkdfbnueqh

echo "🚀 Aplicando migrations na BRANCH DEV"
echo "Branch: ecvjgixhcfmkdfbnueqh"
echo "========================================="
echo ""

# Usar psql para conectar diretamente
export PGPASSWORD="VbFzuClIShyLvQZyYeZxTBmiILIXSKXi"
export PGHOST="db.ecvjgixhcfmkdfbnueqh.supabase.co"
export PGPORT="5432"
export PGUSER="postgres"
export PGDATABASE="postgres"

# Verificar se psql está disponível
if ! command -v psql &> /dev/null; then
    echo "❌ psql não encontrado. Instale PostgreSQL client:"
    echo "brew install postgresql"
    exit 1
fi

echo "📋 Aplicando arquivo consolidado..."
echo ""

# Aplicar o arquivo consolidado
psql -f APLICAR_NO_DASHBOARD.sql

echo ""
echo "========================================="
echo "✅ Script concluído!"
echo ""
echo "Verifique se há erros acima."
echo "Se tudo OK, você pode fazer login agora!"

