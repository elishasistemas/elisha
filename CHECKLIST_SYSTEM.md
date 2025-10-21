# Sistema de Checklist - Elisha

Sistema completo de checklist para Ordens de Serviço (OS) com snapshot imutável e estrutura pronta para normas ABNT.

## 📋 Visão Geral

O sistema implementa um fluxo completo de checklist vinculado a ordens de serviço, com:
- **Snapshots imutáveis**: Template capturado no momento da vinculação à OS
- **Respostas incrementais**: Salvamento automático de cada item
- **Compliance Score**: Cálculo automático de conformidade
- **ABNT-ready**: Estrutura preparada para referências e regras ABNT
- **Multi-tenant**: Isolamento por empresa via RLS

## 🗄️ Estrutura do Banco

### Tabelas Criadas

#### 1. `checklists` (Templates)
Templates reutilizáveis de checklist.

```sql
- id: uuid
- empresa_id: uuid (FK empresas)
- nome: text
- tipo_servico: text (preventiva|corretiva|emergencial|chamado|todos)
- itens: jsonb[] -- Array de ChecklistItem
- versao: integer
- origem: text (abnt|custom|elisha)
- abnt_refs: text[]
- ativo: boolean
```

#### 2. `os_checklists` (Snapshots)
Snapshots imutáveis vinculados a uma OS.

```sql
- id: uuid
- os_id: uuid (FK ordens_servico) -- UNIQUE
- checklist_id: uuid (FK checklists, nullable)
- template_snapshot: jsonb -- Cópia imutável do template
- started_at: timestamptz
- completed_at: timestamptz (nullable)
- responsavel_id: uuid (FK colaboradores)
- empresa_id: uuid
```

#### 3. `checklist_respostas` (Responses)
Respostas dos itens do checklist.

```sql
- id: uuid
- os_checklist_id: uuid (FK os_checklists)
- os_id: uuid (FK ordens_servico)
- item_ordem: integer
- descricao: text
- status_item: text (pendente|conforme|nao_conforme|na)
- valor_boolean: boolean
- valor_text: text
- valor_number: numeric
- observacoes: text
- fotos_urls: text[]
- assinatura_url: text
- respondido_por: uuid (FK colaboradores)
- respondido_em: timestamptz
```

**Constraint**: `UNIQUE(os_checklist_id, item_ordem)`

## 🚀 Como Usar

### 1. Aplicar Migração

```bash
# Via Supabase CLI
supabase db push

# Ou executar o SQL diretamente
psql -f supabase/migrations/004_create_checklist_system.sql
```

### 2. Criar um Template de Checklist

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

const template = {
  empresa_id: 'uuid-da-empresa',
  nome: 'Manutenção Preventiva - Elevador',
  tipo_servico: 'preventiva',
  versao: 1,
  origem: 'custom',
  abnt_refs: ['NBR 16083'],
  ativo: true,
  itens: [
    {
      ordem: 1,
      secao: 'Segurança',
      descricao: 'Verificar desenergização do equipamento',
      tipo: 'boolean',
      obrigatorio: true,
      critico: true,
      abnt_refs: ['NBR 16083 - 5.2']
    },
    {
      ordem: 2,
      secao: 'Medições',
      descricao: 'Medir corrente do motor',
      tipo: 'leitura',
      obrigatorio: true,
      critico: false,
      unidade: 'A',
      intervalo_permitido: [0, 50]
    },
    {
      ordem: 3,
      secao: 'Documentação',
      descricao: 'Foto do painel elétrico',
      tipo: 'photo',
      obrigatorio: true,
      critico: false,
      evidencias: {
        fotos_min: 2
      }
    }
  ]
}

const { data, error } = await supabase
  .from('checklists')
  .insert(template)
```

### 3. Iniciar Checklist para uma OS

```typescript
// Via API Route
const response = await fetch(`/api/os/${osId}/start-checklist`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ checklistId: 'uuid-do-template' })
})

const snapshot = await response.json()
// { id, os_id, template_snapshot }
```

**Nota**: Esta operação é idempotente. Se já existe um snapshot para a OS, retorna o existente.

### 4. Renderizar Checklist na UI

```typescript
import { ChecklistRunner } from '@/components/checklist-runner'

function OSDetailPage({ osId }: { osId: string }) {
  return (
    <div>
      <h1>Ordem de Serviço</h1>
      <ChecklistRunner osId={osId} />
    </div>
  )
}
```

O componente `ChecklistRunner`:
- Carrega automaticamente o snapshot e respostas
- Renderiza itens agrupados por seção
- Suporta tipos: boolean, text, number, leitura, photo, signature
- Salva incrementalmente cada alteração
- Mostra score de conformidade em tempo real
- Exibe avisos e bloqueios para conclusão

### 5. Verificar Status do Checklist

```typescript
const response = await fetch(`/api/os/${osId}/checklist`)
const data = await response.json()

console.log('Score:', data.score)
// {
//   score: 85,
//   criticos_pendentes: 0,
//   pendencias: 2,
//   total: 15,
//   items_por_status: { ... }
// }

