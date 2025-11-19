# Referência de UI - Service Orders (Figma Make)

**Data:** 2025-11-02  
**Origem:** docs/ServiceOrdersExport.md + docs/service-orders/  
**Status:** ✅ COMPLETA

---

## 📋 Objetivo

Documentar a estrutura e padrões de UI dos componentes de Service Orders (OS) para replicar a arquitetura e os padrões de interface no projeto.

---

## 🎯 Tipos de OS e suas Lógicas Únicas

### 1. OS Preventiva

**Características únicas:**
- ✅ Possui checklist obrigatório (único tipo com checklist)
- ✅ Campo de observações com evidências
- ❌ Não possui laudo técnico
- ❌ Não possui descrição do cliente
- 📅 Cronograma mensal gerenciado no backend (não visível na UI)

**Estrutura:**
1. Informações do cliente (header)
2. Checklist de atendimento
3. Observações + Evidências
4. Próximos passos: Estado do elevador + Nome/Assinatura do cliente + Checkout
5. Histórico do equipamento

### 2. OS Chamado

**Características únicas:**
- ❌ Não possui checklist
- ✅ Possui descrição do cliente + solicitante + telefone
- ✅ Possui laudo técnico completo (o que foi feito, observações, evidências)
- ✅ Estado do elevador obrigatório antes do checkout

**Estrutura:**
1. Informações do cliente (header)
2. Descrição do Cliente + Nome do Solicitante + Telefone
3. Laudo Técnico (o que foi feito, observações, evidências)
4. Próximos passos: Estado do elevador + Nome/Assinatura do cliente + Checkout
5. Histórico do equipamento

### 3. OS Corretiva

**Características únicas:**
- ❌ Não possui checklist
- ✅ Possui descrição do cliente + solicitante + telefone
- ✅ Possui laudo técnico completo (o que foi feito, observações, evidências)
- ✅ Estado do elevador obrigatório antes do checkout
- ⚠️ Estrutura idêntica ao Chamado, mas com lógica de negócio diferente

**Estrutura:**
1. Informações do cliente (header)
2. Descrição do Cliente + Nome do Solicitante + Telefone
3. Laudo Técnico (o que foi feito, observações, evidências)
4. Próximos passos: Estado do elevador + Nome/Assinatura do cliente + Checkout
5. Histórico do equipamento

---

## 🗂️ Estrutura de Arquivos

```
src/
├── components/
│   ├── service-orders/
│   │   ├── types.ts              # Types TypeScript compartilhados
│   │   ├── PreventiveOS.tsx      # Componente de OS Preventiva
│   │   ├── CallOS.tsx            # Componente de OS Chamado
│   │   ├── CorrectiveOS.tsx      # Componente de OS Corretiva
│   │   └── index.ts              # Barrel export
│   ├── EvidenceButtons.tsx       # Componente de botões de evidência
│   └── ui/                       # Componentes Shadcn/UI
```

---

## 🎨 Padrões de UI

### Design System

- **Cores:** Preto, cinza e branco (minimalista)
- **Layout:** Mobile-first com suporte desktop
- **Timeline:** Desktop usa timeline vertical centralizada (max-w-1000px)
- **Tabs:** Mobile usa sistema de tabs para navegação
- **Typography:** Definida em `styles/globals.css` (não usar classes Tailwind de font-size/weight)

### Componentes Shadcn/UI Utilizados

- `Button` - Botões de ação
- `Card` - Cards para seções
- `Badge` - Status e contadores
- `Textarea` - Campos de texto longo
- `Input` - Campos de texto curto
- `Select` - Dropdowns
- `Separator` - Divisores visuais
- `Tabs` - Navegação mobile

### Layout Responsivo

**Desktop (>= 768px):**
- Timeline vertical centralizada
- Cards lado a lado quando aplicável
- Max-width: 1000px

**Mobile (< 768px):**
- Sistema de tabs na parte superior
- Tabs labels:
  - **Preventiva**: Checklist, Observação, Concluir, Histórico
  - **Chamado/Corretiva**: Descrição, Laudo, Concluir, Histórico

**⚠️ IMPORTANTE:** No mobile, tabs devem usar o rótulo **'Concluir'** (não 'Próximo') onde houver navegação progressiva.

---

## 📐 Estrutura de Componentes

### Componente Base

Todos os componentes seguem esta estrutura:

```tsx
<div className="min-h-screen bg-white">
  {/* Header */}
  <header className="bg-white border-b border-gray-200">
    {/* Botão Voltar */}
    {/* Info da OS (Número, Tipo, Status) */}
    {/* Info do Cliente, Equipamento, Técnico */}
  </header>

  {/* Main Content */}
  <main className="px-4 py-8">
    <div className="max-w-[1000px] mx-auto">
      {/* Desktop: Timeline */}
      <div className="hidden md:block">
        {/* Steps com timeline vertical */}
      </div>

      {/* Mobile: Tabs */}
      <div className="md:hidden">
        <Tabs>
          {/* TabsContent para cada seção */}
        </Tabs>
      </div>
    </div>
  </main>
</div>
```

### Timeline Desktop

```tsx
<div className="relative">
  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
  
  <div className="space-y-6">
    {/* Step 1 */}
    <div className="relative flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm z-10">
          1
        </div>
      </div>
      <Card className="flex-1 p-6 border-gray-200">
        {/* Conteúdo do step */}
      </Card>
    </div>
  </div>
</div>
```

---

## 🔄 Estados do Elevador

Todos os tipos de OS possuem 3 estados possíveis antes do checkout:

