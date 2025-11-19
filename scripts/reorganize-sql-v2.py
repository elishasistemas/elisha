#!/usr/bin/env python3
"""
Reorganiza o SQL consolidado na ordem correta.
Versão 2: Lida corretamente com blocos $$ ... $$ e do $$ ... $$
"""

import re
from pathlib import Path

def split_sql_statements(content):
    """
    Divide SQL em statements, respeitando blocos $$ ... $$
    """
    statements = []
    current = []
    in_dollar_block = False
    dollar_marker = None
    
    lines = content.split('\n')
    
    for line in lines:
        # Detectar início/fim de blocos $$
        if '$$' in line:
            if not in_dollar_block:
                # Entrando em bloco
                in_dollar_block = True
                dollar_marker = '$$'
            else:
                # Saindo de bloco (se for o mesmo marcador)
                if dollar_marker in line:
                    in_dollar_block = False
                    dollar_marker = None
        
        current.append(line)
        
        # Se não estiver em bloco e linha termina com ;, é fim do statement
        if not in_dollar_block and line.strip().endswith(';'):
            stmt = '\n'.join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
    
    # Adicionar qualquer statement restante
    if current:
        stmt = '\n'.join(current).strip()
        if stmt:
            statements.append(stmt)
    
    return statements

# Ler arquivo original
sql_file = Path("APLICAR_NO_DASHBOARD.sql")
content = sql_file.read_text()

# Dividir em statements
statements = split_sql_statements(content)

# Categorias
extensions = []
types_enums = []
tables = []
indexes_constraints = []
comments = []
functions = []
policies = []
triggers = []
grants = []
others = []

for stmt in statements:
    if not stmt.strip():
        continue
    
    stmt_lower = stmt.lower()
    first_line = stmt.split('\n')[0].lower().strip()
    
    # Classificar cada statement
    if 'create extension' in first_line:
        extensions.append(stmt)
    
    elif ('create type' in stmt_lower and 'do $$' in stmt_lower) or \
         (first_line.startswith('create type') or first_line.startswith('do $$ begin')):
        types_enums.append(stmt)
    
    elif first_line.startswith('create table'):
        tables.append(stmt)
    
    elif first_line.startswith('create index') or first_line.startswith('create unique index'):
        indexes_constraints.append(stmt)
    
    elif first_line.startswith('alter table'):
        # Separar enable RLS de outros ALTER TABLE
        if 'enable row level security' in stmt_lower:
            tables.append(stmt)  # RLS junto com tabelas
        else:
            indexes_constraints.append(stmt)
    
    elif first_line.startswith('comment on'):
        comments.append(stmt)
    
    elif 'create or replace function' in first_line or \
         'create function' in first_line:
        functions.append(stmt)
    
    elif first_line.startswith('drop policy') or \
         first_line.startswith('create policy') or \
         ('do $$' in first_line and 'policy' in stmt_lower):
        policies.append(stmt)
    
    elif first_line.startswith('drop trigger') or \
         first_line.startswith('create trigger'):
        triggers.append(stmt)
    
    elif first_line.startswith('grant') or first_line.startswith('revoke'):
        grants.append(stmt)
    
    else:
        others.append(stmt)

# Reorganizar na ordem correta
organized = []

def add_section(title, items):
    if items:
        organized.append(f"-- ============================================")
        organized.append(f"-- {title}")
        organized.append(f"-- ============================================")
        organized.append("")
        for item in items:
            organized.append(item)
            organized.append("")

add_section("1. EXTENSÕES", extensions)
add_section("2. TYPES E ENUMS", types_enums)
add_section("3. TABELAS E RLS", tables)
add_section("4. ÍNDICES E CONSTRAINTS", indexes_constraints)
add_section("5. COMENTÁRIOS", comments)
add_section("6. FUNÇÕES HELPER", functions)
add_section("7. POLÍTICAS RLS", policies)
add_section("8. TRIGGERS", triggers)
add_section("9. GRANTS E PERMISSÕES", grants)
add_section("10. OUTROS", others)

# Juntar tudo
final_sql = '\n'.join(organized)

# Salvar
output_file = Path("APLICAR_NO_DASHBOARD_FINAL.sql")
output_file.write_text(final_sql)

print(f"✅ SQL reorganizado salvo em: {output_file}")
print(f"")
print(f"📊 Estatísticas:")
print(f"  - Extensões: {len(extensions)}")
print(f"  - Types/Enums: {len(types_enums)}")
print(f"  - Tabelas: {len(tables)}")
print(f"  - Índices/Constraints: {len(indexes_constraints)}")
print(f"  - Comentários: {len(comments)}")
print(f"  - Funções: {len(functions)}")
print(f"  - Policies: {len(policies)}")
print(f"  - Triggers: {len(triggers)}")
print(f"  - Grants: {len(grants)}")
print(f"  - Outros: {len(others)}")
print(f"  - TOTAL: {len(statements)}")
print(f"")
print(f"🎯 Ordem: Extensions → Types → Tables → Indexes → Comments → Functions → Policies → Triggers → Grants")

