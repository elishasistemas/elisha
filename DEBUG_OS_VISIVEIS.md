# 🔍 Debug: Por que as OS não aparecem?

**Data**: 27/10/2025  
**Problema relatado**: OS não aparecem no dashboard

---

## ✅ O que foi verificado

### 1. **OS Disponíveis no Banco de Dados**
✅ Existem **3 OS sem técnico** na sua empresa (`1c6ce1ff...`):
- `OS-2025-000004` - preventiva, baixa
- `OS-2025-000007` - corretiva, média
- `OS-2025-000010` - preventiva, baixa

### 2. **Seu Perfil**
```json
{
  "user_id": "653c7519-6bb4-419c-86eb-69c1ac958fa6",
  "active_role": "tecnico",
  "is_elisha_admin": true,
  "impersonating_empresa_id": "1c6ce1ff-7fca-480c-88e3-4d38a030e9cb",
  "tecnico_id": "dd0b8cf8-6fe2-4bea-aec2-90a381961f9a"
}
```

### 3. **Código dos Filtros**
✅ O código está correto para mostrar OS sem técnico quando você é admin ou está impersonando.

---

## 🐛 Possíveis Causas

### Causa 1: Hook `useOrdensServico` não retorna todas as OS
**Verificar**: O hook pode estar aplicando filtros adicionais (ex: filtro de data)

### Causa 2: RLS Policy está bloqueando
**Verificar**: As policies RLS em `ordens_servico` podem estar muito restritivas

### Causa 3: Estado do React não atualiza
**Verificar**: O `useMemo` ou `useState` pode não estar recalculando

---

## 🔧 Mudanças Aplicadas

### 1. **Logs de Debug** ✅
Adicionei `console.log` para verificar:
- Quantas OS são retornadas do banco
- Quantas passam pelo filtro de status (novo/parado)
- Se isAdmin/isImpersonating está true
- Quantas OS finais aparecem

### 2. **Botões Visíveis na Linha** ✅
Os botões **Aceitar** e **Recusar** agora estão:
- ✅ Sempre visíveis na coluna "Ações"
- ✅ Não ficam em menu dropdown
- ✅ Com cores distintas (verde para Aceitar, vermelho para Recusar)
- ✅ Com `stopPropagation` para não conflitar com clique na linha

### 3. **Toast Feedback** ✅
Agora mostra mensagens de:
- ✅ Sucesso ao aceitar
- ✅ Sucesso ao recusar
- ✅ Erro se algo der errado

### 4. **Coluna Equipamento** ✅
Adicionada coluna para mostrar equipamento (futuro)

---

## 📋 Como Testar

### Passo 1: Abra o Console do Browser
```
Chrome DevTools → Console tab
```

### Passo 2: Recarregue a Página
```
Ctrl+R (Windows) ou Cmd+R (Mac)
```

### Passo 3: Procure pelos Logs
Você verá algo como:
```javascript
[Dashboard] Filtrando OS abertas: {
  totalOrdens: 25,
  baseNovoOuParado: 9,
  isAdmin: false,
  isImpersonating: true,
  isTecnico: true,
  tecnicoId: "dd0b8cf8..."
}
[Dashboard] Admin/Impersonating - OS sem técnico: 3
```

---

## 🎯 Ações Baseadas nos Logs

### Se `totalOrdens: 0`
❌ **O hook não está retornando nenhuma OS**
- Verificar RLS policies
- Verificar se `empresaAtiva` está correto
- Verificar se há filtro de data no hook

### Se `baseNovoOuParado: 0`
❌ **Nenhuma OS tem status novo/parado**
- Criar novas OS de teste
- Mudar status de OS existentes

### Se `isImpersonating: false`
❌ **O código não detecta que você está impersonando**
- Verificar `profile?.is_elisha_admin`
- Verificar `profile?.impersonating_empresa_id`

### Se `OS sem técnico: 0` mas `baseNovoOuParado: 3`
❌ **Todas as OS têm técnico atribuído**
- Remover técnico de algumas OS manualmente no DB
- Criar novas OS sem técnico

---

## 🚀 Teste Direto no Supabase

Execute no SQL Editor:

```sql
-- Ver suas OS disponíveis
SELECT 
  os.numero_os,
  os.status,
  os.tecnico_id,
  os.tipo,
  os.prioridade,
  c.nome_local as cliente
FROM ordens_servico os
LEFT JOIN clientes c ON c.id = os.cliente_id
WHERE os.empresa_id = '1c6ce1ff-7fca-480c-88e3-4d38a030e9cb'
  AND os.status IN ('novo', 'parado')
  AND os.tecnico_id IS NULL
ORDER BY os.created_at DESC;
```

Se retornar OS, o problema é no frontend.  
Se retornar vazio, o problema é no banco de dados.

---

## 📞 Próximos Passos

1. ✅ **Atualizar página** (Ctrl+R) e verificar console
2. ✅ **Tirar print dos logs** e me enviar
3. ✅ **Testar query SQL** acima e me dizer resultado
4. ✅ **Verificar se seção "OS Abertas"** aparece no dashboard (embaixo de "Ordens Recentes")

---

**Status**: ⏳ Aguardando feedback do console do navegador

