#!/bin/bash

# Script para verificar dependências entre migrations

echo "🔍 Verificando dependências entre migrations..."
echo ""

# Buscar todas as funções e onde são criadas
echo "📦 Funções criadas:"
grep -n "create or replace function\|create function" supabase/migrations/*.sql | \
  sed 's/supabase\/migrations\///' | \
  grep -oP '^\d+[^:]+:\d+:create (or replace )?function public\.\K[^(]+' | \
  head -20

echo ""
echo "🔗 Verificando uso de funções críticas nas policies..."
echo ""

# Verificar onde current_active_role é usado
echo "▶️  current_active_role() usado em:"
grep -l "current_active_role()" supabase/migrations/*.sql | sed 's/supabase\/migrations\///'

echo ""
echo "▶️  current_empresa_id() usado em:"
grep -l "current_empresa_id()" supabase/migrations/*.sql | sed 's/supabase\/migrations\///'

echo ""
echo "▶️  current_tecnico_id() usado em:"
grep -l "current_tecnico_id()" supabase/migrations/*.sql | sed 's/supabase\/migrations\///'

echo ""
echo "✅ Verificação concluída!"

