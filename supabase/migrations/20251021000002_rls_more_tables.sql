-- RLS adicionais seguindo padrão do brief

-- os_checklists
alter table if exists public.os_checklists enable row level security;
DROP POLICY IF EXISTS os_checklists_select ON public.os_checklists;
CREATE POLICY os_checklists_select
  ON public.os_checklists
  FOR SELECT
  USING (
    empresa_id = public.current_empresa_id()
    AND (
      public.current_active_role() = 'gestor'
      OR (
        public.current_active_role() = 'tecnico'
        AND EXISTS (
          SELECT 1 FROM public.ordens_servico os
          WHERE os.id = os_checklists.os_id
            AND os.tecnico_id = public.current_tecnico_id()
        )
      )
    )
  );

-- checklist_respostas
alter table if exists public.checklist_respostas enable row level security;
DROP POLICY IF EXISTS checklist_respostas_select ON public.checklist_respostas;
CREATE POLICY checklist_respostas_select
  ON public.checklist_respostas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.os_checklists oc
      JOIN public.ordens_servico os ON os.id = oc.os_id
      WHERE oc.id = checklist_respostas.os_checklist_id
        AND oc.empresa_id = public.current_empresa_id()
        AND (
          public.current_active_role() = 'gestor' OR (
            public.current_active_role() = 'tecnico' AND os.tecnico_id = public.current_tecnico_id()
          )
        )
    )
  );

-- clientes (acesso por empresa)
alter table if exists public.clientes enable row level security;
DROP POLICY IF EXISTS clientes_select ON public.clientes;
CREATE POLICY clientes_select
  ON public.clientes
  FOR SELECT
  USING (
    empresa_id = public.current_empresa_id()
  );

