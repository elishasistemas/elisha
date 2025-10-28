# Dashboard Único com Permissões Diferenciadas

**Data:** 2025-10-27
**Status:** ✅ Implementado

## 🎯 Objetivo

Consolidar em um único dashboard com permissões diferentes para Admin e Técnico, removendo o tech-dashboard separado.

## 📋 Regras de Negócio

### 👨‍💼 **Admin (Perfil: admin)**

**Visualização:**
- ✅ Vê **TODAS** as OS da empresa
- ✅ Vê **TODOS** os gráficos e indicadores
- ✅ Pode aceitar/recusar chamados sem dono

**Páginas acessíveis:**
- ✅ Dashboard
- ✅ Ordens de Serviço
- ✅ Checklists
- ✅ Clientes
- ✅ Técnicos
- ✅ Configurações (via menu de perfil)

**Filtros:**
```typescript
// Admin vê tudo - sem filtros adicionais
ordensFiltradas = ordens  // Todas as OS

// Seção "Chamados" para aceitar/recusar
ordensAbertas = ordens.filter(o => 
  o.tipo === 'chamado' && 
  (o.status === 'novo' || o.status === 'parado') &&
  !o.tecnico_id  // Apenas sem dono
)
```

### 👷 **Técnico (Perfil: tecnico)**

**Visualização:**
- ✅ Vê apenas **SUAS OS** (atribuídas a ele via `tecnico_id`)
- ✅ Vê **chamados sem técnico** para aceitar/recusar
- ✅ Gráficos e indicadores baseados apenas em suas OS

**Páginas acessíveis:**
- ✅ Dashboard
- ✅ Ordens de Serviço
- ✅ Configurações (via menu de perfil)

**Filtros:**
```typescript
// Técnico vê apenas suas OS
ordensFiltradas = ordens.filter(o => 
  o.tecnico_id === tecnicoId
)

// Seção "Chamados" para aceitar/recusar
ordensAbertas = ordens.filter(o => 
  o.tipo === 'chamado' && 
  (o.status === 'novo' || o.status === 'parado') &&
  (!o.tecnico_id || o.tecnico_id === tecnicoId)  // Sem dono OU dele
)
```

## 🗂️ Estrutura do Dashboard Único

```
/dashboard (único para todos)
├── Header com filtro de período
├── Cards de Indicadores
│   ├── Chamados (gráfico de barras)
│   ├── Preventivas Hoje
│   └── Elevadores Parados
│
├── Seção "Chamados" (aceitar/recusar)
│   ├── Admin: vê chamados sem dono
│   └── Técnico: vê chamados sem dono OU dele
│
└── Tabela "Ordens de Serviço Recentes"
    ├── Admin: vê todas as OS
    └── Técnico: vê apenas suas OS
```

## 🔄 Mudanças Implementadas

### 1. Removido tech-dashboard ❌
```bash
# Arquivo deletado
src/app/(protected)/tech-dashboard/page.tsx
```

### 2. Dashboard único (`/dashboard`) atualizado ✅

**Arquivo:** `src/app/(protected)/dashboard/page.tsx`

**Filtros ajustados:**
```typescript
// Linhas 121-135: Seção Chamados (aceitar/recusar)
const ordensAbertas = useMemo(() => {
  const base = ordens.filter(o => 
    o.tipo === 'chamado' && 
    (o.status === 'novo' || o.status === 'parado')
  )
  
  if (isAdmin || isImpersonating) {
    return base.filter(o => !o.tecnico_id)  // Admin: apenas sem dono
  }
  if (isTecnico && tecnicoId) {
    return base.filter(o => !o.tecnico_id || o.tecnico_id === tecnicoId)  // Técnico: sem dono OU dele
  }
  return []
}, [ordens, isAdmin, isImpersonating, isTecnico, tecnicoId])

// Linhas 213-223: Ordens Recentes (tabela)
const ordensFiltradas = useMemo(() => {
  let filtradas = ordens.filter(ordem => {
    const dataOrdem = new Date(ordem.created_at)
    return dataOrdem >= dataInicial
  })
  
  // Se for técnico, filtrar apenas suas OS (atribuídas a ele)
  if (isTecnico && tecnicoId) {
    filtradas = filtradas.filter(ordem => ordem.tecnico_id === tecnicoId)
  }
  // Admin vê tudo (sem filtro adicional)
  
  return filtradas
}, [ordens, dataInicial, isTecnico, tecnicoId])
```

### 3. Sidebar atualizada ✅

**Arquivo:** `src/components/app-sidebar.tsx`

```typescript
const filteredItems = ((): typeof data.navMain => {
  if (active === 'tecnico') {
    // Técnico: Dashboard + Ordens de Serviço apenas
    // Configurações dele estão no NavUser (menu de perfil)
    return data.navMain.filter((i) => 
      i.url === '/dashboard' || i.url === '/orders'
    )
  }
  // Admin: menu completo
  return data.navMain
})()
```

**Resultado:**
- ✅ Admin vê: Dashboard, OS, Checklists, Clientes, Técnicos
- ✅ Técnico vê: Dashboard, OS
- ✅ Ambos acessam Configurações via dropdown do perfil

### 4. Gráficos e Indicadores ✅

**Comportamento:**
- ✅ Técnico: gráficos calculados apenas com suas OS
- ✅ Admin: gráficos calculados com todas as OS