console.log('Validation:', data.validation)
// {
//   pode_concluir: true,
//   motivos_bloqueio: [],
//   avisos: ['Item obrigatório pendente: ...']
// }
```

## 📊 Score de Conformidade

O score é calculado com base em:

### Pesos por Tipo
- `boolean`: 1 ponto
- `text`: 1 ponto
- `number/leitura`: 2 pontos
- `photo/signature`: 2 pontos

### Peso Crítico
- Itens marcados como `critico: true` recebem **+2 pontos** de peso

### Cálculo
```
score = (peso_conforme / peso_total) * 100
```

Onde:
- `peso_conforme`: soma dos pesos dos itens conformes ou N/A
- `peso_total`: soma de todos os pesos

### Exemplo

```typescript
itens = [
  { tipo: 'boolean', critico: true },   // peso: 1 + 2 = 3
  { tipo: 'leitura', critico: false },  // peso: 2
  { tipo: 'text', critico: false }      // peso: 1
]
// peso_total = 6

respostas = [
  { status: 'conforme' },   // +3
  { status: 'conforme' },   // +2
  { status: 'pendente' }    // +0
]
// peso_conforme = 5

score = (5 / 6) * 100 = 83%
```

## 🚫 Bloqueios para Conclusão

A OS **não pode ser concluída** se houver:

1. **Itens críticos não conformes**
   ```typescript
   item.critico === true && status === 'nao_conforme'
   ```

2. **Itens críticos pendentes**
   ```typescript
   item.critico === true && status === 'pendente'
   ```

3. **Evidências obrigatórias faltando**
   ```typescript
   item.obrigatorio === true && 
   item.evidencias.fotos_min > fotos_urls.length
   ```

4. **Assinaturas obrigatórias faltando**
   ```typescript
   item.tipo === 'signature' && 
   item.obrigatorio === true && 
   !assinatura_url
   ```

## 📝 Tipos de Itens Suportados

### 1. Boolean (Sim/Não)
```json
{
  "tipo": "boolean",
  "descricao": "Equipamento desenergizado?"
}
```
**UI**: Dois botões (Sim/Não)

### 2. Text (Texto livre)
```json
{
  "tipo": "text",
  "descricao": "Observações gerais"
}
```
**UI**: Textarea

### 3. Number (Número)
```json
{
  "tipo": "number",
  "descricao": "Quantidade de falhas"
}
```
**UI**: Input numérico

### 4. Leitura (Medição)
```json
{
  "tipo": "leitura",
  "descricao": "Corrente do motor",
  "unidade": "A",
  "intervalo_permitido": [0, 50]
}
```
**UI**: Input numérico + unidade + intervalo de referência

### 5. Photo (Foto)
```json
{
  "tipo": "photo",
  "descricao": "Foto do painel",
  "evidencias": {
    "fotos_min": 2
  }
}
```
**UI**: Botão para upload de fotos

### 6. Signature (Assinatura)
```json
{
  "tipo": "signature",
  "descricao": "Assinatura do responsável",
  "obrigatorio": true
}
```
**UI**: Canvas para assinatura digital

## 🔐 Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:

- **SELECT**: Usuários veem apenas dados da sua empresa
- **INSERT**: Usuários criam apenas para sua empresa
- **UPDATE**: Usuários atualizam apenas dados da sua empresa
- **DELETE**: Apenas admins/gestores podem deletar

## 🎯 Roadmap v2 (ABNT Completo)

Para evolução futura, adicionar ao schema dos itens:

```typescript
{
  "regras": {
    "visivel_se": "tipo_servico === 'preventiva'",
    "alerta_se": "valor < 10 || valor > 40",
    "bloqueia_conclusao_se": "valor === false"
  }
}
```

Isso permitirá:
- Itens condicionais (visibilidade dinâmica)
- Alertas automáticos baseados em valores
- Regras de negócio complexas por item

## 📚 Arquivos Criados

### Migração
- `supabase/migrations/004_create_checklist_system.sql`

### Tipos
- `src/types/checklist.ts`

### Services
- `src/services/checklist/startChecklistForOS.ts`

### Utilitários
- `src/utils/checklist/computeComplianceScore.ts`

### API Routes
- `src/app/api/os/[osId]/start-checklist/route.ts` (POST)
- `src/app/api/os/[osId]/checklist/route.ts` (GET)
- `src/app/api/checklist/respostas/[respostaId]/route.ts` (PATCH)

### Componentes
- `src/components/checklist-runner.tsx`

## 🧪 Testes Rápidos

```sql
-- 1. Verificar tabelas criadas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%checklist%';

-- 2. Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('checklists', 'os_checklists', 'checklist_respostas');

-- 3. Contar policies
SELECT COUNT(*) FROM pg_policies 
WHERE tablename LIKE '%checklist%';

-- 4. Testar função current_empresa_id
SELECT current_empresa_id();
```

## 📞 Suporte

Para dúvidas ou issues, consulte a documentação do Supabase e Next.js.

---

**Versão**: 1.0.0  
**Última atualização**: Outubro 2025

