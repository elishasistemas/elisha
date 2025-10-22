# 🔐 Regras de Acesso por Perfil - Sistema Elisha

## 🎯 **SISTEMA SIMPLIFICADO - 3 PERFIS**

> **Nota:** O perfil "Gestor" foi removido. Todos os gestores foram convertidos para "Admin".

## 📋 Perfis Disponíveis

O sistema possui **3 perfis** de acesso:

| Perfil | Descrição | Contexto |
|--------|-----------|----------|
| **Elisha Admin** | Super administrador | Multi-empresa (global) |
| **Admin** | Administrador da empresa | Empresa específica |
| **Técnico** | Técnico de campo | Empresa específica |

---

## 🎯 Regras por Perfil

### 1️⃣ **ELISHA ADMIN (Super Admin)**

**Características:**
- ✅ Acesso a **TODAS** as empresas
- ✅ Pode **impersonar** qualquer empresa
- ✅ Gerencia criação de empresas e primeiros usuários
- ✅ Acesso total ao sistema

**Permissões:**
```
✅ Criar/editar/deletar empresas
✅ Criar primeiro usuário de cada empresa
✅ Impersonar qualquer empresa
✅ Ver todas as empresas no Super Admin
✅ Acesso a todas as funcionalidades
✅ Gerenciar usuários de qualquer empresa
```

**Menu/Navegação:**
- Dashboard
- Ordens de Serviço
- Checklists
- Clientes
- Equipamentos
- Técnicos
- **Super Admin** (exclusivo) 👑

**Onde se aplica:**
- RLS: Bypass em algumas policies quando `is_elisha_admin = true`
- Frontend: Link "Super Admin" na sidebar
- Impersonation: Pode assumir identidade de qualquer empresa

---

### 2️⃣ **ADMIN (Administrador da Empresa)**

**Características:**
- ✅ Controle total da **sua empresa**
- ✅ Gerencia usuários da empresa
- ✅ Cria convites e define roles
- ❌ Sem acesso a outras empresas

**Permissões:**
```
✅ Gerenciar todos os dados da empresa
✅ Criar/editar/deletar:
   - Ordens de Serviço
   - Checklists
   - Clientes
   - Equipamentos
   - Técnicos
✅ Convidar novos usuários
✅ Definir roles (admin, gestor, técnico)
✅ Ver relatórios completos
✅ Aprovar/reprovar checklists
✅ Gerenciar configurações da empresa
```

**Menu/Navegação:**
- Dashboard (visão completa)
- Ordens de Serviço (todas)
- Checklists (todos)
- Clientes (todos)
- Equipamentos (todos)
- Técnicos (todos)
- Configurações → Usuários ✅

**RLS Policies:**
```sql
-- Acesso total aos dados da sua empresa
WHERE empresa_id = current_empresa_id()
```

**Casos de Uso:**
- Gerente geral da empresa
- Responsável por toda operação
- Contrata e gerencia equipe

---

### 3️⃣ **TÉCNICO (Técnico de Campo)**

**Características:**
- ✅ Acesso apenas às **suas** OS
- ✅ Executa checklists
- ✅ Foco em operação de campo
- ❌ Sem acesso a dados de outros técnicos

**Permissões:**
```
✅ Ver/editar apenas SUAS ordens de serviço
✅ Executar checklists das suas OS
✅ Atualizar status das suas OS
✅ Ver clientes relacionados às suas OS
✅ Ver equipamentos das suas OS
❌ Não vê OS de outros técnicos
❌ Não cria novos clientes
❌ Não gerencia equipe
❌ Sem acesso a relatórios completos
```

**Menu/Navegação (FILTRADO!):**
- Ordens de Serviço (apenas suas) ⚠️
- ❌ Sem acesso a:
  - Dashboard completo
  - Checklists gerais
  - Clientes
  - Equipamentos
  - Técnicos
  - Configurações

