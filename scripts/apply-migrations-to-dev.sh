#!/bin/bash

# 🔄 Script para Aplicar Migrations no DEV
# Aplica todas as migrations SQL no banco de desenvolvimento

set -e

echo "🔄 Aplicando Migrations no DEV"
echo "======================================="
echo ""

# Ler credenciais do .env.development
if [ ! -f .env.development ]; then
    echo "❌ Erro: .env.development não encontrado!"
    exit 1
fi

# Extrair valores
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.development | cut -d= -f2 | tr -d '"' | tr -d ' ')
SERVICE_ROLE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.development | cut -d= -f2 | tr -d '"' | tr -d ' ')

# Remover https:// e pegar apenas o host
HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|http://||')
# Pegar apenas o project ref (primeira parte antes do ponto)
PROJECT_REF=$(echo $HOST | cut -d. -f1)
DB_HOST="db.${PROJECT_REF}.supabase.co"

echo "📡 Conectando em: $DB_HOST"
echo ""

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ psql não encontrado!"
    echo "📦 Instale com: brew install postgresql@17"
    exit 1
fi

echo "✅ psql encontrado"
echo ""

# Contador
total=0
success=0
errors=0

# Aplicar cada migration
for migration in supabase/migrations/*.sql; do
    filename=$(basename "$migration")
    echo "📦 Aplicando: $filename"
    
    PGPASSWORD="$SERVICE_ROLE_KEY" psql \
        -h "$DB_HOST" \
        -U "postgres" \
        -d "postgres" \
        -p "5432" \
        -f "$migration" \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Aplicada com sucesso"
        ((success++))
    else
        echo "  ⚠️  Erro (pode já estar aplicada)"
        ((errors++))
    fi
    
    ((total++))
    echo ""
done

echo "======================================="
echo "📊 Resultado:"
echo "   Total: $total migrations"
echo "   Sucesso: $success"
echo "   Erros/Duplicadas: $errors"
echo ""
echo "✅ Processo finalizado!"

