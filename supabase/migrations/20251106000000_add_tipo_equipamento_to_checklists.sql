-- Migration: Add tipo_equipamento to checklists table
-- Version: 1.0.0
-- Description: Adiciona campo tipo_equipamento para vincular templates de checklist ao tipo de equipamento

-- ============================================
-- 1. ADD tipo_equipamento COLUMN
-- ============================================

alter table public.checklists
  add column if not exists tipo_equipamento text;

-- Index for tipo_equipamento
create index if not exists idx_checklists_tipo_equipamento 
  on public.checklists(tipo_equipamento);

-- Index for empresa_id + tipo_equipamento + tipo_servico
create index if not exists idx_checklists_empresa_tipo_equipamento_servico 
  on public.checklists(empresa_id, tipo_equipamento, tipo_servico, ativo);

-- Comment
comment on column public.checklists.tipo_equipamento is 
  'Tipo de equipamento ao qual o template se aplica (ELEVADOR_ELETRICO, ELEVADOR_HIDRAULICO, PLATAFORMA_VERTICAL, etc.)';

-- ============================================
-- 2. CREATE RPC FOR UPSERT CHECKLIST TEMPLATES
-- ============================================

create or replace function public.upsert_checklist_templates_by_tipo(
  p_empresa_id uuid,
  p_templates jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  v_template jsonb;
  v_checklist_id uuid;
  v_itens jsonb;
  v_item jsonb;
  v_ordem integer := 1;
  v_ciclo text;
  v_frequencia text;
begin
  -- Validate empresa_id
  if not exists (select 1 from public.empresas where id = p_empresa_id) then
    raise exception 'Empresa não encontrada: %', p_empresa_id;
  end if;

  -- Loop through templates
  for v_template in select * from jsonb_array_elements(p_templates)
  loop
    -- Process each ciclo (mensal, trimestral, etc.)
    for v_ciclo, v_frequencia in 
      select key, value from jsonb_each(v_template->'ciclos')
    loop
      -- Build itens array from ciclos
      v_itens := '[]'::jsonb;
      v_ordem := 1;
      
      for v_item in 
        select * from jsonb_array_elements(v_frequencia->'itens')
      loop
        v_itens := v_itens || jsonb_build_object(
          'ordem', v_ordem,
          'secao', initcap(v_ciclo),
          'descricao', v_item->>0,
          'tipo', 'boolean',
          'obrigatorio', true,
          'critico', false,
          'abnt_refs', coalesce(v_template->'norma_base', '[]'::jsonb)
        );
        v_ordem := v_ordem + 1;
      end loop;

      -- Check if template already exists
      select id into v_checklist_id
      from public.checklists
      where empresa_id = p_empresa_id
        and nome = format('Preventiva - %s - %s', 
          coalesce(v_template->>'tipo_equipamento', 'Geral'),
          initcap(v_ciclo)
        )
        and tipo_servico = 'preventiva'
        and tipo_equipamento = v_template->>'tipo_equipamento'
      limit 1;

      if v_checklist_id is not null then
        -- Update existing template
        update public.checklists
        set
          itens = v_itens,
          abnt_refs = coalesce(v_template->'norma_base', '[]'::jsonb),
          versao = versao + 1,
          updated_at = now()
        where id = v_checklist_id;
      else
        -- Insert new template
        insert into public.checklists (
          empresa_id,
          nome,
          tipo_servico,
          tipo_equipamento,
          itens,
          versao,
          origem,
          abnt_refs,
          ativo
        ) values (
          p_empresa_id,
          format('Preventiva - %s - %s', 
            coalesce(v_template->>'tipo_equipamento', 'Geral'),
            initcap(v_ciclo)
          ),
          'preventiva',
          v_template->>'tipo_equipamento',
          v_itens,
          1,
          'elisha',
          coalesce(v_template->'norma_base', '[]'::jsonb),
          true
        )
        returning id into v_checklist_id;
      end if;

      -- Add to result
      v_result := v_result || jsonb_build_object(
        'tipo_equipamento', v_template->>'tipo_equipamento',
        'ciclo', v_ciclo,
        'checklist_id', v_checklist_id,
        'itens_count', jsonb_array_length(v_itens)
      );
    end loop;
  end loop;

  return v_result;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.upsert_checklist_templates_by_tipo(uuid, jsonb) 
  to authenticated;

-- Comment
comment on function public.upsert_checklist_templates_by_tipo(uuid, jsonb) is 
  'Upsert templates de checklist por tipo de equipamento. Recebe array de templates com estrutura: [{tipo_equipamento, norma_base[], ciclos: {frequencia: {itens: []}}}]';

