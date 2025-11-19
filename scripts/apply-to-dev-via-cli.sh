#!/bin/bash

# Script para aplicar migrations via Supabase CLI na branch DEV
# Branch ID: ecvjgixhcfmkdfbnueqh

echo "🚀 Aplicando migrations na BRANCH DEV via Supabase CLI"
echo "Branch: ecvjgixhcfmkdfbnueqh"
echo "========================================================"
echo ""

# Link temporário ao projeto dev
echo "📎 Fazendo link com a branch dev..."
supabase link --project-ref ecvjgixhcfmkdfbnueqh

if [ $? -ne 0 ]; then
    echo "❌ Erro ao fazer link. Verifique suas credenciais."
    exit 1
fi

echo ""
echo "📤 Enviando migrations..."
supabase db push --include-all

echo ""
echo "========================================================"
echo "✅ Script concluído!"
echo ""
echo "Verifique se há erros acima."

