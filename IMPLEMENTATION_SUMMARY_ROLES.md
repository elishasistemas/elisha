# Implementation Summary — Roles & Active Mode

## Scope
- Multi-role users (gestor/tecnico), switchable active mode.
- RLS alignment for enterprise-bound and technician-bound access.
- UI gating and navigation adaptation by active mode.

## Code
- `src/utils/auth.ts`: role helpers + API caller.
- `src/components/role-switch.tsx`: UI toggle + hotkeys + toasts.
- `src/app/api/session/active-role/route.ts`: persist active role (cookie + user_metadata).
- `src/components/app-sidebar.tsx`: filters navigation in Campo.
- Gating (hide actions in Campo):
  - Checklists: `src/app/(protected)/checklists/page.tsx`
  - Clients: `src/app/(protected)/clients/page.tsx`
  - Technicians: `src/app/(protected)/technicians/page.tsx`
  - Orders: `src/app/(protected)/orders/page.tsx` (hide create/edit/delete for técnicos)

## DB
- `profiles.roles[]`, `profiles.active_role`, `profiles.tecnico_id`.
- View `ordens_servico_enriquecida` (`peso_status`, `peso_prioridade`).
- `empresas.require_dual_approval` para dupla aprovação.
- RLS extra: `os_checklists`, `checklist_respostas` (vinculadas à OS do técnico) e `clientes` (por empresa).
- Helpers: `current_active_role()`, `current_tecnico_id()`, `current_empresa_id()`.
- RLS: `ordens_servico` habilitado e com política de leitura por empresa + role ativo (exemplo a replicar).

## Server-side pagination + business ordering
- OS/Checklists/Equipamentos migrados para paginação no banco com `count: 'exact'`.
- Ordens com ordenação custom via view em presets `status`/`prioridade`.

## Next Steps
- Replicar RLS em `os_checklists`, `checklist_respostas`, `orcamentos`, `clientes`, `contratos`, `sites`.
- Guards: criar grupos `/admin/*` e `/app/*` e aplicar redirects no middleware.
- Auto-approval: integrar `src/utils/approval.ts` no fluxo de relatórios/assinatura quando disponível.
