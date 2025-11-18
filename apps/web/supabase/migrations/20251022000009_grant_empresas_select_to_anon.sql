-- Grant SELECT permission on empresas table to anon role
-- This is needed in addition to the RLS policy

GRANT SELECT ON public.empresas TO anon;

COMMENT ON TABLE public.empresas IS 
  'Tabela de empresas - leitura permitida para anônimos (signup page)';

