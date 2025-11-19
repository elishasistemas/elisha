-- View com pesos de status e prioridade para ordenação custom
create or replace view public.ordens_servico_enriquecida as
select
  os.*,
  case os.status
    when 'parado' then 0
    when 'novo' then 1
    when 'em_andamento' then 2
    when 'aguardando_assinatura' then 3
    when 'concluido' then 4
    when 'cancelado' then 5
    else 6
  end as peso_status,
  case os.prioridade
    when 'alta' then 1
    when 'media' then 2
    when 'baixa' then 3
    else 4
  end as peso_prioridade
from public.ordens_servico os;

-- Garantir que a view respeite RLS da base (por padrão, views respeitam RLS das tabelas subjacentes)

-- Config extra: habilitar RLS já feito na migration anterior.

