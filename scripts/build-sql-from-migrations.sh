#!/bin/bash

# Script para concatenar migrations na ordem correta

echo "🔨 Construindo SQL consolidado a partir das migrations originais..."

OUTPUT="APLICAR_NO_DASHBOARD_ORDENADO.sql"

# Limpar arquivo de saída
> "$OUTPUT"

# Header
cat >> "$OUTPUT" << 'EOF'
-- ============================================
-- SQL CONSOLIDADO - BRANCH DEV
-- ============================================
-- Gerado automaticamente a partir das migrations
-- Ordem: tabelas → funções → policies → triggers
-- ============================================

EOF

# Ordem correta dos arquivos de migration
MIGRATIONS=(
  "001_create_core_tables.sql"
  "002_create_rls_policies.sql"
  "003_create_invites_system.sql"
  "003_5_add_profiles_missing_columns.sql"
  "20251021000003_roles_active_role.sql"
  "004_create_checklist_system.sql"
  "20251021000000_empresa_dual_approval.sql"
  "20251021000001_os_ordering_view.sql"
  "20251021000002_rls_more_tables.sql"
  "20251022000000_add_user_id_to_profiles.sql"
  "20251022000001_fix_active_role_constraint.sql"
  "20251022000002_fix_empresas_select_for_anon.sql"
  "20251022000003_fix_invite_permissions.sql"
  "20251022000004_fix_invites_created_by.sql"
  "20251022000005_fix_invites_public_select.sql"
  "20251022000006_fix_invites_select_policies_roles.sql"
  "20251022000007_fix_invites_select_rls.sql"
  "20251022000008_fix_revoke_invite_permissions.sql"
  "20251022000009_grant_empresas_select_to_anon.sql"
  "20251022000010_remove_gestor_role.sql"
  "20251024000000_add_client_contract_and_equipment_fields.sql"
  "20251024000001_add_quem_solicitou_to_ordens_servico.sql"
  "20251024000002_fix_all_rls_policies_active_role.sql"
  "20251024000003_fix_profiles_roles_active_role.sql"
  "20251027000000_create_os_status_history_and_accept_decline_rpcs.sql"
  "20251027000001_fix_os_accept_decline_rls_and_functions.sql"
  "20251028000000_create_evidencias_and_laudo.sql"
  "20251028000001_create_os_checkin_rpc.sql"
  "20251029000000_seed_roles_existing_users.sql"
  "998_add_user_id_to_colaboradores.sql"
  "999_fix_accept_invite_create_colaborador.sql"
)

# Concatenar cada migration
for migration in "${MIGRATIONS[@]}"; do
  FILE="supabase/migrations/$migration"
  
  if [ -f "$FILE" ]; then
    echo "" >> "$OUTPUT"
    echo "-- ============================================" >> "$OUTPUT"
    echo "-- MIGRATION: $migration" >> "$OUTPUT"
    echo "-- ============================================" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    
    cat "$FILE" >> "$OUTPUT"
    
    echo "" >> "$OUTPUT"
    echo "-- [FIM: $migration]" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
    
    echo "  ✅ $migration"
  else
    echo "  ⚠️  SKIP: $migration (não encontrado)"
  fi
done

# Footer
cat >> "$OUTPUT" << 'EOF'

-- ============================================
-- FIM DO SQL CONSOLIDADO
-- ============================================
EOF

echo ""
echo "✅ SQL consolidado salvo em: $OUTPUT"
echo ""
echo "📋 Próximos passos:"
echo "  1. Abra o arquivo: $OUTPUT"
echo "  2. Copie todo o conteúdo (Cmd/Ctrl + A)"
echo "  3. Cole no SQL Editor do Supabase Dashboard"
echo "  4. Clique em RUN"

