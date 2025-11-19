#!/usr/bin/env python3
"""
Reorganiza o SQL consolidado na ordem correta:
1. Extensões
2. Types/Enums
3. Tabelas
4. Funções
5. Policies
6. Triggers
7. Grants
8. Outros
"""

import re
from pathlib import Path

# Ler arquivo original
sql_file = Path("APLICAR_NO_DASHBOARD.sql")
content = sql_file.read_text()

# Categorias
extensions = []
types_enums = []
tables = []
functions = []
policies = []
triggers = []
grants = []
others = []

# Dividir em statements SQL
# Usar regex para separar por pontos e vírgula no final de linha
statements = re.split(r';\s*\n', content)

for stmt in statements:
    stmt = stmt.strip()
    if not stmt:
        continue
    
    stmt_lower = stmt.lower()
    
    # Classificar cada statement
    if 'create extension' in stmt_lower:
        extensions.append(stmt)
    elif 'create type' in stmt_lower or 'do $$ begin' in stmt_lower and 'create type' in stmt_lower:
        types_enums.append(stmt)
    elif 'create table' in stmt_lower:
        tables.append(stmt)
    elif 'create or replace function' in stmt_lower or 'create function' in stmt_lower:
        functions.append(stmt)
    elif 'create policy' in stmt_lower or 'drop policy' in stmt_lower:
        policies.append(stmt)
    elif 'create trigger' in stmt_lower or 'drop trigger' in stmt_lower:
        triggers.append(stmt)
    elif 'grant' in stmt_lower or 'revoke' in stmt_lower:
        grants.append(stmt)
    else:
        # Inclui CREATE INDEX, ALTER TABLE, COMMENT, etc
        others.append(stmt)

# Reorganizar: juntar tudo na ordem correta
organized = []

if extensions:
    organized.append("-- ============================================")
    organized.append("-- 1. EXTENSÕES")
    organized.append("-- ============================================")
    organized.extend(extensions)
    organized.append("")

if types_enums:
    organized.append("-- ============================================")
    organized.append("-- 2. TYPES E ENUMS")
    organized.append("-- ============================================")
    organized.extend(types_enums)
    organized.append("")

if tables:
    organized.append("-- ============================================")
    organized.append("-- 3. TABELAS")
    organized.append("-- ============================================")
    organized.extend(tables)
    organized.append("")

if others:
    organized.append("-- ============================================")
    organized.append("-- 4. ÍNDICES, CONSTRAINTS, COMMENTS")
    organized.append("-- ============================================")
    organized.extend(others)
    organized.append("")

if functions:
    organized.append("-- ============================================")
    organized.append("-- 5. FUNÇÕES")
    organized.append("-- ============================================")
    organized.extend(functions)
    organized.append("")

if policies:
    organized.append("-- ============================================")
    organized.append("-- 6. POLICIES (RLS)")
    organized.append("-- ============================================")
    organized.extend(policies)
    organized.append("")

if triggers:
    organized.append("-- ============================================")
    organized.append("-- 7. TRIGGERS")
    organized.append("-- ============================================")
    organized.extend(triggers)
    organized.append("")

if grants:
    organized.append("-- ============================================")
    organized.append("-- 8. GRANTS E PERMISSÕES")
    organized.append("-- ============================================")
    organized.extend(grants)
    organized.append("")

# Juntar tudo com ; no final de cada statement
final_sql = ";\n\n".join(organized) + ";"

# Salvar
output_file = Path("APLICAR_NO_DASHBOARD_REORGANIZADO.sql")
output_file.write_text(final_sql)

print(f"✅ SQL reorganizado salvo em: {output_file}")
print(f"")
print(f"📊 Estatísticas:")
print(f"  - Extensões: {len(extensions)}")
print(f"  - Types/Enums: {len(types_enums)}")
print(f"  - Tabelas: {len(tables)}")
print(f"  - Funções: {len(functions)}")
print(f"  - Policies: {len(policies)}")
print(f"  - Triggers: {len(triggers)}")
print(f"  - Grants: {len(grants)}")
print(f"  - Outros: {len(others)}")
print(f"  - TOTAL: {len(statements)}")