**RLS Policies:**
```sql
-- Acesso apenas às suas OS
WHERE empresa_id = current_empresa_id()
  AND tecnico_id = current_tecnico_id()
  AND active_role = 'tecnico'
```

**Casos de Uso:**
- Técnico de campo
- Executor de serviços
- Responsável por OS específicas

---

## 🔄 Sistema de Troca de Roles

### **Usuários com Múltiplos Roles**

Um usuário pode ter **múltiplos perfis**:

```typescript
{
  roles: ['admin', 'gestor', 'tecnico'],
  active_role: 'admin' // Role ativo no momento
}
```

**Como funciona:**
1. Usuário pode ter `roles = ['admin', 'gestor']`
2. Define qual está **ativo** via `active_role`
3. Pode **trocar** entre os roles disponíveis
4. Sistema adapta menu e permissões automaticamente

**Interface:**
- Componente `RoleSwitcher` na sidebar
- Usuário clica e troca o role ativo
- Página recarrega com novas permissões

---

## 📊 Tabela Comparativa de Permissões

| Funcionalidade | Elisha Admin | Admin | Gestor | Técnico |
|----------------|--------------|-------|--------|---------|
| Ver todas empresas | ✅ | ❌ | ❌ | ❌ |
| Impersonar empresa | ✅ | ❌ | ❌ | ❌ |
| Criar empresa | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ✅ | ❌ | ❌ |
| Convidar usuários | ✅ | ✅ | ❌ | ❌ |
| Ver todas OS da empresa | ✅ | ✅ | ✅ | ❌ |
| Ver apenas suas OS | - | - | - | ✅ |
| Criar OS | ✅ | ✅ | ✅ | ❌ |
| Editar OS | ✅ | ✅ | ✅ | ✅* |
| Executar checklist | ✅ | ✅ | ✅ | ✅ |
| Aprovar checklist | ✅ | ✅ | ✅ | ❌ |
| Ver clientes | ✅ | ✅ | ✅ | ⚠️** |
| Criar clientes | ✅ | ✅ | ✅ | ❌ |
| Ver equipamentos | ✅ | ✅ | ✅ | ⚠️** |
| Ver técnicos | ✅ | ✅ | ✅ | ❌ |
| Ver dashboard completo | ✅ | ✅ | ✅ | ❌ |
| Gerar relatórios | ✅ | ✅ | ✅ | ❌ |
| Configurações | ✅ | ✅ | ❌ | ❌ |

**Legenda:**
- ✅ = Acesso total
- ❌ = Sem acesso
- ⚠️* = Apenas suas próprias OS
- ⚠️** = Apenas relacionados às suas OS

---

## 🛡️ Implementação RLS (Row Level Security)

### **Policies Principais**

#### 1. **Ordens de Serviço**

```sql
-- Admin/Gestor: Todas da empresa
CREATE POLICY os_select_admin_gestor
ON ordens_servico FOR SELECT
USING (
  empresa_id = current_empresa_id()
  AND (active_role IN ('admin', 'gestor') OR is_elisha_admin = true)
);

-- Técnico: Apenas suas
CREATE POLICY os_select_tecnico
ON ordens_servico FOR SELECT
USING (
  empresa_id = current_empresa_id()
  AND tecnico_id = current_tecnico_id()
  AND active_role = 'tecnico'
);
```

#### 2. **Usuários (Profiles)**

```sql
-- Admin pode ver todos da empresa
CREATE POLICY profiles_select
ON profiles FOR SELECT
USING (
  empresa_id = current_empresa_id()
  AND (active_role = 'admin' OR is_elisha_admin = true)
);
```

#### 3. **Convites**

```sql
-- Admin pode criar convites
CREATE POLICY invites_insert
ON invites FOR INSERT
WITH CHECK (
  empresa_id = current_empresa_id()
  AND (active_role = 'admin' OR is_elisha_admin = true)
);
```

---

## 🎨 Adaptação da Interface

