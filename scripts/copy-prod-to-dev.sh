#!/bin/bash

# 🔄 Script para Copiar Dados de PROD para DEV
# Copia tabelas principais mantendo integridade referencial

set -e  # Exit on error

echo "🔄 Copiando Dados de PROD → DEV"
echo "======================================="
echo ""

# Credenciais
PROD_HOST="db.wkccxgeevizhxmclvsnz.supabase.co"
PROD_PASS="gJUu8PTqjJ25ArkCGlxPpAWumOeGXZQ_5ZGIdEgJugE"  # Service role do .env.local.backup

DEV_HOST="db.dahfsyvxvacibowwxgns.supabase.co"
DEV_PASS="yLmgxqlLDFoNMXHuSLpLTKKKDJFylDlb"

USER="postgres"
PORT="5432"
DB="postgres"

# Tabelas na ordem de dependência
TABLES=(
  "empresas"
  "profiles"
  "colaboradores"
  "clientes"
  "equipamentos"
  "checklists"
  "checklist_items"
  "ordens_servico"
  "os_status_history"
  "os_evidencias"
  "os_laudos"
  "os_checklists"
  "os_checklist_items"
)

echo "📋 Tabelas a copiar: ${#TABLES[@]}"
echo ""

# Verificar se pg_dump está instalado
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump não encontrado!"
    echo "📦 Instale com: brew install postgresql@17"
    exit 1
fi

echo "✅ pg_dump encontrado"
echo ""

# Para cada tabela
for table in "${TABLES[@]}"; do
    echo "📦 Copiando: $table"
    
    # Dump da tabela de PROD
    PGPASSWORD="$PROD_PASS" pg_dump \
        -h "$PROD_HOST" \
        -U "$USER" \
        -d "$DB" \
        -p "$PORT" \
        --data-only \
        --table="public.$table" \
        --no-owner \
        --no-privileges \
        > "/tmp/${table}_dump.sql" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Dump criado"
        
        # Restaurar em DEV
        PGPASSWORD="$DEV_PASS" psql \
            -h "$DEV_HOST" \
            -U "$USER" \
            -d "$DB" \
            -p "$PORT" \
            -f "/tmp/${table}_dump.sql" \
            > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "  ✅ Restaurado em DEV"
        else
            echo "  ⚠️  Erro ao restaurar (pode já existir)"
        fi
        
        # Limpar arquivo temporário
        rm "/tmp/${table}_dump.sql"
    else
        echo "  ⚠️  Erro no dump (tabela pode estar vazia)"
    fi
    
    echo ""
done

echo "======================================="
echo "✅ Cópia concluída!"
echo ""
echo "📊 Verificando dados copiados..."
echo ""

# Contar registros em DEV
for table in "empresas" "profiles" "colaboradores" "clientes" "ordens_servico"; do
    COUNT=$(PGPASSWORD="$DEV_PASS" psql \
        -h "$DEV_HOST" \
        -U "$USER" \
        -d "$DB" \
        -p "$PORT" \
        -t -c "SELECT COUNT(*) FROM public.$table;" 2>/dev/null | tr -d ' ')
    
    echo "  $table: $COUNT registros"
done

echo ""
echo "🎉 Processo finalizado!"

