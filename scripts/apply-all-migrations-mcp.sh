#!/bin/bash

# Script para listar todas as migrations para aplicar via MCP
# O AI usará essa lista para aplicar uma por uma

cd "$(dirname "$0")/../supabase/migrations"

echo "📋 Lista de migrations para aplicar via Supabase MCP:"
echo ""

for file in $(ls -1 *.sql | grep -v ".bak" | sort); do
    echo "$file"
done

echo ""
echo "Total: $(ls -1 *.sql | grep -v ".bak" | wc -l) migrations"

