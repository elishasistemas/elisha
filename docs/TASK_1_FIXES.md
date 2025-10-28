# Correções da Tarefa 1 - Aceitar/Recusar OS

**Data:** 2025-10-27
**Status:** ✅ Concluído

## 🐛 Problemas Identificados

### 1. Erro "internal_error" sem mensagem detalhada
- **Sintoma:** Toast mostrava apenas "internal_error" ao invés da mensagem completa
- **Causa:** Frontend exibia `result.error` (código) ao invés de `result.message` (mensagem descritiva)
- **Localização:** `dashboard/page.tsx`, `tech-dashboard/page.tsx`

### 2. Listagem "Chamados" mostrava todos os tipos de OS
- **Sintoma:** Gráfico filtrava por `tipo='chamado'`, mas listagem mostrava todos os tipos
- **Causa:** Filtro `ordensAbertas` não incluía `tipo === 'chamado'`
- **Localização:** `dashboard/page.tsx` linha 98

### 3. Status novos não eram reconhecidos
- **Sintoma:** Status `em_deslocamento`, `checkin`, `checkout`, `reaberta` não apareciam
- **Causa:** `statusConfig` não incluía os novos status do plan.yaml

## ✅ Correções Aplicadas

### 1. Novos Status Adicionados ao Banco ✅

**Migration:** `add_missing_os_status_values.sql`

```sql
ALTER TYPE os_status ADD VALUE IF NOT EXISTS 'em_deslocamento';
ALTER TYPE os_status ADD VALUE IF NOT EXISTS 'checkin';
ALTER TYPE os_status ADD VALUE IF NOT EXISTS 'checkout';
ALTER TYPE os_status ADD VALUE IF NOT EXISTS 'reaberta';
```

**Status Completos Agora:**
1. `novo` - OS criada
2. `em_deslocamento` ⚡ **NOVO** - Técnico aceitou e está indo
3. `checkin` ⚡ **NOVO** - Técnico chegou no local
4. `em_andamento` - Executando o serviço
5. `checkout` ⚡ **NOVO** - Serviço finalizado
6. `aguardando_assinatura` - Aguardando assinatura
7. `concluido` - Finalizado
8. `cancelado` - Cancelado
9. `parado` - Equipamento parado
10. `reaberta` ⚡ **NOVO** - Reaberta após conclusão

### 2. Função `os_accept` Atualizada ✅

**Antes:**
```sql
status = 'em_andamento'
```

**Depois:**
```sql
status = 'em_deslocamento'  -- Técnico está a caminho
message = 'OS aceita! Você está em deslocamento. Registre o check-in ao chegar.'
```

### 3. Tratamento de Erros Melhorado ✅

**Arquivos corrigidos:**
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/tech-dashboard/page.tsx`

**Antes:**
```typescript
if (!result.success) {
  toast.error(result.error || 'Erro ao aceitar OS')  // Mostra apenas código
}
```

**Depois:**
```typescript
if (!result.success) {
  const errorMsg = result.message || result.error || 'Erro ao aceitar OS'
  console.error('[dashboard] os_accept failed:', result)  // Log completo
  toast.error(errorMsg)  // Mostra mensagem descritiva
}
```

### 4. Filtro de Chamados Corrigido ✅

**Arquivo:** `src/app/(protected)/dashboard/page.tsx`

**Antes:**
```typescript
const ordensAbertas = useMemo(() => {
  const base = ordens.filter(o => o.status === 'novo' || o.status === 'parado')
  // ❌ Mostrava TODOS os tipos
}, [ordens, ...])
```

**Depois:**
```typescript
const ordensAbertas = useMemo(() => {
  const base = ordens.filter(o => 
    o.tipo === 'chamado' &&  // ✅ Filtra apenas chamados
    (o.status === 'novo' || o.status === 'parado')
  )
}, [ordens, ...])
```

### 5. StatusConfig Atualizado ✅

**Arquivos:**
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/orders/page.tsx`

