# Script de Correção de Migrations

## Uso

```bash
npm run db:fix-idempotency
```

Ou diretamente:

```bash
node scripts/fix-migrations-idempotency.js
```

## O que faz

O script escaneia todos os arquivos `.sql` em `supabase/migrations/` e corrige automaticamente:

1. **CREATE POLICY sem DROP POLICY IF EXISTS antes**
   - Adiciona `DROP POLICY IF EXISTS` antes de cada `CREATE POLICY` que não tem o drop correspondente

2. **do $$ blocks checando pg_policies**
   - Substitui blocos `do $$ ... if not exists (select 1 from pg_policies ...)` por versões idempotentes com `DROP POLICY IF EXISTS` → `CREATE POLICY`

## Quando usar

- Antes de commitar migrations novas
- Quando receber erro `ERROR 42710: policy already exists`
- Quando receber erro `ERROR 42703: column "polname" does not exist`
- Como parte do workflow de CI/CD para garantir idempotência

## Exemplo

```sql
-- ANTES (não idempotente)
CREATE POLICY checklists_sel_emp
  ON public.checklists
  FOR SELECT
  USING (empresa_id = current_empresa_id());

-- DEPOIS (idempotente)
DROP POLICY IF EXISTS checklists_sel_emp ON public.checklists;
CREATE POLICY checklists_sel_emp
  ON public.checklists
  FOR SELECT
  USING (empresa_id = current_empresa_id());
```

## Limitações

- Não corrige triggers (use `DROP TRIGGER IF EXISTS` manualmente)
- Pode não detectar padrões muito complexos de `do $$` blocks
- Sempre revise as mudanças com `git diff` antes de commitar

## Dicas

1. **Sempre revise antes de commitar:**
   ```bash
   git diff supabase/migrations/
   ```

2. **Execute antes de aplicar migrations:**
   ```bash
   npm run db:fix-idempotency
   git add supabase/migrations/
   git commit -m "fix(db): ensure migrations are idempotent"
   ```

3. **Use em CI/CD:**
   Adicione como verificação automática antes de deploy para garantir que todas as migrations são idempotentes.

