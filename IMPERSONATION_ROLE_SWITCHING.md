# 🎭 Troca de Papéis durante Impersonation

Sistema que permite ao Super Admin alternar entre diferentes papéis (Admin, Gestor, Técnico) enquanto impersona uma empresa, para testar diferentes níveis de acesso e permissões.

---

## ✅ O Que Foi Implementado

### 1. **Múltiplos Roles no Impersonation**

Quando o Super Admin impersona uma empresa, ele automaticamente recebe **todos os papéis disponíveis**:

```typescript
// src/app/(admin)/admin/companies/page.tsx
{
  impersonating_empresa_id: company.id,
  roles: ['admin', 'gestor', 'tecnico'],
  active_role: 'admin'  // Começa como admin
}
```

**Benefícios:**
- ✅ Testa visões de diferentes usuários
- ✅ Valida RLS policies por papel
- ✅ Simula experiência completa do usuário
- ✅ Debug de permissões

---

### 2. **RoleSwitcher no Banner de Impersonation**

O `RoleSwitcher` foi integrado ao banner amarelo de impersonation:

```typescript
// src/components/admin/impersonation-banner.tsx
<RoleSwitcher className="ml-4" />
```

**Interface:**
- 🎨 Select dropdown com ícones
- 👔 Gestor
- 🔧 Técnico  
- ⚙️ Admin

**Comportamento:**
- Mostra apenas se houver múltiplos roles (sempre o caso em impersonation)
- Atualiza JWT claims ao trocar
- Recarrega página para aplicar novo RLS
- Feedback visual com toast

---

### 3. **API Update Claims Melhorada**

A API `/api/auth/update-claims` agora suporta impersonation:

```typescript
// src/app/api/auth/update-claims/route.ts
const effectiveEmpresaId = profile.is_elisha_admin && profile.impersonating_empresa_id 
  ? profile.impersonating_empresa_id 
  : profile.empresa_id
```

**Claims incluídos no JWT:**
```json
{
  "empresa_id": "uuid-da-empresa-impersonada",
  "active_role": "gestor",
  "roles": ["admin", "gestor", "tecnico"],
  "is_elisha_admin": true,
  "impersonating_empresa_id": "uuid-da-empresa-impersonada"
}
```

---

### 4. **Restauração ao Sair**

Quando sai do modo impersonation, o profile é restaurado:

```typescript
// src/app/api/admin/stop-impersonation/route.ts
{
  impersonating_empresa_id: null,
  roles: ['elisha_admin'],
  active_role: 'elisha_admin',
  empresa_id: null
}
```

---

## 🚀 Como Usar

### Passo 1: Impersonar Empresa

1. Acesse `/admin/companies`
2. Clique em **"Acessar"** na empresa desejada
3. Banner amarelo aparece no topo
4. Você começa no papel de **Admin**

### Passo 2: Alternar Papéis

**No Banner de Impersonation:**

1. Clique no dropdown do `RoleSwitcher`
2. Selecione o papel desejado:
   - **👔 Gestor**: Ver dashboards, gerenciar OS, clientes
   - **🔧 Técnico**: Ver apenas suas OS, executar checklists
   - **⚙️ Admin**: Acesso total, gerenciar usuários

3. Sistema:
   - Atualiza `active_role` no profile
   - Atualiza JWT claims
   - Recarrega página
   - Mostra toast de confirmação

### Passo 3: Testar Diferentes Visões

**Como Gestor:**
```
✅ Ver todas as OS da empresa
✅ Criar/editar clientes
✅ Criar/editar equipamentos
✅ Gerenciar colaboradores (se tiver permissão)
❌ Não consegue gerenciar usuários/convites
```

**Como Técnico:**
```
✅ Ver apenas suas OS
✅ Executar checklists
✅ Atualizar status de OS
❌ Não consegue criar clientes
❌ Não consegue ver OS de outros técnicos
❌ Não tem acesso a relatórios gerenciais
```

**Como Admin:**
```
✅ Acesso total
✅ Gerenciar usuários
✅ Criar convites
✅ Ver todas as OS
✅ Configurações da empresa
```

### Passo 4: Sair do Impersonation

1. Clique em **"Sair"** no banner amarelo
2. Sistema restaura seu perfil de Super Admin
3. Redireciona para `/admin/companies`

---

## 🔒 Segurança

### Validações Implementadas

1. **Apenas Super Admin pode impersonar**
   - Verificação de `is_elisha_admin = true`
   - Proteção no layout `/admin/*`

2. **Roles limitados durante impersonation**
   - Apenas `admin`, `gestor`, `tecnico`
   - Não pode voltar para `elisha_admin` durante impersonation
   - Precisa sair do impersonation primeiro

3. **Audit Log**
   - Todas as impersonations registradas
   - Data/hora de início e fim
   - Qual empresa foi acessada