**Adicionados:**
```typescript
em_deslocamento: {
  label: 'Em Deslocamento',
  icon: Clock,
  className: 'bg-purple-500 text-white'
},
checkin: {
  label: 'No Local',
  icon: CheckCircle,
  className: 'bg-indigo-500 text-white'
},
checkout: {
  label: 'Finalizado',
  icon: CheckCircle,
  className: 'bg-teal-500 text-white'
},
reaberta: {
  label: 'Reaberta',
  icon: RefreshCw,
  className: 'bg-amber-500 text-white'
}
```

## 🎯 Resultado

### Antes:
- ❌ Erro "internal_error" sem detalhes
- ❌ Gráfico e listagem de "Chamados" inconsistentes
- ❌ Status novos não reconhecidos
- ❌ `os_accept` mudava para `em_andamento` diretamente

### Depois:
- ✅ Mensagens de erro claras e descritivas
- ✅ Gráfico e listagem ambos filtram `tipo='chamado'`
- ✅ Todos os 10 status reconhecidos e estilizados
- ✅ `os_accept` muda para `em_deslocamento` (conforme plan.yaml)
- ✅ Console.error com objeto completo para debug

## 📊 Consistência Gráfico vs Listagem

| Aspecto | Gráfico "Chamados" | Listagem "Chamados" | Status |
|---------|-------------------|---------------------|--------|
| **Filtro tipo** | ✅ `tipo='chamado'` | ✅ `tipo='chamado'` | ✅ **Consistente** |
| **Filtro status** | Todos os status | `novo`, `parado` | ✅ OK (propósitos diferentes) |
| **Período** | Últimos X dias | Tempo real | ✅ OK (propósitos diferentes) |

## 🔄 Próximos Passos (Plan.yaml)

- [x] ✅ **Tarefa 1:** Aceitar/Recusar OS - **CONCLUÍDA**
- [ ] 🔄 **Tarefa 2:** Tela Full Screen + cronômetro de deslocamento
- [ ] ⏳ **Tarefa 3:** RPC `os_checkin()` + UI
- [ ] ⏳ **Tarefa 4:** Checklist + Laudo + Evidências
- [ ] ⏳ **Tarefa 5:** RPC `os_checkout()` + estado do equipamento
- [ ] ⏳ **Tarefa 6:** Timeline/Relatório
- [ ] ⏳ **Tarefa 7:** RPC `os_reopen()`
- [ ] ⏳ **Tarefa 8:** E2E tests

## 🧪 Como Testar

1. **Aceitar OS:**
   - Faça login como técnico
   - Vá para Dashboard ou Tech Dashboard
   - Clique em "Aceitar" em um chamado
   - ✅ Deve mostrar mensagem "OS aceita! Você está em deslocamento..."
   - ✅ Status deve mudar para "Em Deslocamento" (roxo)

2. **Recusar OS:**
   - Clique em "Recusar"
   - Digite motivo opcional
   - ✅ Deve registrar recusa no histórico
   - ✅ OS permanece disponível para outros técnicos

3. **Verificar Filtros:**
   - ✅ Gráfico mostra apenas chamados
   - ✅ Listagem mostra apenas chamados
   - ✅ Ambos respeitam filtros de status

## 📝 Arquivos Modificados

```
✅ Backend:
- supabase/migrations/add_missing_os_status_values.sql (novo)
- supabase/migrations/fix_os_decline_nome_column.sql (aplicado anteriormente)

✅ Frontend:
- src/app/(protected)/dashboard/page.tsx (status + filtros + erros)
- src/app/(protected)/orders/page.tsx (status)
- src/app/(protected)/tech-dashboard/page.tsx (erros)

✅ Documentação:
- docs/TASK_1_FIXES.md (este arquivo)
```

---

**Autor:** Cursor AI
**Revisão:** Pendente
**Deploy:** Pronto para teste

