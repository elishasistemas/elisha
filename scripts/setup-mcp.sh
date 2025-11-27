#!/bin/bash

# Script para configurar MCP servers no Elisha Admin
# Este script ajuda a configurar credenciais de forma segura

set -e

echo "🚀 Configurando MCP (Model Context Protocol) para Elisha Admin"
echo ""

# Verificar se .env.mcp existe
if [ -f ".env.mcp" ]; then
  echo "✅ Arquivo .env.mcp encontrado"
  source .env.mcp
else
  echo "⚠️  Arquivo .env.mcp não encontrado"
  echo "📝 Criando .env.mcp a partir do template..."
  cp .env.mcp.example .env.mcp
  echo ""
  echo "Por favor, edite o arquivo .env.mcp e preencha suas credenciais:"
  echo "  - GITHUB_TOKEN (https://github.com/settings/tokens/new)"
  echo "  - SUPABASE_DEV_PASSWORD (Supabase Dashboard → Database → Connection pooling)"
  echo "  - SUPABASE_PROD_PASSWORD (Supabase Dashboard → Database → Connection pooling)"
  echo ""
  echo "Após preencher, execute este script novamente."
  exit 0
fi

# Verificar se as credenciais estão preenchidas
if [[ "$GITHUB_TOKEN" == *"your_"* ]] || [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN não configurado no .env.mcp"
  exit 1
fi

if [[ "$SUPABASE_DEV_PASSWORD" == *"your_"* ]] || [ -z "$SUPABASE_DEV_PASSWORD" ]; then
  echo "❌ SUPABASE_DEV_PASSWORD não configurado no .env.mcp"
  exit 1
fi

if [[ "$SUPABASE_PROD_PASSWORD" == *"your_"* ]] || [ -z "$SUPABASE_PROD_PASSWORD" ]; then
  echo "❌ SUPABASE_PROD_PASSWORD não configurado no .env.mcp"
  exit 1
fi

echo "✅ Todas as credenciais configuradas!"
echo ""

# Verificar se .cursor/mcp.json existe
if [ ! -f ".cursor/mcp.json" ]; then
  echo "📝 Criando .cursor/mcp.json..."
  cp .cursor/mcp.json.example .cursor/mcp.json
fi

# Substituir placeholders no .cursor/mcp.json
echo "🔧 Configurando .cursor/mcp.json com credenciais do .env.mcp..."

# Usar sed para substituir (compatível com macOS)
sed -i '' "s|<YOUR_GITHUB_TOKEN>|$GITHUB_TOKEN|g" .cursor/mcp.json
sed -i '' "s|<YOUR_DEV_PASSWORD>|$SUPABASE_DEV_PASSWORD|g" .cursor/mcp.json
sed -i '' "s|<YOUR_PROD_PASSWORD>|$SUPABASE_PROD_PASSWORD|g" .cursor/mcp.json
sed -i '' "s|<YOUR_RESEND_API_KEY>|${RESEND_API_KEY:-re_UizBAmtG_D19qoMkCUmXUtPvAnpWkjJPc}|g" .cursor/mcp.json

echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "  1. Reinicie o Cursor/VS Code"
echo "  2. Verifique se os MCP servers estão rodando:"
echo "     View → Output → Model Context Protocol"
echo "  3. Teste com um comando como:"
echo "     'Liste as tabelas do banco DEV'"
echo ""
echo "🔒 Lembre-se: NUNCA commite .cursor/mcp.json ou .env.mcp!"
echo ""
