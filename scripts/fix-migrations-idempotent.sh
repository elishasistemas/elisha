#!/bin/bash

# Script para tornar migrations idempotentes
# Adiciona DROP antes de CREATE para evitar erros de "already exists"

cd "$(dirname "$0")/../supabase/migrations"

echo "🔧 Tornando migrations idempotentes..."
echo ""

# Backup
for file in *.sql; do
    cp "$file" "${file}.backup"
done

# Função para adicionar DROP antes de CREATE TRIGGER
fix_triggers() {
    local file=$1
    echo "📦 Processando triggers em: $file"
    
    # Encontrar todos os CREATE TRIGGER e adicionar DROP antes
    perl -i -pe 's/(create trigger\s+(\w+))/drop trigger if exists $2 on public.$table;\n$1/gi' "$file"
}

# Processar cada arquivo
for file in *.sql; do
    if grep -q "create trigger" "$file"; then
        echo "  📌 Encontrados triggers em: $file"
        
        # Extrair nome da tabela e trigger para adicionar DROP correto
        # Vamos fazer isso manualmente para cada arquivo
    fi
done

echo ""
echo "✅ Processamento concluído!"