### **Menu Sidebar (app-sidebar.tsx)**

```typescript
const filteredItems = () => {
  if (active === 'tecnico') {
    // Técnico: Apenas OS
    return navMain.filter(i => i.url === '/orders')
  }
  // Admin/Gestor: Menu completo
  return navMain
}
```

### **Páginas Protegidas**

```typescript
// Verificar se é admin
const isAdmin = 
  currentProfile?.active_role === "admin" ||
  currentProfile?.roles?.includes("admin") ||
  currentProfile?.is_elisha_admin

if (!isAdmin) {
  return <div>Apenas administradores podem acessar</div>
}
```

---

## 📝 Exemplos de Uso

### **Cenário 1: Empresa XYZ**

**Usuários:**
- João → Admin (gerente geral)
- Maria → Gestor (supervisora)
- Carlos → Técnico (campo)
- Ana → Técnico (campo)

**Acessos:**
```
João (Admin):
  ✅ Ver OS de Carlos e Ana
  ✅ Criar novos técnicos
  ✅ Convidar Maria como gestora
  ✅ Aprovar checklists
  ✅ Gerar relatórios

Maria (Gestor):
  ✅ Ver OS de Carlos e Ana
  ✅ Acompanhar métricas
  ✅ Aprovar checklists
  ❌ Não pode convidar usuários

Carlos (Técnico):
  ✅ Ver apenas SUAS OS
  ✅ Executar checklists
  ❌ Não vê OS da Ana
  ❌ Não acessa dashboard

Ana (Técnico):
  ✅ Ver apenas SUAS OS
  ✅ Executar checklists
  ❌ Não vê OS do Carlos
  ❌ Não acessa dashboard
```

### **Cenário 2: Super Admin (Iverson)**

**Acesso Global:**
```
Iverson (Elisha Admin):
  ✅ Ver lista de TODAS empresas
  ✅ Criar empresa XYZ
  ✅ Criar primeiro admin (João)
  ✅ Impersonar empresa XYZ
  ✅ Ver dados como se fosse João
  ✅ Sair da impersonação
```

---

## 🔧 Configuração de Novo Usuário

### **Fluxo de Criação**

1. **Admin cria convite:**
   ```typescript
   {
     email: "novo@empresa.com",
     role: "tecnico", // ou "gestor" ou "admin"
     empresa_id: "uuid-da-empresa"
   }
   ```

2. **Usuário aceita convite:**
   - Cria senha
   - Profile é criado com `role` definido
   - Recebe `active_role = role` inicial

3. **Admin pode alterar roles:**
   ```typescript
   {
     roles: ['tecnico'], // Roles disponíveis
     active_role: 'tecnico' // Role ativo
   }
   ```

---

## 📖 Documentação Relacionada

- `ROLES_AND_RLS_IMPLEMENTATION.md` - Implementação técnica
- `IMPLEMENTATION_SUMMARY_ROLES.md` - Resumo da implementação
- `QUICK_START_ROLES.md` - Guia rápido
- `FLUXO_CONVITE_USUARIO.md` - Sistema de convites

---

## 🎯 Resumo Rápido

```
┌─────────────────────────────────────────────┐
│ 📊 HIERARQUIA DE ACESSO                     │
├─────────────────────────────────────────────┤
│ 1. Elisha Admin  → Tudo (multi-empresa)     │
│ 2. Admin         → Tudo (sua empresa)       │
│ 3. Gestor        → Visualização completa    │
│ 4. Técnico       → Apenas suas OS           │
└─────────────────────────────────────────────┘
```

**Regra de Ouro:**
- **Técnico** = Acesso **restrito** (apenas suas OS)
- **Gestor** = Acesso **completo** (sem gerenciar usuários)
- **Admin** = Acesso **total** (gerencia tudo)
- **Elisha Admin** = Acesso **global** (multi-empresa)

---

**✨ Sistema de roles completo e seguro!** 🔐