1. **Funcionando normal** → Fecha a OS normalmente
2. **Funcionando, dependendo de corretiva** → Cria uma OS do tipo Corretiva Programada
3. **Parado** → Cria uma OS do tipo Urgência (Corretiva com status Parado)

**UI do Select:**
```tsx
<Select value={elevatorState} onValueChange={setElevatorState}>
  <SelectTrigger className="w-full bg-white">
    <SelectValue placeholder="Selecione o estado do elevador" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="funcionando">Funcionando normal</SelectItem>
    <SelectItem value="dependendo-corretiva">Funcionando, dependendo de corretiva</SelectItem>
    <SelectItem value="parado">Parado</SelectItem>
  </SelectContent>
</Select>
```

**Feedback Visual:**
- `funcionando` → Texto verde: "✓ No checkout a OS será fechada normalmente"
- `dependendo-corretiva` → Texto amarelo: "⚠️ Será criada uma OS do tipo Corretiva Programada"
- `parado` → Texto vermelho: "🚨 Será criada uma OS do tipo Urgência (Corretiva com status Parado)"

---

## 📝 Props dos Componentes

### PreventiveOS Props

```typescript
interface PreventiveOSProps {
  data: PreventiveOSData;              // Dados da OS
  history: HistoryEntry[];             // Histórico do equipamento
  onCheckout?: (                       // Callback do checkout
    elevatorState: ElevatorState,
    clientName: string
  ) => void;
  onChecklistChange?: (                // Callback de mudança no checklist
    items: ChecklistItem[]
  ) => void;
}
```

### CallOS Props

```typescript
interface CallOSProps {
  data: CallOSData;                    // Dados da OS
  history: HistoryEntry[];             // Histórico do equipamento
  onCheckout?: (                       // Callback do checkout
    elevatorState: ElevatorState,
    clientName: string
  ) => void;
}
```

### CorrectiveOS Props

```typescript
interface CorrectiveOSProps {
  data: CorrectiveOSData;              // Dados da OS
  history: HistoryEntry[];             // Histórico do equipamento
  onCheckout?: (                       // Callback do checkout
    elevatorState: ElevatorState,
    clientName: string
  ) => void;
}
```

---

## 🎯 Diferenças Chave Entre os Tipos

| Característica | Preventiva | Chamado | Corretiva |
|---------------|-----------|---------|-----------|
| Checklist | ✅ Sim | ❌ Não | ❌ Não |
| Descrição Cliente | ❌ Não | ✅ Sim | ✅ Sim |
| Laudo Técnico | ❌ Não | ✅ Sim | ✅ Sim |
| Solicitante/Telefone | ❌ Não | ✅ Sim | ✅ Sim |
| Estado Elevador | ✅ Sim | ✅ Sim | ✅ Sim |
| Assinatura Cliente | ✅ Sim | ✅ Sim | ✅ Sim |
| Evidências | ✅ Sim (em Observações) | ✅ Sim (em Laudo) | ✅ Sim (em Laudo) |

---

## 📦 Tipos TypeScript

### Tipos Base

```typescript
export type OSType = "preventiva" | "chamado" | "corretiva";

export type ElevatorState = "funcionando" | "dependendo-corretiva" | "parado" | null;

export type ChecklistStatus = "conforme" | "nao-conforme" | "na" | null;

export interface ChecklistItem {
  id: number;
  label: string;
  status: ChecklistStatus;
}

export interface HistoryEntry {
  date: string;
  time: string;
  technician: string;
  summary: string;
  details: string;
}
```

### Tipos de Dados por OS

```typescript
export interface OSBaseData {
  osNumber: string;
  clientName: string;
  equipment: string;
  technician: string;
  status: string;
}

export interface PreventiveOSData extends OSBaseData {
  type: "preventiva";
  checklist: ChecklistItem[];
  observations?: string;
}

export interface CallOSData extends OSBaseData {
  type: "chamado";
  clientDescription: string;
  requesterName: string;
  requesterPhone: string;
  technicalReport?: {
    workDone: string;
    observations: string;
  };
}

export interface CorrectiveOSData extends OSBaseData {
  type: "corretiva";
  clientDescription: string;
  requesterName: string;
  requesterPhone: string;
  technicalReport?: {
    workDone: string;
    observations: string;
  };
}
```

---

## 🚨 Observações Importantes

1. **Chamado vs Corretiva:** Apesar de terem a mesma estrutura de UI, são tipos diferentes com lógicas de negócio distintas no backend.

2. **Cronograma Mensal:** A OS Preventiva possui cronograma mensal, mas ele é gerenciado no backend e não aparece na UI.

3. **Cronômetro Removido:** A funcionalidade de cronômetro foi removida. O sistema agora guarda apenas os horários de transição de cada estado.

4. **Validação de Checkout:** O botão de checkout só é habilitado quando:
   - Estado do elevador está selecionado
   - Nome do cliente está preenchido

5. **Componente Isolado:** Cada tipo de OS é um componente completamente independente, facilitando manutenção e testes.

6. **Mobile Tabs:** Tabs mobile devem usar rótulo **'Concluir'** (não 'Próximo').

---

## ✅ Checklist de Implementação

- [x] Documento de referência criado
- [ ] Tipos TypeScript criados em `src/types/service-orders.ts`
- [ ] Componente `PreventiveOS` criado
- [ ] Componente `CallOS` criado
- [ ] Componente `CorrectiveOS` criado
- [ ] Componente `EvidenceButtons` criado
- [ ] Integração na página full-screen
- [ ] Testes de renderização por tipo

---

**Documento criado em:** 2025-11-02  
**Última atualização:** 2025-11-02
