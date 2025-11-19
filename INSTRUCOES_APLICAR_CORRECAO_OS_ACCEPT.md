# 📝 Instruções: Aplicar Correção do RPC os_accept

## Problema
Erro ao aceitar chamado: violação da constraint `ordens_servico_datas_logicas`

## Solução
Aplicar migration `20251031000000_fix_os_accept_dates_constraint.sql`

---

## ✅ Método Manual (SQL Editor)

### Passo 1: Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/sql/new
   - Ou vá em: **SQL Editor** → **New Query**

### Passo 2: Colar o Código
Copie e cole o conteúdo completo do arquivo:
```
supabase/migrations/20251031000000_fix_os_accept_dates_constraint.sql
```

### Passo 3: Executar
1. Clique em **Run** ou pressione `Ctrl+Enter` (ou `Cmd+Enter` no Mac)
2. Aguarde a confirmação de sucesso

### Passo 4: Verificar
O SQL Editor deve mostrar:
- ✅ "Success. No rows returned"
- Ou confirmação de que a função foi criada

---

## 🔍 O que a correção faz

1. **Garante data_inicio >= data_abertura**:
   - Calcula `v_data_inicio := now()`
   - Se `now() < data_abertura`, usa `data_abertura` como valor
   - Isso garante que a constraint seja sempre satisfeita

2. **Corrige status**:
   - Muda de `em_andamento` para `em_deslocamento`
   - Alinha com o fluxo correto do plan.yaml

---

## ⚠️ Importante

- **Branch DEV**: Use a URL acima (`ecvjgixhcfmkdfbnueqh`)
- **Branch PROD**: Se precisar aplicar em produção também, use `wkccxgeevizhxmclvsnz`
- A migration é **idempotente** (pode rodar múltiplas vezes sem problema)

---

## ✅ Após Aplicar

Teste novamente aceitar um chamado no dashboard. O erro deve estar resolvido!

