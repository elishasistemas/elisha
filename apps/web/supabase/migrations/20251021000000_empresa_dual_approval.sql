-- Campo opcional para exigir dupla aprovação em empresas
alter table public.empresas
  add column if not exists require_dual_approval boolean not null default false;

