# 🔄 Migration 4c Atualizada: Geração Automática de OS Preventivas

## Mudança na Lógica

A função `generate_preventive_os_for_equipment()` foi atualizada para criar **TODAS as OS preventivas** (mensal, trimestral, semestral, anual) automaticamente ao cadastrar um equipamento, baseado diretamente nas regras do `plan.yaml`, ao invés de depender dos planos preventivos cadastrados na tabela `preventive_plans`.

---

## 📋 Regras por Tipo de Equipamento

### ELEVADOR_ELETRICO
- ✅ Mensal (intervalo: 1 mês, janela: 7 dias)
- ✅ Trimestral (intervalo: 3 meses, janela: 14 dias)
- ✅ Semestral (intervalo: 6 meses, janela: 14 dias)
- ✅ Anual (intervalo: 12 meses, janela: 30 dias)

**Total: 4 OS preventivas criadas**

### ELEVADOR_HIDRAULICO
- ✅ Mensal (intervalo: 1 mês, janela: 7 dias)
- ✅ Bimestral (intervalo: 2 meses, janela: 7 dias)
- ✅ Trimestral (intervalo: 3 meses, janela: 14 dias)
- ✅ Semestral (intervalo: 6 meses, janela: 14 dias)
- ✅ Anual (intervalo: 12 meses, janela: 30 dias)

**Total: 5 OS preventivas criadas**

### PLATAFORMA_VERTICAL
- ✅ Mensal (intervalo: 1 mês, janela: 7 dias)
- ✅ Bimestral (intervalo: 2 meses, janela: 7 dias)
- ✅ Semestral (intervalo: 6 meses, janela: 14 dias)
- ✅ Anual (intervalo: 12 meses, janela: 30 dias)

**Total: 4 OS preventivas criadas**

---

## 🔄 Como Funciona Agora

1. **Ao cadastrar um equipamento:**
   - O trigger `trg_equipamentos_generate_preventive_os` é disparado
   - A função `generate_preventive_os_for_equipment()` é chamada
   - **TODAS as frequências** são criadas de uma vez baseado no tipo de equipamento
   - Cada OS preventiva é criada com `status = 'novo'` e `tecnico_id = null`
   - A data programada é calculada usando `calculate_next_preventive_date()`

2. **Fallback:**
   - Se o tipo de equipamento não for reconhecido (ELEVADOR_ELETRICO, ELEVADOR_HIDRAULICO, PLATAFORMA_VERTICAL)
   - A função tenta usar os planos preventivos cadastrados na tabela `preventive_plans` como fallback

3. **Validações:**
   - Cliente deve estar ativo (`ativo = true`)
   - Contrato não deve estar vencido (`data_fim_contrato IS NULL OR data_fim_contrato >= current_date`)
   - Não cria OS duplicadas (verifica se já existe OS preventiva para a mesma data)

---

## 📝 Arquivos Modificados

- `supabase/migrations/20251106000002_create_preventive_os_generation.sql`
  - Função `generate_preventive_os_for_equipment()` atualizada
  - Agora usa regras hardcoded do plan.yaml ao invés de buscar na tabela `preventive_plans`

---

## ✅ Próximos Passos

1. **Aplicar migration atualizada:**
   ```sql
   -- Execute no Supabase SQL Editor
   -- Copie o conteúdo de: supabase/migrations/20251106000002_create_preventive_os_generation.sql
   ```

2. **Verificar trigger:**
   ```sql
   SELECT tgname, tgrelid::regclass, tgenabled
   FROM pg_trigger 
   WHERE tgname = 'trg_equipamentos_generate_preventive_os';
   ```

3. **Testar:**
   - Cadastrar um novo equipamento
   - Verificar se todas as OS preventivas foram criadas (4 ou 5 dependendo do tipo)

---

## 🔍 Verificação

Após aplicar a migration, teste cadastrando um equipamento:

```sql
-- 1. Cadastrar equipamento (via UI ou SQL)
-- 2. Verificar OS criadas
SELECT 
  os.id,
  os.numero_os,
  os.tipo,
  os.status,
  os.data_programada,
  os.observacoes,
  e.nome as equipamento_nome,
  e.tipo as tipo_equipamento
FROM public.ordens_servico os
INNER JOIN public.equipamentos e ON e.id = os.equipamento_id
WHERE os.tipo = 'preventiva'
  AND os.equipamento_id = 'UUID-DO-EQUIPAMENTO'
ORDER BY os.data_programada ASC;
```

**Resultado esperado:**
- ELEVADOR_ELETRICO: 4 OS preventivas
- ELEVADOR_HIDRAULICO: 5 OS preventivas
- PLATAFORMA_VERTICAL: 4 OS preventivas

---

**Data da atualização:** 2025-11-06

