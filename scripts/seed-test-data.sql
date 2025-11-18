-- ============================================
-- SEED DE DADOS DE TESTE - BRANCH DEV
-- ============================================
-- Este script cria:
-- - 1 Empresa (Tech Elevadores)
-- - 1 Admin (Maria Silva)
-- - 2 Técnicos (João Santos, Pedro Costa)
-- - 3 Clientes com equipamentos
-- - Algumas ordens de serviço
-- ============================================

-- ============================================
-- 1. CRIAR EMPRESA
-- ============================================

INSERT INTO public.empresas (id, nome, cnpj, telefone, email, ativo, logo_url)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Tech Elevadores LTDA',
  '12.345.678/0001-90',
  '(11) 98765-4321',
  'contato@techelevadores.com.br',
  true,
  null
);

-- ============================================
-- 2. CRIAR USUÁRIOS NO AUTH (via SQL)
-- ============================================
-- IMPORTANTE: Em produção, use o Dashboard ou API do Supabase
-- Aqui estamos simulando. Você precisará criar via Dashboard.

-- Para criar os usuários, acesse:
-- https://supabase.com/dashboard/project/ecvjgixhcfmkdfbnueqh/auth/users
-- E crie manualmente:

-- Admin: maria.silva@techelevadores.com.br / Senha: Admin@123
-- Técnico 1: joao.santos@techelevadores.com.br / Senha: Tech@123
-- Técnico 2: pedro.costa@techelevadores.com.br / Senha: Tech@123

-- Após criar, copie os UUIDs e substitua abaixo:
-- UUID Admin: [SUBSTITUIR_UUID_ADMIN]
-- UUID Técnico 1: [SUBSTITUIR_UUID_TECNICO1]
-- UUID Técnico 2: [SUBSTITUIR_UUID_TECNICO2]

-- ============================================
-- 3. CRIAR COLABORADORES (TÉCNICOS)
-- ============================================

INSERT INTO public.colaboradores (id, empresa_id, nome, funcao, telefone, whatsapp_numero, ativo)
VALUES 
  (
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'João Santos',
    'Técnico de Manutenção',
    '(11) 91234-5678',
    '5511912345678',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Pedro Costa',
    'Técnico de Instalação',
    '(11) 93456-7890',
    '5511934567890',
    true
  );

-- ============================================
-- 4. CRIAR PROFILES
-- ============================================

-- Admin
-- ATENÇÃO: Substitua [SUBSTITUIR_UUID_ADMIN] pelo UUID real
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, is_elisha_admin)
VALUES (
  '[SUBSTITUIR_UUID_ADMIN]',
  '00000000-0000-0000-0000-000000000001',
  'Maria Silva',
  'admin',
  'admin',
  ARRAY['admin']::text[],
  false
);

-- Técnico 1 - João Santos
-- ATENÇÃO: Substitua [SUBSTITUIR_UUID_TECNICO1] pelo UUID real
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, tecnico_id)
VALUES (
  '[SUBSTITUIR_UUID_TECNICO1]',
  '00000000-0000-0000-0000-000000000001',
  'João Santos',
  'tecnico',
  'tecnico',
  ARRAY['tecnico']::text[],
  '00000000-0000-0000-0000-000000000101'
);

-- Técnico 2 - Pedro Costa
-- ATENÇÃO: Substitua [SUBSTITUIR_UUID_TECNICO2] pelo UUID real
INSERT INTO public.profiles (user_id, empresa_id, nome, role, active_role, roles, tecnico_id)
VALUES (
  '[SUBSTITUIR_UUID_TECNICO2]',
  '00000000-0000-0000-0000-000000000001',
  'Pedro Costa',
  'tecnico',
  'tecnico',
  ARRAY['tecnico']::text[],
  '00000000-0000-0000-0000-000000000102'
);

-- ============================================
-- 5. CRIAR CLIENTES
-- ============================================

INSERT INTO public.clientes (id, empresa_id, nome_local, cnpj, endereco_completo, responsavel_nome, responsavel_telefone, responsavel_email, data_inicio_contrato, data_fim_contrato, status_contrato, valor_mensal_contrato)
VALUES 
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Shopping Center Norte',
    '98.765.432/0001-10',
    'Av. Otto Baumgart, 500 - Vila Guilherme, São Paulo - SP',
    'Carlos Mendes',
    '(11) 3456-7890',
    'carlos.mendes@shoppingnorte.com.br',
    '2024-01-01',
    '2025-12-31',
    'ativo',
    4500.00
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'Edifício Empresarial Paulista',
    '87.654.321/0001-20',
    'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    'Ana Paula Rodrigues',
    '(11) 3987-6543',
    'ana.rodrigues@edificiopaulista.com.br',
    '2024-03-15',
    '2026-03-14',
    'ativo',
    3200.00
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Condomínio Residencial Jardins',
    '76.543.210/0001-30',
    'Rua dos Jardins, 234 - Jardim Europa, São Paulo - SP',
    'Roberto Almeida',
    '(11) 2345-6789',
    'sindico@condjardins.com.br',
    '2023-06-01',
    '2025-05-31',
    'ativo',
    2800.00
  );

-- ============================================
-- 6. CRIAR EQUIPAMENTOS
-- ============================================

