# Perfil Supervisor - Documentação

## Visão Geral
O perfil **Supervisor** foi implementado como um perfil intermediário entre Admin e Técnico, com permissões específicas para gerenciar ordens de serviço e equipe técnica.

## Permissões do Supervisor

### ✅ Acesso Permitido

1. **Ordens de Serviço**
   - Visualizar todas as ordens de serviço da empresa
   - Criar novas ordens de serviço
   - Atribuir OS para técnicos
   - Atender ordens de serviço
   - Visualizar histórico completo de OS

2. **Relatórios**
   - Acessar relatórios de ordens de serviço
   - Visualizar indicadores de desempenho da equipe
   - Exportar relatórios

3. **Checklists**
   - Visualizar checklists
   - Criar e gerenciar checklists

### ❌ Acesso Negado

1. **Gestão da Empresa**
   - ❌ Alterar dados da empresa
   - ❌ Configurações gerais do sistema

2. **Cadastros**
   - ❌ Cadastrar/editar clientes
   - ❌ Cadastrar/editar equipamentos
   - ❌ Cadastrar equipe (técnicos/supervisores)

3. **Dashboard Admin**
   - ❌ Acesso ao dashboard completo de administração
   - ❌ Visão financeira/faturamento

4. **Manutenção Preventiva**
   - ❌ Programar e gerenciar planos de manutenção preventiva

## Implementação Técnica

### Frontend

1. **Tipo ActiveRole** (`apps/web/src/utils/auth.ts`)
   ```typescript
   export type ActiveRole = 'admin' | 'supervisor' | 'tecnico' | 'elisha_admin'
   ```

2. **Função Helper** (`apps/web/src/utils/auth.ts`)
   ```typescript
   export function isSupervisor(session, profile) {
     const roles = getRoles(session, profile)
     const active = getActiveRole(session, profile)
     return roles.includes('supervisor') && active === 'supervisor'
   }
   ```

3. **Hook useActiveRole** (`apps/web/src/hooks/use-active-role.ts`)
   - Adicionado campo `isSupervisor: boolean`

4. **Role Switch Component** (`apps/web/src/components/role-switch.tsx`)
   - Botão "Supervisor" com ícone UserCog
   - Atalho: Ctrl+S

5. **Proteção de Rotas** (`apps/web/src/utils/route-protection.tsx`)
   - Supervisor pode acessar: `/orders`, `/reports`, `/service-orders`, `/checklists`
   - Redireciona para `/orders` ao tentar acessar rotas administrativas

### Backend

1. **Migration SQL** (`supabase/migrations/20251205000000_add_supervisor_role.sql`)
   - Atualiza constraints de `role` e `active_role`
   - Cria helper functions: `is_admin_or_supervisor()` e `can_manage_os()`

2. **API Routes** (`apps/web/src/app/api/session/active-role/route.ts`)
   - Aceita 'supervisor' como role válido

3. **RLS Policies**
   - Funções de aceitar/recusar OS: incluem 'supervisor'
   - Políticas de leitura de OS: incluem 'supervisor'

## Como Atribuir Perfil Supervisor

### Via Interface (Admin)
1. Acessar gestão de usuários
2. Editar perfil do usuário
3. Adicionar role 'supervisor' ao array de roles
4. Definir active_role como 'supervisor'

### Via SQL (Desenvolvimento)
```sql
UPDATE public.profiles
SET 
  roles = ARRAY['supervisor'],
  active_role = 'supervisor'
WHERE user_id = '<user_id>';
```

## Fluxo de Uso

1. **Login**: Usuário faz login normalmente
2. **Role Switch**: Pode alternar entre perfis disponíveis (Ctrl+S para Supervisor)
3. **Acesso Limitado**: Sistema redireciona automaticamente se tentar acessar rota não permitida
4. **Gerenciar OS**: Acessa `/orders` para visualizar, criar e gerenciar ordens de serviço
5. **Relatórios**: Acessa `/reports` para visualizar indicadores da equipe

## Atalhos de Teclado

- **Ctrl+A**: Alternar para Admin (se disponível)
- **Ctrl+S**: Alternar para Supervisor (se disponível)
- **Ctrl+T**: Alternar para Técnico (se disponível)

## Hierarquia de Permissões

```
Admin (Gestor)
  └── Supervisor
        └── Técnico
```

- **Admin**: Acesso total ao sistema
- **Supervisor**: Gerencia OS e equipe, sem acesso a cadastros e configurações
- **Técnico**: Executa OS atribuídas, acesso limitado

## Próximos Passos

1. ✅ Implementar perfil no frontend
2. ✅ Criar migration SQL
3. ✅ Atualizar proteção de rotas
4. ⏳ Testar permissões em desenvolvimento
5. ⏳ Atualizar RLS policies específicas
6. ⏳ Criar testes automatizados
7. ⏳ Documentar no manual do usuário
8. ⏳ Deploy para produção
