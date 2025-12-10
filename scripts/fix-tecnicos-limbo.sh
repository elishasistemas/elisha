# Script para aplicar correções de técnicos no limbo
# Execute este script para corrigir o problema de técnicos sem tecnico_id

echo "🔧 Aplicando correções para técnicos no limbo..."
echo ""

# Migration 1: Atualizar função accept_invite
echo "1️⃣ Atualizando função accept_invite para vincular tecnico_id..."
npx supabase db push --file supabase/migrations/20251208000000_fix_accept_invite_link_tecnico_id.sql

echo ""
echo "2️⃣ Corrigindo técnicos existentes no limbo..."
npx supabase db push --file supabase/migrations/20251208000001_fix_existing_tecnicos_in_limbo.sql

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "📊 Verificar técnicos corrigidos:"
echo "   SELECT p.name, p.email, p.active_role, p.tecnico_id, c.id as colaborador_id"
echo "   FROM profiles p"
echo "   LEFT JOIN colaboradores c ON c.id = p.tecnico_id"
echo "   WHERE p.active_role = 'tecnico';"
