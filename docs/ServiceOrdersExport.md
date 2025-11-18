# Service Orders - Guia de Exportação para Cursor

Este documento explica a estrutura dos componentes de Service Order (OS) e como integrá-los no seu projeto.

## 📁 Estrutura de Arquivos

```
components/
├── service-orders/
│   ├── types.ts              # Types TypeScript compartilhados
│   ├── PreventiveOS.tsx      # Componente de OS Preventiva
│   ├── CallOS.tsx            # Componente de OS Chamado
│   ├── CorrectiveOS.tsx      # Componente de OS Corretiva
│   └── index.ts              # Barrel export
├── EvidenceButtons.tsx       # Componente de botões de evidência
└── ui/                       # Componentes Shadcn/UI
```

## 🎯 Tipos de OS e suas Lógicas Únicas

### 1. OS Preventiva (`PreventiveOS.tsx`)

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

### 2. OS Chamado (`CallOS.tsx`)

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

### 3. OS Corretiva (`CorrectiveOS.tsx`)

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

## 🔄 Estados do Elevador

Todos os tipos de OS possuem 3 estados possíveis antes do checkout:

1. **Funcionando normal** → Fecha a OS normalmente
2. **Funcionando, dependendo de corretiva** → Cria uma OS do tipo Corretiva Programada
3. **Parado** → Cria uma OS do tipo Urgência (Corretiva com status Parado)

## 📦 Como Usar

### Importação Básica

```tsx
import { PreventiveOS, CallOS, CorrectiveOS } from './components/service-orders';
import type { PreventiveOSData, CallOSData, CorrectiveOSData, HistoryEntry } from './components/service-orders';
```

### Exemplo de Uso - OS Preventiva

```tsx
import { PreventiveOS } from './components/service-orders';

const mockPreventiveData = {
  type: "preventiva" as const,
  osNumber: "OS-2025-000041",
  clientName: "Edifício Comercial Alpha",
  equipment: "Elevador Social - Andar 1 ao 15",
  technician: "Eduardo Silva",
  status: "Em Andamento",
  checklist: [
    {
      id: 1,
      label: "Verificar condições de segurança do local",
      status: "conforme",
    },
    {
      id: 2,
      label: "Conferir identificação do equipamento",
      status: null,
    },
    // ... mais itens
  ],
  observations: "Observações iniciais...",
};

const mockHistory = [
  {
    date: "25/10/2025",
    time: "14:30",
    technician: "Eduardo",
    summary: "Manutenção preventiva realizada",
    details: "Lubrificação das engrenagens...",
  },
];

function App() {
  const handleCheckout = (elevatorState, clientName) => {
    console.log('Checkout:', { elevatorState, clientName });
    // Lógica de checkout aqui
  };

  const handleChecklistChange = (items) => {
    console.log('Checklist atualizado:', items);
    // Salvar no backend
  };

  return (
    <PreventiveOS
      data={mockPreventiveData}
      history={mockHistory}
      onCheckout={handleCheckout}
      onChecklistChange={handleChecklistChange}
    />
  );
}
```

### Exemplo de Uso - OS Chamado

```tsx
import { CallOS } from './components/service-orders';

const mockCallData = {
  type: "chamado" as const,
  osNumber: "OS-2025-000042",
  clientName: "Edifício Comercial Alpha",
  equipment: "Elevador Social - Andar 1 ao 15",
  technician: "Eduardo Silva",
  status: "Em Andamento",
  clientDescription: "Elevador está fazendo um ruído estranho ao descer...",
  requesterName: "Maria Santos",
  requesterPhone: "(11) 98765-4321",
  technicalReport: {
    workDone: "",
    observations: "",
  },
};

function App() {
  const handleCheckout = (elevatorState, clientName) => {
    console.log('Checkout:', { elevatorState, clientName });
  };

  return (
    <CallOS
      data={mockCallData}
      history={mockHistory}
      onCheckout={handleCheckout}
    />
  );
}
```