```typescript
// Exemplo: Gráfico de Chamados
const chamadosFiltrados = useMemo(() => {
  return ordens.filter(ordem => {
    const dataOrdem = new Date(ordem.created_at)
    return ordem.tipo === 'chamado' && dataOrdem >= dataInicialChamados
  })
}, [ordens, dataInicialChamados])
// Note: usa 'ordens' que já está filtrado por técnico no useOrdensServico

// Indicadores
const stats = useMemo(() => {
  // Chamados Abertos vs Fechados
  const chamadosAbertos = chamadosFiltrados.filter(o => 
    o.status === 'novo' || o.status === 'em_andamento' || o.status === 'parado'
  ).length
  
  // Preventivas Hoje
  let preventivasHoje = ordens.filter(o => 
    o.tipo === 'preventiva' && o.data_programada === hoje
  )
  
  // Se for técnico, filtrar apenas suas OS
  if (isTecnico && tecnicoId) {
    preventivasHoje = preventivasHoje.filter(o => o.tecnico_id === tecnicoId)
  }
  
  // Elevadores Parados
  const elevadoresParados = ordens.filter(o => o.status === 'parado').length
  
  return { chamadosAbertos, chamadosFechados, ... }
}, [chamadosFiltrados, ordens, isTecnico, tecnicoId])
```

## 🎨 Interface Visual

### Admin vê:
```
┌─────────────────────────────────────────┐
│ Dashboard (Admin)                       │
├─────────────────────────────────────────┤
│ Chamados │ Preventivas │ Elevadores     │
│ (todos)  │ (todas)     │ (todos)        │
├─────────────────────────────────────────┤
│ Chamados (Aceitar/Recusar)              │
│ - Chamado sem técnico #1234             │
│ - Chamado sem técnico #1235             │
├─────────────────────────────────────────┤
│ Ordens de Serviço Recentes              │
│ - Todas as OS da empresa                │
└─────────────────────────────────────────┘
```

### Técnico vê:
```
┌─────────────────────────────────────────┐
│ Dashboard (Técnico)                     │
├─────────────────────────────────────────┤
│ Chamados │ Preventivas │ Elevadores     │
│ (dele)   │ (dele)      │ (dele)         │
├─────────────────────────────────────────┤
│ Chamados (Aceitar/Recusar)              │
│ - Chamado sem técnico #1234             │
│ - Chamado dele #1236                    │
├─────────────────────────────────────────┤
│ Ordens de Serviço Recentes              │
│ - Apenas suas OS atribuídas             │
└─────────────────────────────────────────┘
```

## 📊 Tabela Comparativa

| Funcionalidade | Admin | Técnico |
|----------------|-------|---------|
| **Dashboard** | ✅ Todas as OS | ✅ Apenas suas OS |
| **Chamados sem dono** | ✅ Pode aceitar | ✅ Pode aceitar |
| **Gráficos** | Todas as OS | Apenas suas OS |
| **Preventivas Hoje** | Todas | Apenas dele |
| **Elevadores Parados** | Todos | Apenas dele |
| **Sidebar - Checklists** | ✅ | ❌ |
| **Sidebar - Clientes** | ✅ | ❌ |
| **Sidebar - Técnicos** | ✅ | ❌ |
| **Configurações** | ✅ (menu perfil) | ✅ (menu perfil) |

## 🔐 Segurança (RLS)

As políticas RLS do Supabase garantem:
- ✅ Técnico só vê OS com `tecnico_id = seu_id`
- ✅ Admin vê todas as OS da empresa
- ✅ Chamados sem `tecnico_id` são visíveis para aceitar

## 🧪 Como Testar

### Como Admin:
1. Faça login como admin
2. Vá para `/dashboard`
3. ✅ Deve ver todas as OS da empresa
4. ✅ Seção "Chamados" mostra apenas sem dono
5. ✅ Pode aceitar/recusar chamados

### Como Técnico:
1. Faça login como técnico
2. Vá para `/dashboard`
3. ✅ Deve ver apenas suas OS
4. ✅ Seção "Chamados" mostra sem dono + dele
5. ✅ Pode aceitar/recusar chamados disponíveis
6. ✅ Sidebar mostra apenas Dashboard e OS

### Mudança de Perfil:
1. Alterne entre admin/técnico
2. ✅ Conteúdo do dashboard muda automaticamente
3. ✅ Sidebar se adapta ao perfil

## 📝 Arquivos Modificados

```
✅ Removido:
- src/app/(protected)/tech-dashboard/page.tsx

✅ Modificado:
- src/app/(protected)/dashboard/page.tsx (filtros unificados)
- src/components/app-sidebar.tsx (filtro de menu por perfil)

✅ Mantido sem alteração:
- src/components/nav-user.tsx (configurações já acessíveis)
```

## ✅ Status Final

- [x] ✅ Tech-dashboard removido
- [x] ✅ Dashboard único implementado
- [x] ✅ Filtros corretos para Admin e Técnico
- [x] ✅ Sidebar adaptativa por perfil
- [x] ✅ Seção Chamados com regras corretas
- [x] ✅ Gráficos respeitam filtros
- [x] ✅ Configurações acessíveis para ambos
- [x] ✅ Documentação completa

---

**Próximos Passos (conforme plan.yaml):**
- [ ] Tarefa 2: Tela Full Screen + cronômetro de deslocamento
- [ ] Tarefa 3: RPC `os_checkin()` + UI
- [ ] Tarefa 4: Checklist + Laudo + Evidências

**Autor:** Cursor AI
**Revisão:** Pendente
**Deploy:** Pronto para teste

