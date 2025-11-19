# 🔧 Instruções Completas: Corrigir Erro ao Aceitar Chamado

## ❌ Erros Encontrados

1. **Erro de Constraint de Datas**: `ordens_servico_datas_logicas`
   - ✅ **CORRIGIDO** na migration `20251031000000_fix_os_accept_dates_constraint.sql`

2. **Erro de Constraint de Status**: `ordens_servico_status_check`
   - ⚠️ **FALTA APLICAR** migration `20251031000001_add_missing_os_status_values.sql`

---

## ✅ Solução: Aplicar 2 Migrations

### Migration 1: Corrigir Constraint de Datas ✅
**Arquivo**: `supabase/migrations/20251031000000_fix_os_accept_dates_constraint.sql`

**O que faz**:
- Garante que `data_inicio >= data_abertura`
- Corrige status para `em_deslocamento`

### Migration 2: Adicionar Status Faltantes ⚠️ **IMPORTANTE**
**Arquivo**: `supabase/migrations/20251031000001_add_missing_os_status_values.sql`

**O que faz**:
- Remove constraint antiga
- Adiciona constraint nova com todos os status:
  - ✅ `novo`
  - ✅ `em_deslocamento` ← **ESTE ESTAVA FALTANDO!**
  - ✅ `checkin`
  - ✅ `em_andamento`
  - ✅ `checkout`
  - ✅ `aguardando_assinatura`
  - ✅ `concluido`
  - ✅ `cancelado`
  - ✅ `parado`
  - ✅ `reaberta`

---

## 📝 Como Aplicar Manualmente

### Passo 1: Acessar SQL Editor
- Branch DEV: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/sql/new

### Passo 2: Aplicar Migration 1 (Se ainda não aplicou)
1. Abrir arquivo: `supabase/migrations/20251031000000_fix_os_accept_dates_constraint.sql`
2. Copiar TODO o conteúdo
3. Colar no SQL Editor
4. Executar (Run ou Ctrl+Enter)

### Passo 3: Aplicar Migration 2 ⚠️ **OBRIGATÓRIO**
1. Abrir arquivo: `supabase/migrations/20251031000001_add_missing_os_status_values.sql`
2. Copiar TODO o conteúdo
3. Colar no SQL Editor
4. Executar (Run ou Ctrl+Enter)
5. Verificar sucesso: "Success. No rows returned"

---

## ✅ Após Aplicar

O erro `ordens_servico_status_check` deve estar resolvido!

Teste aceitar um chamado novamente no dashboard.

---

## 🔍 Verificação

Se quiser verificar se foi aplicado corretamente, execute:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.ordens_servico'::regclass 
AND conname = 'ordens_servico_status_check';
```

Deve mostrar todos os 10 status na constraint.

