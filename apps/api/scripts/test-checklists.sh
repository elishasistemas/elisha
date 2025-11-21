#!/usr/bin/env bash
set -euo pipefail

# Carrega variáveis do .env.local
if [ ! -f .env.local ]; then
  echo "Arquivo .env.local não encontrado. Execute este script a partir de apps/api/"
  exit 1
fi
export $(grep -v '^#' .env.local | xargs)

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configurados em .env.local"
  exit 1
fi

EMAIL="fpsjunior87@gmail.com"
PASSWORD="Fernando,^^13"

echo "Obtendo token JWT do Supabase para $EMAIL"
TOKEN_REP=$(curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  -d "{\"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")

echo "Resposta do Supabase (resumida):"
echo "$TOKEN_REP" | jq -c '. | {status: .error?, access_token: .access_token?, message: .error_description?}' || true

ACCESS_TOKEN=$(echo "$TOKEN_REP" | jq -r '.access_token // empty')
if [ -z "$ACCESS_TOKEN" ]; then
  echo "Falha ao obter access_token. Detalhes completos:" >&2
  echo "$TOKEN_REP"
  exit 1
fi

BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL:-http://localhost:3001}
echo "Chamando endpoint do backend GET $BACKEND_URL/api/v1/checklists?empresaId=6a28d5c5-bce1-4729-a87e-1844ab48b727"

RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "$BACKEND_URL/api/v1/checklists?empresaId=6a28d5c5-bce1-4729-a87e-1844ab48b727&offset=0&limit=10&order=created_at.desc" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Resposta do backend (resumida):"
echo "$RESP" | sed -n '1,200p' | jq -c '.' || echo "$RESP"

HTTP_STATUS=$(echo "$RESP" | tr -d '\r' | sed -n '$p' | sed -e 's/HTTP_STATUS:'//g)
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "Falha ao acessar backend, verifique logs. Resposta completa:" >&2
  echo "$RESP"
  exit 1
fi

echo "Teste completado com sucesso."
