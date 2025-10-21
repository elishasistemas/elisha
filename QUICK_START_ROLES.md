# Quick Start — Papéis e Modo Ativo

## Pré-requisitos
- Supabase configurado e migrações aplicadas:
  - `supabase/migrations/2025-10-21-roles-active-role.sql`
  - `supabase/migrations/2025-10-21-os-ordering-view.sql`
  - `supabase/migrations/2025-10-21-empresa-dual-approval.sql`
  - `supabase/migrations/2025-10-21-rls-more-tables.sql`

## Passo a passo
1) Atribua papéis ao usuário na tabela `profiles`:
   - `roles = {gestor, tecnico}` conforme necessário.
   - `active_role = 'gestor' | 'tecnico'` (opcional; o usuário pode alternar via UI).
   - `tecnico_id` quando aplicável.
2) Entre no app e use o **RoleSwitch** no topo para alternar Gestão ↔ Campo.
3) No modo Campo (técnico), a navegação foca nas OS; no modo Gestão, a navegação é completa.
4) RLS garante que o técnico veja apenas registros da empresa e OS atribuídas (políticas do banco).

## APIs úteis
- `POST /api/session/active-role` body `{ role: 'gestor'|'tecnico' }` — atualiza sessão/cookie.

## Helpers
- `getActiveRole(session, profile)`
- `getRoles(session, profile)`
- `isGestor(session, profile)` / `isTecnico(session, profile)`
- `setActiveRoleClient(role)`
