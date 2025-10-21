# Roles & RLS — Implementação

Este documento descreve a implementação de papéis acumuláveis (gestor/tecnico), modo ativo e RLS no Supabase.

## 1) Migrações executadas

- Arquivo: `supabase/migrations/2025-10-21-roles-active-role.sql`
  - `profiles.roles text[]`, `profiles.active_role text`, `profiles.tecnico_id uuid`.
  - Helpers de contexto (claims): `public.current_active_role()`, `public.current_tecnico_id()`, `public.current_empresa_id()`.
  - RLS ativado em `ordens_servico` com política de leitura baseada em `empresa_id` e `active_role`.
- Arquivo: `supabase/migrations/2025-10-21-os-ordering-view.sql`
  - View `public.ordens_servico_enriquecida` com colunas `peso_status` e `peso_prioridade` para ordenação custom.
- Arquivo: `supabase/migrations/2025-10-21-empresa-dual-approval.sql`
  - `empresas.require_dual_approval boolean default false` para suporte à dupla aprovação.
 - Arquivo: `supabase/migrations/2025-10-21-rls-more-tables.sql`
  - RLS adicional para `os_checklists`, `checklist_respostas` (técnico só enxerga o que executa) e `clientes` (por empresa).

## 2) Claims e Sessão

- Sessão/JWT deve conter: `roles[]`, `active_role`, `empresa_id`, `tecnico_id?`.
- API para alternar modo: `POST /api/session/active-role` atualiza `user_metadata.active_role` e cookie `active_role`.

## 3) Middlewares/Guards

- Middleware atual permanece mínimo. Quando rotas `/admin/*` e `/app/*` forem criadas, aplicar guards conforme brief.

## 4) UI e Helpers

- Helpers: `src/utils/auth.ts` — `getActiveRole`, `getRoles`, `isGestor`, `isTecnico`, `setActiveRoleClient`.
- Toggle UI: `src/components/role-switch.tsx` (Ctrl+G / Ctrl+T, toasts, cookie + user_metadata).
- Sidebar: `AppSidebar` oculta/mostra itens conforme papel ativo.

## 5) RLS — Padrão a replicar

- Aplicar mesmo padrão de `ordens_servico` a `os_checklists`, `checklist_respostas`, `orcamentos`, `clientes`, `contratos`, `sites`:
  - `empresa_id = current_empresa_id()`
  - Gestor: acesso amplo dentro da empresa.
  - Técnico: acesso apenas ao que estiver vinculado a `current_tecnico_id()`.

## 6) Ordenação de OS (negócio)

- View `ordens_servico_enriquecida` promove ordenação por pesos:
  - Status: `parado(0) < novo(1) < em_andamento(2) < aguardando_assinatura(3) < concluido(4) < cancelado(5)`
  - Prioridade: `alta(1) < media(2) < baixa(3)`

## 7) Autoaprovação

- Utilitário: `src/utils/approval.ts` para lidar com salvaguardas (assinatura, foto, log, dupla aprovação) em fluxos de aprovação.