### Exemplo de Uso - OS Corretiva

```tsx
import { CorrectiveOS } from './components/service-orders';

const mockCorrectiveData = {
  type: "corretiva" as const,
  osNumber: "OS-2025-000043",
  clientName: "Edifício Comercial Alpha",
  equipment: "Elevador Social - Andar 1 ao 15",
  technician: "Eduardo Silva",
  status: "Em Andamento",
  clientDescription: "Elevador parou entre andares...",
  requesterName: "João Oliveira",
  requesterPhone: "(11) 91234-5678",
  technicalReport: {
    workDone: "",
    observations: "",
  },
};

function App() {
  const handleCheckout = (elevatorState, clientName) => {
    console.log('Checkout:', { elevatorState, clientName });
  };

  return (
    <CorrectiveOS
      data={mockCorrectiveData}
      history={mockHistory}
      onCheckout={handleCheckout}
    />
  );
}
```

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
  - Preventiva: Checklist, Observação, Concluir, Histórico
  - Chamado/Corretiva: Descrição, Laudo, Concluir, Histórico

## 📋 Props dos Componentes

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

## 🔗 Dependências

### Componentes Necessários

```
/components/
├── EvidenceButtons.tsx          # Botões de foto/vídeo/áudio
└── ui/                          # Componentes Shadcn
    ├── button.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── textarea.tsx
    ├── input.tsx
    ├── select.tsx
    ├── separator.tsx
    └── tabs.tsx
```

### Ícones (lucide-react)

```tsx
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Package,
  User,
  Wrench,
  AlertCircle,
  Check,
  Ban,
  Phone,
} from "lucide-react";
```

## 💾 Integração com Backend

### Salvamento Automático

Os componentes mencionam "salvamento automático a cada 2 segundos". Implementação sugerida:

```tsx
import { useEffect, useState } from 'react';
import { debounce } from 'lodash';

function useAutoSave(data, delay = 2000) {
  useEffect(() => {
    const saveToBackend = debounce(async () => {
      // Chamada à API
      await fetch('/api/save-os', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }, delay);

    saveToBackend();

    return () => saveToBackend.cancel();
  }, [data, delay]);
}
```

### Estrutura de API Sugerida

```typescript
// POST /api/service-orders/:id/checkout
interface CheckoutRequest {
  osId: string;
  elevatorState: 'funcionando' | 'dependendo-corretiva' | 'parado';
  clientName: string;
  signature?: string; // Base64 da assinatura
}

// POST /api/service-orders/:id/checklist
interface ChecklistUpdateRequest {
  osId: string;
  items: ChecklistItem[];
}

// POST /api/service-orders/:id/technical-report
interface TechnicalReportRequest {
  osId: string;
  workDone: string;
  observations: string;
  evidences?: string[]; // URLs das evidências
}
```

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

## 📝 Notas Importantes

1. **Chamado vs Corretiva:** Apesar de terem a mesma estrutura de UI, são tipos diferentes com lógicas de negócio distintas no backend.

2. **Cronograma Mensal:** A OS Preventiva possui cronograma mensal, mas ele é gerenciado no backend e não aparece na UI.

3. **Cronômetro Removido:** A funcionalidade de cronômetro foi removida. O sistema agora guarda apenas os horários de transição de cada estado.

4. **Validação de Checkout:** O botão de checkout só é habilitado quando:
   - Estado do elevador está selecionado
   - Nome do cliente está preenchido

5. **Componente Isolado:** Cada tipo de OS é um componente completamente independente, facilitando manutenção e testes.

## 🚀 Para Cursor Agent

Este é um sistema de 3 componentes independentes de Service Orders:

- **PreventiveOS** = Preventiva com checklist
- **CallOS** = Chamado com laudo técnico
- **CorrectiveOS** = Corretiva com laudo técnico (estrutura idêntica ao Chamado)

Cada componente tem sua própria lógica e pode ser usado de forma independente. Os tipos TypeScript garantem type-safety e ajudam no autocomplete.
