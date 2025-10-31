# Contexto Técnico: Sistema de Ordens de Serviço (OS)

**Data:** 24 de Outubro de 2025  
**Versão:** 1.0  
**Status:** Documento de Referência

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Fluxo de Status](#fluxo-de-status)
4. [RPCs e Edge Functions](#rpcs-e-edge-functions)
5. [APIs e Serviços](#apis-e-serviços)
6. [Páginas e Componentes](#páginas-e-componentes)
7. [Histórico e Auditoria](#histórico-e-auditoria)
8. [Migrations Aplicadas](#migrations-aplicadas)

---

## 🎯 Visão Geral

O sistema de Ordens de Serviço (OS) é o núcleo do Elisha, gerenciando todo o ciclo de vida de manutenções em equipamentos (elevadores). O sistema suporta:

- **4 tipos de serviço**: preventiva, corretiva, emergencial, chamado
- **6 estados de status**: novo, em_andamento, aguardando_assinatura, concluido, cancelado, parado
- **3 níveis de prioridade**: alta, media, baixa
- **Multi-tenancy** por empresa_id
- **Controle de acesso** baseado em roles (admin, tecnico, elisha_admin)
- **Numeração automática** de OS por empresa/ano

---

## 📊 Estrutura de Dados

### Tabela Principal: `ordens_servico`

```sql
CREATE TABLE public.ordens_servico (
  -- Identificação
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_os text UNIQUE,
  empresa_id uuid REFERENCES empresas(id),
  
  -- Relacionamentos
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  equipamento_id uuid NOT NULL REFERENCES equipamentos(id) ON DELETE CASCADE,
  tecnico_id uuid REFERENCES colaboradores(id) ON DELETE SET NULL,
  
  -- Classificação
  tipo os_tipo NOT NULL,  -- ENUM: preventiva, corretiva, emergencial, chamado
  prioridade os_prioridade DEFAULT 'media',  -- ENUM: alta, media, baixa
  status os_status DEFAULT 'novo',  -- ENUM: novo, em_andamento, aguardando_assinatura, concluido, cancelado, parado
  origem origem_canal DEFAULT 'painel',  -- ENUM: whatsapp, painel
  
  -- Datas
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_inicio timestamptz,
  data_fim timestamptz,
  data_programada date,  -- Para preventivas programadas
  
  -- Informações
  observacoes text,
  quem_solicitou text,  -- Nome de quem solicitou
  
  -- Auditoria
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT ordens_servico_datas_logicas CHECK (
    (data_inicio IS NULL OR data_inicio >= data_abertura) AND
    (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio)
  )
);
```

### Índices Criados

```sql
-- Performance indexes
CREATE INDEX ordens_servico_cliente_id_idx ON ordens_servico(cliente_id);
CREATE INDEX ordens_servico_equipamento_id_idx ON ordens_servico(equipamento_id);
CREATE INDEX ordens_servico_tecnico_id_idx ON ordens_servico(tecnico_id);
CREATE INDEX ordens_servico_empresa_id_idx ON ordens_servico(empresa_id);
CREATE INDEX ordens_servico_status_idx ON ordens_servico(status);
CREATE INDEX ordens_servico_tipo_idx ON ordens_servico(tipo);
CREATE INDEX ordens_servico_prioridade_idx ON ordens_servico(prioridade);
CREATE INDEX ordens_servico_created_at_idx ON ordens_servico(created_at DESC);
CREATE INDEX ordens_servico_numero_os_idx ON ordens_servico(numero_os);
CREATE INDEX ordens_servico_quem_solicitou_idx ON ordens_servico(quem_solicitou);
```

### Tabelas Relacionadas

#### 1. **os_checklists** (Snapshots Imutáveis)
```sql
CREATE TABLE os_checklists (
  id uuid PRIMARY KEY,
  os_id uuid NOT NULL REFERENCES ordens_servico(id),
  checklist_id uuid REFERENCES checklists(id),  -- Template original (pode ser null)
  template_snapshot jsonb NOT NULL,  -- Snapshot completo do template
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  responsavel_id uuid REFERENCES colaboradores(id),
  empresa_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 2. **checklist_respostas** (Respostas dos Itens)
```sql
CREATE TABLE checklist_respostas (
  id uuid PRIMARY KEY,
  os_id uuid NOT NULL REFERENCES ordens_servico(id),
  os_checklist_id uuid REFERENCES os_checklists(id),
  item_ordem integer NOT NULL,
  descricao text NOT NULL,
  status_item checklist_item_status DEFAULT 'pendente',  -- conforme, nao_conforme, pendente
  
  -- Valores flexíveis por tipo de campo
  valor_boolean boolean,
  valor_text text,
  valor_number numeric,
  observacoes text,
  
  -- Evidências
  fotos_urls text[] DEFAULT '{}',
  assinatura_url text,
  
  -- Auditoria
  respondido_por uuid REFERENCES colaboradores(id),
  respondido_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### 3. **relatorios_os** (Relatórios Finais)
```sql
CREATE TABLE relatorios_os (
  id uuid PRIMARY KEY,
  os_id uuid UNIQUE NOT NULL REFERENCES ordens_servico(id),
  assinatura_url text,
  relatorio_pdf_url text,
  pdf_gerado_em timestamptz,
  empresa_id uuid
);
```

#### 4. **feedbacks** (Avaliações)
```sql
CREATE TABLE feedbacks (
  id uuid PRIMARY KEY,
  os_id uuid UNIQUE NOT NULL REFERENCES ordens_servico(id),
  avaliacao feedback_tipo NOT NULL,  -- positivo, negativo
  comentario text,
  origem origem_canal DEFAULT 'whatsapp',
  created_at timestamptz DEFAULT now()
);
```

#### 5. **seq_os** (Controle de Numeração)
```sql
CREATE TABLE seq_os (
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  ano text NOT NULL,
  last_val integer DEFAULT 0,
  PRIMARY KEY (empresa_id, ano)
);
```

### View de Ordenação: `ordens_servico_enriquecida`

```sql
CREATE VIEW ordens_servico_enriquecida AS
SELECT 
  os.*,
  -- Peso para ordenação por status (menor = maior prioridade)
  CASE os.status
    WHEN 'parado' THEN 0
    WHEN 'novo' THEN 1
    WHEN 'em_andamento' THEN 2
    WHEN 'aguardando_assinatura' THEN 3
    WHEN 'concluido' THEN 4
    WHEN 'cancelado' THEN 5
    ELSE 6
  END AS peso_status,
  -- Peso para ordenação por prioridade
  CASE os.prioridade
    WHEN 'alta' THEN 1
    WHEN 'media' THEN 2
    WHEN 'baixa' THEN 3
    ELSE 4
  END AS peso_prioridade
FROM ordens_servico os;
```

---

## 🔄 Fluxo de Status

### Diagrama de Estados

```
┌─────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DA OS                      │
└─────────────────────────────────────────────────────────────┘

                           ┌──────┐
                           │ NOVO │ (status inicial)
                           └───┬──┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          ┌─────────┐   ┌──────────────┐   ┌────────────┐
          │ PARADO  │   │ EM_ANDAMENTO │   │ CANCELADO  │
          └─────────┘   └──────┬───────┘   └────────────┘
                │              │                   
                │              │                   
                │              ▼                   
                │      ┌──────────────────────┐   
                │      │ AGUARDANDO_ASSINATURA│   
                │      └──────────┬───────────┘   
                │                 │               
                │                 ▼               
                │           ┌───────────┐         
                └──────────▶│ CONCLUIDO │         
                            └───────────┘         
```

### Descrição dos Status

| Status | Descrição | Pode Editar? | Próximos Estados Permitidos |
|--------|-----------|--------------|----------------------------|
| **novo** | OS criada, aguardando atribuição | ✅ Admin | em_andamento, parado, cancelado |
| **em_andamento** | Técnico executando serviço | ✅ Admin/Técnico | aguardando_assinatura, parado, cancelado |
| **parado** | Equipamento parado/crítico | ✅ Admin | em_andamento, concluido |
| **aguardando_assinatura** | Aguardando aprovação final | ✅ Admin | concluido, em_andamento |
| **concluido** | OS finalizada com sucesso | ❌ (apenas visualização) | - |
| **cancelado** | OS cancelada | ❌ (apenas visualização) | - |

### Regras de Negócio

1. **Status "parado"** tem prioridade máxima em todas as ordenações
2. **Data de início** é automaticamente definida ao mudar para "em_andamento"
3. **Data de fim** é automaticamente definida ao mudar para "concluido"
4. **Checklist** deve estar completo antes de mudar para "aguardando_assinatura"
5. **Técnicos** só podem ver e editar suas próprias OS (exceto admins)

---

## 🔧 RPCs e Edge Functions

### Funções SQL (RPCs)

#### 1. **gen_numero_os()** - Trigger
```sql
-- Gera número sequencial automático no formato: OS-YYYY-NNNNNN
-- Executado BEFORE INSERT em ordens_servico
-- Usa tabela seq_os para controlar sequência por empresa/ano
```

**Formato**: `OS-2025-000001`, `OS-2025-000002`, etc.

#### 2. **set_os_empresa_id()** - Trigger
```sql
-- Define empresa_id automaticamente baseado no cliente_id
-- Executado BEFORE INSERT OR UPDATE OF cliente_id
-- Garante consistência de multi-tenancy
```

#### 3. **current_empresa_id()** - Helper RLS
```sql
-- Retorna empresa_id do usuário atual (considerando impersonation)
-- Usado nas políticas RLS para filtrar dados
```

#### 4. **current_active_role()** - Helper RLS
```sql
-- Retorna active_role do perfil do usuário atual
-- Usado para controle de permissões granular
```

#### 5. **current_tecnico_id()** - Helper RLS
```sql
-- Retorna tecnico_id vinculado ao usuário atual
-- Usado para filtrar OS do técnico específico
```

#### 6. **is_elisha_admin()** - Helper RLS
```sql
-- Verifica se usuário é super admin (Elisha Admin)
-- Super admins têm acesso total ao sistema
```

#### 7. **get_os_para_pdf(p_os_id uuid)** - RPC
```sql
-- Retorna dados completos da OS para geração de PDF
-- Usa view vw_os_para_pdf com LEFT JOINs
-- Inclui: cliente, técnico, equipamento, checklist, etc.
```

#### 8. **log_os_status_change()** - Trigger ⚡ **[Step 1]**
```sql
-- Registra automaticamente mudanças de status na tabela os_status_history
-- Executado AFTER INSERT OR UPDATE OF status em ordens_servico
-- Captura: status anterior, novo, usuário, timestamp
```

#### 9. **os_accept(p_os_id uuid)** - RPC ⚡ **[Step 1]**
```sql
-- Permite que técnico aceite uma OS disponível
-- Validações:
--   - Usuário autenticado e é técnico
--   - OS em status 'novo' ou 'parado'
--   - Técnico da mesma empresa
-- Ações:
--   - Atribui técnico à OS
--   - Muda status para 'em_andamento'
--   - Define data_inicio se null
--   - Registra no histórico com metadata
-- Retorna: jsonb com success/error/message/data
```

#### 10. **os_decline(p_os_id uuid, p_reason text)** - RPC ⚡ **[Step 1]**
```sql
-- Permite que técnico recuse uma OS
-- Validações:
--   - Usuário autenticado e é técnico
--   - OS em status 'novo' ou 'parado'
--   - Técnico da mesma empresa
-- Ações:
--   - Mantém status atual (não atribui técnico)
--   - Registra recusa no histórico com motivo
-- Retorna: jsonb com success/error/message
```

### Edge Functions (Deno)

#### 1. **gerar-relatorio-os**
- **Status**: ACTIVE (versão 17)
- **Path**: `/functions/gerar-relatorio-os`
- **Descrição**: Gera PDF do relatório final da OS
- **Tecnologia**: Deno + TypeScript
- **Trigger**: Chamada manual via API após conclusão da OS

---

## 🛠 APIs e Serviços

### REST APIs (Next.js Route Handlers)

#### 1. **/api/os/[osId]/checklist** (GET)
```typescript
// Retorna checklist snapshot e respostas
// Calcula score de conformidade
// Valida completude do checklist
```

**Response**:
```json
{
  "osChecklist": {
    "id": "uuid",
    "os_id": "uuid",
    "template_snapshot": { /* snapshot */ }
  },
  "respostas": [ /* array de respostas */ ],
  "score": {
    "total": 10,
    "conformes": 8,
    "naoConformes": 1,
    "pendentes": 1,
    "percentualConformidade": 80
  },
  "validation": {
    "isComplete": false,
    "missingItems": [9]
  }
}
```

#### 2. **/api/os/[osId]/start-checklist** (POST)
```typescript
// Inicia checklist para uma OS
// Cria snapshot imutável do template
// Pré-popula respostas como 'pendente'
```

**Body**:
```json
{
  "checklistId": "uuid"
}
```

#### 3. **/api/checklist/respostas/[respostaId]** (PATCH)
```typescript
// Atualiza resposta individual de checklist
// Suporta valores boolean, text, number
// Permite upload de fotos e assinaturas
```

### Serviços TypeScript

#### 1. **startChecklistForOS()**
**Path**: `src/services/checklist/startChecklistForOS.ts`

```typescript
export async function startChecklistForOS(
  params: { osId: string; checklistId: string },
  supabase: SupabaseClient
): Promise<StartChecklistResult>
```

**Características**:
- ✅ Idempotente (retorna existente se já criado)
- ✅ Cria snapshot imutável do template
- ✅ Pré-popula todas as respostas como 'pendente'
- ✅ Valida template ativo antes de criar

#### 2. **approveReport()**
**Path**: `src/services/reports/approve.ts`

```typescript
export async function approveReport(
  report: Report,
  session: Session | null,
  options: ApprovalOptions
)
```

**Fluxo de Aprovação**:
1. Verifica se é auto-aprovação (executor = aprovador)
2. Se auto-aprovação + dual approval habilitado → solicita outro admin
3. Se aprovação normal → aprova diretamente
4. Registra auditoria completa

---

## 🎨 Páginas e Componentes

### Páginas Principais

#### 1. **Dashboard** (`/dashboard`)
**Path**: `src/app/(protected)/dashboard/page.tsx`

**Funcionalidades**:
- ✅ 3 cards de indicadores: Chamados, Preventivas Hoje, Elevadores Parados
- ✅ Gráfico de chamados (últimos 7/15/30/60/90 dias)
- ✅ Tabela de OS recentes (últimas 10)
- ✅ Filtros de período e ordenação
- ✅ Botão de refresh para atualizar dados
- ✅ Clique na linha para visualizar OS

**Ordenação disponível**:
- Por prioridade (parado > alta > média > baixa)
- Por data (mais recente primeiro)
- Por status

#### 2. **Ordens de Serviço** (`/orders`)
**Path**: `src/app/(protected)/orders/page.tsx`

**Funcionalidades**:
- ✅ Lista completa de OS com paginação
- ✅ Busca por número, tipo, status
- ✅ Filtros por ordenação
- ✅ Ações: Visualizar, Editar, Excluir
- ✅ Criação de nova OS
- ✅ Seleção automática de equipamento ao escolher cliente

**Permissões**:
- Admin: pode criar, editar, excluir
- Técnico: visualiza apenas suas OS

#### 3. **Clientes** (`/clients`)
**Path**: `src/app/(protected)/clients/page.tsx`

**Funcionalidades**:
- CRUD completo de clientes
- Informações de contrato
- Campos de responsável
- Busca e paginação

#### 4. **Técnicos** (`/technicians`)
**Path**: `src/app/(protected)/technicians/page.tsx`

**Funcionalidades**:
- CRUD de colaboradores/técnicos
- Vinculação com usuário autenticado
- Status ativo/inativo
- WhatsApp para notificações

#### 5. **Dashboard Técnico** (`/tech-dashboard`) ⚡ **[Step 1]**
**Path**: `src/app/(protected)/tech-dashboard/page.tsx`

**Funcionalidades**:
- ✅ Lista "Minhas OS Abertas" (status: novo ou parado)
- ✅ Filtro automático por técnico logado
- ✅ 3 cards de estatísticas: Novas, Paradas, Total
- ✅ Botão "Aceitar" - Chama RPC os_accept()
- ✅ Botão "Recusar" - Abre dialog para motivo opcional
- ✅ Optimistic UI com feedback de sucesso/erro
- ✅ Atualização automática após ações
- ✅ Enriquecimento de dados (cliente, equipamento)

**Permissões**:
- Exclusivo para usuários com active_role = 'tecnico'
- Mostra apenas OS da mesma empresa
- Respeita RLS e tecnico_id do profile

### Componentes Principais

#### 1. **OrderDialog**
**Path**: `src/components/order-dialog.tsx`

**Modos**:
- `create`: Criar nova OS
- `edit`: Editar OS existente
- `view`: Visualizar OS (somente leitura)

**Características**:
- ✅ Accordion com persistência em localStorage
- ✅ Auto-seleção de equipamento ao escolher cliente
- ✅ Validação de campos obrigatórios
- ✅ Largura responsiva: 90vw em mobile, max 1000px em desktop
- ✅ Scroll interno quando conteúdo é grande

**Seções**:
1. Cliente & Equipamento
2. Detalhes da OS (tipo, prioridade, status)
3. Técnico & Datas
4. Observações

#### 2. **ClientDialog**
**Path**: `src/components/client-dialog.tsx`

**Campos**:
- Informações básicas (nome, CNPJ, endereço)
- Responsável (nome, telefone, email)
- Contrato (datas, valor mensal, número ART)

#### 3. **TechnicianDialog**
**Path**: `src/components/technician-dialog.tsx`

**Campos**:
- Nome, função, telefone
- WhatsApp (obrigatório)
- Vínculo com user_id (para login)

---

## 📝 Histórico e Auditoria

### Campos de Auditoria

Todas as tabelas principais possuem:
- `created_at`: Data/hora de criação (automático)
- `updated_at`: Data/hora da última atualização (trigger automático)

### Triggers de Auditoria

#### 1. **set_updated_at()** - Todas as tabelas
```sql
-- Atualiza updated_at automaticamente em UPDATE
-- Executado em: profiles, clientes, equipamentos, colaboradores, ordens_servico
```

### Histórico de Alterações de Status

**Atualmente não implementado**, mas pode ser adicionado com:

1. Tabela `os_status_history`:
```sql
CREATE TABLE os_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id),
  status_anterior os_status,
  status_novo os_status NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamptz DEFAULT now(),
  observacao text
);
```

2. Trigger para registrar mudanças:
```sql
CREATE TRIGGER trg_os_status_change
  AFTER UPDATE OF status ON ordens_servico
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_os_status_change();
```

### Logs de Acesso (Impersonation)

Tabela: `impersonation_logs`
```sql
CREATE TABLE impersonation_logs (
  id uuid PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  actions_taken jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
```

---

## 🗄 Migrations Aplicadas

### Ordem Cronológica

1. **001_create_invites_system.sql** - Sistema de convites
2. **002_create_core_tables.sql** - Tabelas principais (empresas, profiles, clientes, equipamentos, colaboradores, **ordens_servico**)
3. **003_create_rls_policies.sql** - Políticas RLS iniciais
4. **004_create_checklist_system.sql** - Sistema de checklists
5. **2025-10-21-empresa-dual-approval.sql** - Aprovação dupla
6. **2025-10-21-os-ordering-view.sql** - View de ordenação (`ordens_servico_enriquecida`)
7. **2025-10-21-rls-more-tables.sql** - RLS adicional
8. **2025-10-21-roles-active-role.sql** - Sistema de roles e active_role
9. **2025-10-22-add-user-id-to-profiles.sql** - user_id em profiles
10. **2025-10-22-fix-active-role-constraint.sql** - Correção de constraints
11. **2025-10-22-fix-empresas-select-for-anon.sql** - Acesso anônimo a empresas
12. **Multiple invite fixes** (2025-10-22) - Correções no sistema de convites
13. **2025-10-22-remove-gestor-role.sql** - Remoção do role "gestor"
14. **2025-10-24-add-client-contract-and-equipment-fields.sql** - Campos de contrato em clientes
15. **2025-10-24-add-quem-solicitou-to-ordens-servico.sql** - Campo `quem_solicitou`
16. **2025-10-24-fix-all-rls-policies-active-role.sql** - RLS usando active_role
17. **2025-10-24-fix-profiles-roles-active-role.sql** - Garantir roles e active_role
18. **998_add_user_id_to_colaboradores.sql** - user_id em colaboradores
19. **999_fix_accept_invite_create_colaborador.sql** - Correção de aceite de convite
20. **create_os_status_history_and_accept_decline_rpcs.sql** - ⚡ **[Step 1]** Histórico de status + RPCs aceitar/recusar

### Campos Adicionados ao Longo do Tempo

**ordens_servico**:
- ✅ `data_programada` (date) - Para preventivas programadas
- ✅ `quem_solicitou` (text) - Nome de quem solicitou
- ✅ `empresa_id` (uuid) - Multi-tenancy

**clientes**:
- ✅ `valor_mensal_contrato` (numeric) - Valor do contrato
- ✅ `numero_art` (text) - Número da ART

**equipamentos**:
- ✅ `nome` (text) - Nome identificador
- ✅ `pavimentos` (text) - Pavimentos atendidos
- ✅ `capacidade` (text) - Capacidade do equipamento

**colaboradores**:
- ✅ `user_id` (uuid) - Vínculo com auth.users

---

## 🔐 Segurança e RLS

### Políticas RLS Ativas

#### ordens_servico

1. **os_select** (PUBLIC)
```sql
-- Elisha Admin: vê tudo
-- Admin: vê todas da empresa
-- Técnico: vê apenas suas OS (tecnico_id = current_tecnico_id())
```

2. **os_select_authenticated** (AUTHENTICATED)
```sql
-- Filtro geral por empresa_id = current_empresa_id()
```

3. **os_insert_authenticated** (AUTHENTICATED)
```sql
-- Admins e técnicos podem criar
-- Deve pertencer à empresa do usuário
```

4. **os_update_authenticated** (AUTHENTICATED)
```sql
-- Admins e técnicos podem atualizar
-- Deve pertencer à empresa do usuário
```

5. **os_delete_authenticated** (AUTHENTICATED)
```sql
-- Apenas admins podem deletar
-- Deve pertencer à empresa do usuário
```

### Funções Helper RLS

```sql
-- Obtém empresa ativa (considera impersonation)
current_empresa_id() → uuid

-- Obtém role ativo do usuário
current_active_role() → text

-- Obtém ID do técnico vinculado
current_tecnico_id() → uuid

-- Verifica se é super admin
is_elisha_admin() → boolean
```

---

## 📊 Hooks React (Frontend)

### useOrdensServico()
**Path**: `src/hooks/use-supabase.ts`

```typescript
useOrdensServico(
  empresaId?: string,
  opts?: {
    page?: number
    pageSize?: number
    search?: string
    orderBy?: 'created_at' | 'status' | 'prioridade'
    ascending?: boolean
    tecnicoId?: string
    refreshKey?: number
  }
)
```

**Features**:
- ✅ Paginação server-side
- ✅ Busca por número_os, tipo, status
- ✅ Ordenação customizada usando view `ordens_servico_enriquecida`
- ✅ Filtro automático por técnico (se role = tecnico)
- ✅ Refresh manual via `refreshKey`
- ✅ Retorna: ordens, loading, error, count, createOrdem, updateOrdem, deleteOrdem

**Ordenação Especial**:
- **Por prioridade**: peso_status ASC → peso_prioridade ASC → created_at DESC
- **Por status**: peso_status ASC → created_at DESC
- **Por data**: created_at DESC

---

## 🎯 Casos de Uso Principais

### 1. Criar OS (Admin)
```typescript
1. Usuário abre dialog de criação
2. Seleciona cliente → equipamentos carregados automaticamente
3. Seleciona equipamento (ou primeiro é auto-selecionado)
4. Preenche tipo, prioridade, técnico, observações
5. Salva → trigger gen_numero_os() gera número automático
6. Trigger set_os_empresa_id() define empresa_id
7. OS criada com status 'novo'
```

### 2. Iniciar Checklist (Técnico/Admin)
```typescript
1. Na visualização da OS, clica "Iniciar Checklist"
2. Seleciona template de checklist
3. Sistema chama startChecklistForOS()
4. Cria snapshot imutável em os_checklists
5. Pré-popula respostas em checklist_respostas
6. Técnico pode começar a preencher
```

### 3. Executar Checklist (Técnico)
```typescript
1. Técnico acessa OS e abre checklist
2. Para cada item:
   - Marca conforme/não conforme
   - Adiciona observações
   - Tira fotos (upload para Storage)
3. Ao finalizar todos os itens:
   - Sistema valida completude
   - Habilita mudança para "aguardando_assinatura"
```

### 4. Finalizar OS (Admin)
```typescript
1. Admin revisa checklist completo
2. Muda status para "aguardando_assinatura"
3. Coleta assinatura do cliente (canvas/touch)
4. Muda status para "concluido"
5. Sistema:
   - Define data_fim = now()
   - Chama Edge Function para gerar PDF
   - Armazena PDF em relatorios_os
   - Envia notificação (futuro)
```

### 5. OS Parada (Crítico)
```typescript
1. Durante manutenção, técnico identifica problema crítico
2. Muda status para "parado"
3. OS aparece no topo de todas as listas (peso_status = 0)
4. Dashboard mostra em card "Elevadores Parados"
5. Gestor recebe alerta (futuro)
6. Ao resolver, muda para "em_andamento" ou direto "concluido"
```

---

## 📚 Referências Externas

- **Supabase Docs**: https://supabase.com/docs
- **Next.js 15**: https://nextjs.org/docs
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 🚀 Próximos Passos Sugeridos

1. **Histórico de Status**
   - Implementar tabela `os_status_history`
   - Trigger automático em mudanças
   - UI para visualizar timeline

2. **Notificações**
   - Push notifications para técnicos
   - Email para gestores em OS paradas
   - WhatsApp via API (já tem campo whatsapp_numero)

3. **Métricas Avançadas**
   - Tempo médio de resolução por tipo
   - Taxa de conformidade por técnico
   - SLA tracking (já tem campo em contratos)

4. **Dashboard Técnico**
   - View específica para técnicos
   - Mapa de OS do dia
   - Checklist inline

5. **Relatórios**
   - Relatório mensal por cliente
   - Análise de não conformidades
   - Indicadores de performance

---

## ✅ Checklist de Validação

Ao fazer alterações no sistema de OS, validar:

- [ ] Políticas RLS permitem/bloqueiam corretamente
- [ ] Triggers estão funcionando (numero_os, empresa_id, updated_at)
- [ ] Constraints de datas estão sendo respeitadas
- [ ] Frontend reflete mudanças de status em tempo real
- [ ] Checklist snapshot é imutável
- [ ] Multi-tenancy está garantido (empresa_id)
- [ ] Técnicos só veem suas OS
- [ ] Admins veem todas da empresa
- [ ] Elisha Admin vê tudo (com impersonation)

---

## 🚀 Fluxo Técnico Implementado

### ⚡ Step 1: Dashboard do Técnico + Aceitar/Recusar (Implementado)

**Data**: 24/10/2025  
**Status**: ✅ Completo

**Implementações**:

1. **Tabela `os_status_history`**
   - Histórico completo de mudanças de status
   - Captura: status anterior/novo, usuário, timestamp, motivo, metadata
   - RLS ativa com policies por empresa
   - Trigger automático em INSERT/UPDATE de status

2. **RPC `os_accept(p_os_id uuid)`**
   - Validação de permissões (técnico da mesma empresa)
   - Atribuição automática do técnico à OS
   - Mudança de status: novo/parado → em_andamento
   - Define data_inicio automaticamente
   - Registro no histórico com metadata

3. **RPC `os_decline(p_os_id uuid, p_reason text)`**
   - Validação de permissões
   - Mantém OS disponível (não atribui técnico)
   - Registra motivo da recusa no histórico
   - Permite gestão de disponibilidade

4. **Página `/tech-dashboard`**
   - Dashboard exclusivo para técnicos
   - Lista OS abertas (novo/parado) sem técnico atribuído
   - Cards de estatísticas (Novas, Paradas, Total)
   - Botões Aceitar/Recusar com feedback imediato
   - Dialog para motivo de recusa (opcional)
   - Auto-refresh após ações
   - Enriquecimento de dados (cliente, equipamento)
   - **Bug Fix (24/10/25)**: Loop infinito corrigido usando `useMemo` para memoizar array filtrado

**Migration Aplicada**:
- ✅ **2025-10-27**: Migration completa aplicada via MCP
  - Colunas `empresa_id` e `action_type` adicionadas à tabela `os_status_history`
  - RPCs `os_accept` e `os_decline` criados e testados
  - Trigger `log_os_status_change` configurado para INSERT e UPDATE
  - Políticas RLS aplicadas (SELECT, INSERT permitidos; UPDATE/DELETE bloqueados)
  - Grants de permissão configurados para `authenticated`

**Status de Funcionalidade**:
- ✅ Dashboard `/tech-dashboard` funcional e integrado
- ✅ Botões Aceitar/Recusar chamam os RPCs corretamente
- ✅ Histórico de status sendo registrado automaticamente
- ✅ Validações de permissão e empresa funcionando
- ✅ Multi-tenancy e impersonation respeitados

**Próximos Passos** (Tarefas 2-8 do plan.yaml):
- ⏭️ **Step 2**: Tela full-screen + cronômetro de deslocamento
- ⏭️ **Step 3**: Check-in com timestamp e localização
- ⏭️ **Step 4**: Checklist + Laudo + Evidências
- ⏭️ **Step 5**: Checkout com estado do equipamento
- ⏭️ **Step 6**: Timeline/Relatório com duração entre estados
- ⏭️ **Step 7**: Reabertura de OS
- ⏭️ **Step 8**: Validação E2E + SLA summary

---

**Documento mantido por**: Elisha Team  
**Última atualização**: 27/10/2025  
**Próxima revisão**: Após conclusão da Step 2

