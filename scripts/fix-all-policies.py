#!/usr/bin/env python3
"""
Script para adicionar DROP POLICY IF EXISTS antes de todas as CREATE POLICY
"""

import re
import os

migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations')

files_to_fix = [
    '002_create_rls_policies.sql',
    '003_create_invites_system.sql',
    '004_create_checklist_system.sql',
    '20251021000002_rls_more_tables.sql',
    '20251021000003_roles_active_role.sql',
    '20251022000003_fix_invite_permissions.sql',
    '20251024000002_fix_all_rls_policies_active_role.sql',
]

def fix_policies(filepath):
    """Adiciona DROP POLICY IF EXISTS antes de cada CREATE POLICY"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar CREATE POLICY
    # Captura: create policy "policy_name" on table_name
    pattern = r'(?<!drop policy if exists )create policy\s+"([^"]+)"\s+on\s+([^\s]+)'
    
    def add_drop(match):
        policy_name = match.group(1)
        table_name = match.group(2)
        return f'drop policy if exists "{policy_name}" on {table_name};\ncreate policy "{policy_name}" on {table_name}'
    
    # Substituir
    new_content = re.sub(pattern, add_drop, content, flags=re.IGNORECASE)
    
    # Contar quantas substituições foram feitas
    count = len(re.findall(pattern, content, flags=re.IGNORECASE))
    
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"✅ {os.path.basename(filepath)}: {count} policies corrigidas")
    else:
        print(f"⏭️  {os.path.basename(filepath)}: nenhuma policy para corrigir")
    
    return count

def main():
    print("🔧 Adicionando DROP POLICY IF EXISTS...\n")
    
    total = 0
    for filename in files_to_fix:
        filepath = os.path.join(migrations_dir, filename)
        if os.path.exists(filepath):
            total += fix_policies(filepath)
        else:
            print(f"⚠️  {filename}: arquivo não encontrado")
    
    print(f"\n✅ Total: {total} policies corrigidas!")

if __name__ == '__main__':
    main()

