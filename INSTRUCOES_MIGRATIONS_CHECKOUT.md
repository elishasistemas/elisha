# Instruções para Aplicar Migrations - Fluxo de Encerramento de OS

## Migrations a serem aplicadas (NESTA ORDEM):

### 1. Fix de Constraint de Status
**Arquivo**: `20251209000001_fix_os_status_constraint.sql`
**O que faz**: Adiciona o status `em_deslocamento` na constraint de status da tabela `ordens_servico`
**Por quê**: Sem isso, ao aceitar uma OS ocorre erro de constraint violation

### 2. Fix de data_inicio no os_accept
**Arquivo**: `20251209000000_fix_os_accept_data_inicio.sql`
**O que faz**: Corrige a função `os_accept` para usar `GREATEST()` e garantir que `data_inicio >= data_abertura`
**Por quê**: Evita erro de violação da constraint `ordens_servico_datas_logicas`

### 3. Criar tabela os_assinaturas
**Arquivo**: `20251209000003_create_os_assinaturas_table.sql`
**O que faz**: Cria tabela para armazenar assinaturas dos clientes no checkout
**Campos**: id, os_id, empresa_id, nome_cliente, assinatura_base64, metadata, timestamps
**Por quê**: Necessária para o RPC `os_checkout` funcionar

### 4. Criar tabela os_checklist_items
**Arquivo**: `20251209000004_create_os_checklist_items_table.sql`
**O que faz**: Cria tabela para armazenar respostas do checklist de OSs preventivas
**Campos**: id, os_id, empresa_id, descricao, status (conforme/nao_conforme/na), ordem, observacao
**Por quê**: Necessária para o componente de preventiva funcionar

### 5. Criar RPC os_checkout
**Arquivo**: `20251209000002_create_os_checkout_rpc.sql`
**O que faz**: Cria função para realizar checkout da OS
**Parâmetros**: `p_os_id`, `p_estado_equipamento`, `p_nome_cliente`, `p_assinatura_base64`
**Por quê**: Centraliza a lógica de finalização da OS com validações

## Como aplicar:

### Opção 1: SQL Editor do Supabase (Recomendado)
1. Acesse: https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/sql
2. Para cada migration, cole o conteúdo e clique em "Run"
3. Aplique na ordem listada acima

### Opção 2: psql (se conseguir resolver o problema da senha)
```bash
cd /Users/mau/ws/Elisha-admin

# Aplicar todas de uma vez (na ordem correta)
psql "sua-connection-string" -f supabase/migrations/20251209000001_fix_os_status_constraint.sql
psql "sua-connection-string" -f supabase/migrations/20251209000000_fix_os_accept_data_inicio.sql
psql "sua-connection-string" -f supabase/migrations/20251209000003_create_os_assinaturas_table.sql
psql "sua-connection-string" -f supabase/migrations/20251209000004_create_os_checklist_items_table.sql
psql "sua-connection-string" -f supabase/migrations/20251209000002_create_os_checkout_rpc.sql
```

## Verificação pós-migrations:

### 1. Testar constraint de status:
```sql
-- Deve retornar 10 valores
SELECT unnest(enum_range(NULL::text)) 
FROM pg_constraint 
WHERE conname = 'ordens_servico_status_check';
```

### 2. Testar função os_accept:
```sql
-- Ver definição da função
\df+ os_accept
```

### 3. Verificar tabelas criadas:
```sql
-- Deve listar as colunas
\d os_assinaturas
\d os_checklist_items
```

### 4. Testar função os_checkout:
```sql
-- Ver definição da função
\df+ os_checkout
```

## Após aplicar as migrations:

1. **Teste o fluxo completo**:
   - Login como técnico
   - Aceite uma OS (deve funcionar sem erro de constraint)
   - Faça check-in
   - Preencha o laudo/checklist
   - Capture assinatura
   - Realize checkout

2. **Verifique os dados**:
   ```sql
   -- Ver assinaturas coletadas
   SELECT * FROM os_assinaturas;
   
   -- Ver itens do checklist
   SELECT * FROM os_checklist_items;
   ```

## Ordem correta resumida:
1. ✅ `20251209000001_fix_os_status_constraint.sql`
2. ✅ `20251209000000_fix_os_accept_data_inicio.sql`
3. ✅ `20251209000003_create_os_assinaturas_table.sql`
4. ✅ `20251209000004_create_os_checklist_items_table.sql`
5. ✅ `20251209000002_create_os_checkout_rpc.sql`

## Problemas comuns:

- **Erro "relation os_assinaturas does not exist"**: Aplicar migration 3 antes da 5
- **Erro "constraint ordens_servico_status_check"**: Aplicar migration 1
- **Erro "ordens_servico_datas_logicas"**: Aplicar migration 2