-- Shopping Center Norte
INSERT INTO public.equipamentos (id, cliente_id, empresa_id, tipo, fabricante, modelo, numero_serie, ano_instalacao, nome, pavimentos, capacidade, ativo)
VALUES 
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Elevador de Passageiros',
    'Atlas Schindler',
    'Smart MRL',
    'AS-2024-001',
    2020,
    'Elevador Social - Torre A',
    'Térreo, 1º ao 5º andar',
    '8 pessoas / 600kg',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000001',
    'Elevador de Serviço',
    'ThyssenKrupp',
    'Evolution',
    'TK-2024-002',
    2020,
    'Elevador de Carga - Torre B',
    'Subsolo, Térreo ao 5º andar',
    '1500kg',
    true
  );

-- Edifício Empresarial Paulista
INSERT INTO public.equipamentos (id, cliente_id, empresa_id, tipo, fabricante, modelo, numero_serie, ano_instalacao, nome, pavimentos, capacidade, ativo)
VALUES 
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'Elevador de Passageiros',
    'Otis',
    'Gen2',
    'OT-2024-003',
    2019,
    'Elevador Principal',
    'Subsolo 2, Térreo ao 15º andar',
    '10 pessoas / 800kg',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000001',
    'Elevador Panorâmico',
    'Otis',
    'Skyway',
    'OT-2024-004',
    2019,
    'Elevador Panorâmico',
    'Térreo ao 15º andar',
    '6 pessoas / 450kg',
    true
  );

-- Condomínio Residencial Jardins
INSERT INTO public.equipamentos (id, cliente_id, empresa_id, tipo, fabricante, modelo, numero_serie, ano_instalacao, nome, pavimentos, capacidade, ativo)
VALUES 
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000001',
    'Elevador de Passageiros',
    'Atlas Schindler',
    '3300',
    'AS-2024-005',
    2015,
    'Elevador Social',
    'Térreo ao 8º andar',
    '6 pessoas / 450kg',
    true
  );

-- ============================================
-- 7. CRIAR ALGUMAS ORDENS DE SERVIÇO
-- ============================================

-- OS #1 - Preventiva programada (Shopping)
INSERT INTO public.ordens_servico (
  id, 
  cliente_id, 
  equipamento_id, 
  tecnico_id,
  empresa_id,
  tipo, 
  prioridade, 
  status, 
  data_abertura,
  data_programada,
  observacoes,
  origem,
  quem_solicitou
)
VALUES (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'preventiva',
  'media',
  'novo',
  NOW(),
  CURRENT_DATE + INTERVAL '3 days',
  'Manutenção preventiva mensal - Verificar sistema de segurança',
  'painel',
  'Maria Silva'
);

-- OS #2 - Corretiva urgente (Edifício)
INSERT INTO public.ordens_servico (
  id, 
  cliente_id, 
  equipamento_id, 
  tecnico_id,
  empresa_id,
  tipo, 
  prioridade, 
  status, 
  data_abertura,
  observacoes,
  origem,
  quem_solicitou
)
VALUES (
  '00000000-0000-0000-0000-000000000402',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000303',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000001',
  'corretiva',
  'alta',
  'em_andamento',
  NOW() - INTERVAL '2 hours',
  'Elevador travou no 10º andar. Resgatar passageiros e verificar falha.',
  'whatsapp',
  'Ana Paula Rodrigues'
);

-- OS #3 - Preventiva concluída (Condomínio)
INSERT INTO public.ordens_servico (
  id, 
  cliente_id, 
  equipamento_id, 
  tecnico_id,
  empresa_id,
  tipo, 
  prioridade, 
  status, 
  data_abertura,
  data_inicio,
  data_fim,
  observacoes,
  origem,
  quem_solicitou
)
VALUES (
  '00000000-0000-0000-0000-000000000403',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000305',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'preventiva',
  'media',
  'concluido',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
  NOW() - INTERVAL '5 days' + INTERVAL '4 hours',
  'Manutenção preventiva realizada com sucesso. Trocado óleo da máquina.',
  'painel',
  'Roberto Almeida'
);

-- ============================================
-- 8. CRIAR CONTRATO
-- ============================================

INSERT INTO public.contratos (empresa_id, cliente_id, inicio, fim, sla_mins)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000201',
    '2024-01-01',
    '2025-12-31',
    240  -- 4 horas de SLA
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000202',
    '2024-03-15',
    '2026-03-14',
    180  -- 3 horas de SLA
  );

-- ============================================
-- ✅ VERIFICAÇÃO
-- ============================================

-- Contar registros criados
SELECT 
  'Empresas' as tipo, COUNT(*) as total FROM public.empresas WHERE id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Colaboradores', COUNT(*) FROM public.colaboradores WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Clientes', COUNT(*) FROM public.clientes WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Equipamentos', COUNT(*) FROM public.equipamentos WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Ordens de Serviço', COUNT(*) FROM public.ordens_servico WHERE empresa_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 'Contratos', COUNT(*) FROM public.contratos WHERE empresa_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- 🎉 PRONTO!
-- ============================================
-- Dados de teste criados com sucesso!
-- 
-- PRÓXIMO PASSO:
-- 1. Criar os 3 usuários no Auth Dashboard
-- 2. Copiar os UUIDs
-- 3. Substituir [SUBSTITUIR_UUID_*] neste script
-- 4. Executar novamente a seção de PROFILES
-- ============================================