4. **RLS Policies**
   - Respeitam `active_role` do JWT
   - Filtragem por `empresa_id` (da empresa impersonada)
   - Super admin não bypassa RLS durante impersonation

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Super Admin Login                                        │
│    - is_elisha_admin: true                                  │
│    - roles: ['elisha_admin']                                │
│    - active_role: 'elisha_admin'                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Acessa /admin/companies                                  │
│    - Vê lista de todas as empresas                          │
│    - Clica em "Acessar" na Empresa X                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Impersonation Ativo                                      │
│    - impersonating_empresa_id: 'uuid-empresa-x'             │
│    - roles: ['admin', 'gestor', 'tecnico']                  │
│    - active_role: 'admin'                                   │
│    - Banner amarelo aparece                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Troca para Técnico                                       │
│    - Clica no RoleSwitcher                                  │
│    - Seleciona "🔧 Técnico"                                 │
│    - active_role: 'tecnico'                                 │
│    - JWT atualizado                                         │
│    - Página recarrega                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Visão de Técnico                                         │
│    - Vê apenas suas OS                                      │
│    - Pode executar checklists                               │
│    - Menu simplificado                                      │
│    - RLS limita dados                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Troca para Gestor                                        │
│    - Clica no RoleSwitcher                                  │
│    - Seleciona "👔 Gestor"                                  │
│    - active_role: 'gestor'                                  │
│    - Vê todas as OS da empresa                              │
│    - Pode criar clientes/equipamentos                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Sair do Impersonation                                    │
│    - Clica em "Sair" no banner                              │
│    - impersonating_empresa_id: null                         │
│    - roles: ['elisha_admin']                                │
│    - active_role: 'elisha_admin'                            │
│    - Volta para /admin/companies                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Casos de Teste

### Teste 1: Impersonation com Admin
```bash
1. Login como Super Admin
2. Acessar empresa teste
3. Verificar que começa como "Admin"
4. Tentar acessar /settings/users
5. ✅ Deve conseguir ver página de usuários
```

### Teste 2: Troca para Técnico
```bash
1. No impersonation, trocar para "Técnico"
2. Verificar menu lateral (menos opções)
3. Tentar acessar /settings/users
4. ❌ Deve ser bloqueado ou mostrar acesso negado
5. Ir para /orders
6. ✅ Deve ver apenas suas OS (se houver tecnico_id)
```

### Teste 3: Troca para Gestor
```bash
1. Trocar para "Gestor"
2. Verificar menu completo (exceto admin)
3. Tentar criar cliente
4. ✅ Deve conseguir
5. Tentar acessar /settings/users
6. ❌ Deve ser bloqueado (apenas admin)
```

### Teste 4: Sair e Retornar
```bash
1. Sair do impersonation
2. Verificar que voltou para /admin/companies
3. Verificar que não vê mais banner amarelo
4. Tentar acessar /dashboard
5. ❌ Deve redirecionar ou mostrar vazio (sem empresa)
```

---

## 🎯 Benefícios

### Para Desenvolvimento
- 🐛 Debug de RLS policies por papel
- 🔍 Identificar problemas de permissão
- 🧪 Testar cenários sem criar múltiplos usuários
- 📝 Validar mensagens de erro apropriadas

### Para Suporte
- 👀 Ver exatamente o que o cliente vê
- 🛠️ Diagnosticar problemas reportados
- 📊 Verificar dados específicos de cada papel
- 🎓 Treinar equipe em diferentes níveis

### Para QA
- ✅ Validar funcionalidades por papel
- 🔐 Testar isolamento de dados
- 📱 Verificar UI responsivo por contexto
- 🎨 Confirmar permissões visuais

---

## ⚠️ Limitações

1. **Não pode ser elisha_admin durante impersonation**
   - Precisa sair primeiro
   - Evita confusão de contexto

2. **Recarrega página ao trocar**
   - Necessário para atualizar RLS
   - Estado da aplicação é perdido
   - Use em momentos apropriados

3. **Não persiste papel escolhido**
   - Sempre começa como Admin ao impersonar
   - Cada impersonation é nova sessão

---

## 🔧 Manutenção

### Adicionar Novo Papel

Se no futuro adicionar um novo papel (ex: `supervisor`):

```typescript
// 1. Atualizar impersonation
roles: ['admin', 'gestor', 'tecnico', 'supervisor']

// 2. Adicionar label no RoleSwitcher
const labels: Record<string, string> = {
  admin: '⚙️ Admin',
  gestor: '👔 Gestor',
  tecnico: '🔧 Técnico',
  supervisor: '👁️ Supervisor'
}

// 3. Atualizar RLS policies se necessário
```

### Logs de Debug

Para debug, adicione logs nas APIs:

```typescript
console.log('[impersonation] active_role:', profile.active_role)
console.log('[impersonation] roles:', profile.roles)
console.log('[impersonation] empresa_id:', effectiveEmpresaId)
```

---

## 📚 Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `src/app/(admin)/admin/companies/page.tsx` | Adiciona todos os roles ao impersonar |
| `src/app/api/auth/update-claims/route.ts` | Suporta impersonation_empresa_id |
| `src/components/admin/impersonation-banner.tsx` | Adiciona RoleSwitcher |
| `src/app/api/admin/stop-impersonation/route.ts` | Restaura roles originais |

---

## ✨ Próximos Passos

### Curto Prazo
- [ ] Adicionar indicador visual do papel ativo no menu
- [ ] Mostrar toast ao recarregar após troca
- [ ] Persistir último papel usado por empresa

### Médio Prazo
- [ ] Dashboard de analytics de impersonations
- [ ] Filtros por papel nos logs de auditoria
- [ ] Comparação lado-a-lado de visões

### Longo Prazo
- [ ] Modo "tour guiado" por papéis
- [ ] Screenshots automáticos por papel para docs
- [ ] Testes E2E por papel

---

**Implementado em:** Outubro 22, 2025  
**Versão:** 1.0.0  
**Status:** ✅ PRONTO PARA USO

**Desenvolvido para:** Sistema Elisha - Gestão Multi-empresa

