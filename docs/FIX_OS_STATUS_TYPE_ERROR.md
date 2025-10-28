# Fix: Erro de Tipo na Coluna status_anterior

**Data:** 2025-10-27
**Status:** ✅ Corrigido

## 🐛 Problema

```
Erro ao aceitar OS: column "status_anterior" is of type os_status but expression is of type text
```

## 🔍 Causa Raiz

As colunas `status_anterior` e `status_novo` na tabela `os_status_history` são do tipo **`os_status`** (enum), mas várias funções e triggers estavam fazendo cast para `::text`:

```sql
-- ❌ ERRADO
INSERT INTO os_status_history (...)
VALUES (
  OLD.status::text,  -- Convertendo enum para text
  NEW.status::text,
  ...
)
```

## 🔧 Locais Corrigidos

### 1. ✅ Função `os_accept()`

**Antes:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  v_os.status::text,        -- ❌
  'em_deslocamento',
  ...
)
```

**Depois:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  v_os.status,              -- ✅
  'em_deslocamento',
  ...
)
```

**Migration:** `fix_os_accept_decline_status_type.sql`

---

### 2. ✅ Função `os_decline()`

**Antes:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  v_os.status::text,        -- ❌
  v_os.status::text,        -- ❌
  ...
)
```

**Depois:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  v_os.status,              -- ✅
  v_os.status,              -- ✅
  ...
)
```

**Migration:** `fix_os_accept_decline_status_type.sql`

---

### 3. ✅ Trigger `log_os_status_change()`

**Antes:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  OLD.status::text,         -- ❌
  NEW.status::text,         -- ❌
  ...
)
```

**Depois:**
```sql
INSERT INTO os_status_history (...)
VALUES (
  OLD.status,               -- ✅
  NEW.status,               -- ✅
  ...
)
```

**Migration:** `fix_trigger_log_os_status_change_type.sql`

---

### 4. ✅ Trigger Duplicado Removido

**Problema:** Havia dois triggers executando a mesma função:
- `trg_log_os_status_change` ❌ (removido)
- `trg_os_status_change` ✅ (mantido)

Ambos executavam `log_os_status_change()`, causando **registros duplicados** no histórico.

**Migration:** `remove_duplicate_os_status_trigger.sql`

---

## 📊 Schema da Tabela

```sql
-- Tabela: os_status_history
CREATE TABLE os_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id),
  
  -- ✅ Tipo correto: os_status (enum), não text
  status_anterior os_status,  
  status_novo os_status NOT NULL,
  
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz NOT NULL DEFAULT now(),
  action_type text,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  empresa_id uuid REFERENCES empresas(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

## 🎯 Enum os_status

```sql
CREATE TYPE os_status AS ENUM (
  'novo',
  'em_deslocamento',
  'checkin',
  'em_andamento',
  'checkout',
  'aguardando_assinatura',
  'concluido',
  'cancelado',
  'parado',
  'reaberta'
);
```

## 📝 Migrations Aplicadas

1. ✅ `fix_os_accept_decline_status_type.sql` - Corrigiu `os_accept()` e `os_decline()`
2. ✅ `fix_trigger_log_os_status_change_type.sql` - Corrigiu trigger `log_os_status_change()`
3. ✅ `remove_duplicate_os_status_trigger.sql` - Removeu trigger duplicado

## 🧪 Como Testar

1. **Aceitar OS como Admin:**
   ```
   ✅ Deve funcionar sem erro
   ✅ Status muda para 'em_deslocamento'
   ✅ Histórico registrado corretamente
   ✅ Sem registros duplicados
   ```

2. **Aceitar OS como Técnico:**
   ```
   ✅ Mesmos resultados do admin
   ```

3. **Recusar OS:**
   ```
   ✅ Deve funcionar sem erro
   ✅ Status mantém 'novo' ou 'parado'
   ✅ Histórico com action_type='decline'
   ```

4. **Verificar Histórico:**
   ```sql
   SELECT * FROM os_status_history 
   WHERE os_id = 'uuid-da-os'
   ORDER BY changed_at DESC;
   ```
   
   ✅ Não deve haver registros duplicados
   ✅ Tipos status_anterior e status_novo devem ser os_status

## ✅ Status Final

- [x] ✅ Função `os_accept()` corrigida
- [x] ✅ Função `os_decline()` corrigida
- [x] ✅ Trigger `log_os_status_change()` corrigido
- [x] ✅ Trigger duplicado removido
- [x] ✅ Sem erros de tipo
- [x] ✅ Sem registros duplicados no histórico

## 🎓 Lição Aprendida

**Regra:** Quando uma coluna é do tipo ENUM no PostgreSQL, **NÃO** use cast `::text` ao inserir valores. O PostgreSQL aceita strings literais diretamente:

```sql
-- ✅ CORRETO
INSERT INTO table (enum_column) VALUES ('valor_enum');

-- ❌ ERRADO  
INSERT INTO table (enum_column) VALUES ('valor_enum'::text);
```

O cast `::text` converte o enum para text, mas a coluna espera o tipo enum, causando erro de tipo.

---

**Autor:** Cursor AI
**Revisão:** Pendente
**Deploy:** Pronto para teste

