# Implementação: Tela Full-Screen e Dock Global

**Data:** 28 de Outubro de 2025  
**Status:** ✅ COMPLETO

---

## 📋 Requisitos

1. Tela de OS deve ser **realmente full-screen**, escondendo até o menu lateral (sidebar)
2. Quando minimizar, o card deve ser **visível de qualquer lugar da aplicação**

---

## ✅ Implementação

### 1. **Tela Full-Screen que Sobrepõe Tudo**

**Arquivo:** `/src/app/(protected)/os/[id]/full/page.tsx`

**Alterações:**
```tsx
// Antes: tela normal dentro do layout
<div className="min-h-screen bg-background p-4 md:p-8">

// Depois: tela full-screen sobrepondo tudo
<div className="fixed inset-0 z-[9999] bg-background p-4 md:p-8 overflow-auto">
```

**Características:**
- ✅ `position: fixed` + `inset-0` → cobre toda a viewport
- ✅ `z-index: 9999` → fica acima de sidebar, header, e todos os outros componentes
- ✅ `overflow-auto` → permite scroll se o conteúdo for grande
- ✅ Esconde sidebar, header, e qualquer outro elemento do layout

---

### 2. **Dock Global Persistente**

**Arquivo:** `/src/components/os-dock.tsx` (novo componente)

**Funcionalidades:**
- ✅ **Persiste no localStorage:** Dados da OS são salvos quando minimiza
- ✅ **Aparece em todas as páginas:** Renderizado no layout principal
- ✅ **Cronômetro contínuo:** Continua contando mesmo navegando entre páginas
- ✅ **Botões de ação:**
  - **Maximizar:** Reabre a tela full-screen
  - **Fechar:** Remove o dock

**Estrutura de Dados (localStorage):**
```typescript
interface OSDockData {
  os_id: string          // ID da OS para restaurar
  numero_os: string      // Número da OS para exibir
  tempo_inicio: string   // ISO timestamp do início (em_deslocamento)
  minimized_at: string   // Timestamp de quando foi minimizado
}
```

**Armazenamento:**
```typescript
localStorage.setItem('os_dock', JSON.stringify(dockData))
```

---

### 3. **Integração com Layout Principal**

**Arquivo:** `/src/app/(protected)/layout.tsx`

**Alterações:**
```tsx
import { OSDock } from '@/components/os-dock'

return (
  <>
    <SidebarProvider>
      {/* Layout normal com sidebar e conteúdo */}
    </SidebarProvider>
    
    {/* Dock global renderizado fora do layout */}
    <OSDock />
  </>
)
```

**Por que fora do `<SidebarInset>`?**
- Garante que o dock apareça **em todas as páginas**, não apenas dentro do layout protegido
- Mantém o `z-index` correto (não é afetado pelo stacking context da sidebar)

---

### 4. **Fluxo de Uso**

#### **Aceitar OS:**
1. Usuário clica em "Aceitar" no dashboard
2. RPC `os_accept` é executado → status muda para `em_deslocamento`
3. Histórico registra timestamp
4. Redireciona para `/os/{id}/full`

#### **Tela Full-Screen:**
5. Página abre em full-screen (cobre tudo)
6. Cronômetro roda baseado no timestamp do histórico
7. Botões disponíveis: "Voltar" e "Minimizar"

#### **Minimizar:**
8. Usuário clica em "Minimizar"
9. Dados salvos no `localStorage`:
   - `os_id`, `numero_os`, `tempo_inicio`, `minimized_at`
10. Dispara evento customizado `os-dock-updated`
11. Redireciona para `/dashboard`

#### **Dock Global:**
12. Dock aparece no canto inferior direito
13. Mostra cronômetro em tempo real
14. Usuário pode navegar para qualquer página
15. Dock permanece visível

#### **Restaurar Full-Screen:**
16. Usuário clica no botão "Maximizar" no dock
17. Redireciona para `/os/{os_id}/full`
18. Tela full-screen é restaurada
19. Cronômetro continua de onde parou

#### **Fechar Dock:**
20. Usuário clica no botão "X" no dock
21. `localStorage` é limpo
22. Dock desaparece

---

## 🎨 UI/UX

### **Tela Full-Screen:**
- Background branco sólido
- Sem sidebar ou header visível
- Botão "Voltar" no canto superior esquerdo
- Botão "Minimizar" no canto superior direito
- Cronômetro destacado com borda azul (se houver tempo decorrido)
- Cards de informação e ações

### **Dock Global:**
- **Posição:** `fixed bottom-4 right-4`
- **Z-index:** `9998` (abaixo da tela full-screen, mas acima de tudo o resto)
- **Tamanho:** `w-80` (320px)
- **Estilo:** Card com borda azul (primary), shadow 2xl
- **Animação:** Ícone de relógio com pulso
- **Botões:**
  - Maximizar (ícone `Maximize2`)
  - Fechar (ícone `X`)

---

## 🔧 Detalhes Técnicos

### **Event-Driven Architecture:**

**Evento Customizado:**
```typescript
window.dispatchEvent(new CustomEvent('os-dock-updated'))
```

**Listener no Dock:**
```typescript
window.addEventListener('os-dock-updated', handleUpdate)
```

**Por quê?**
- Sincroniza o dock com mudanças no localStorage
- Permite que o dock atualize mesmo se foi criado antes da minimização

---

### **Persistência de Estado:**

**Por que localStorage?**
- ✅ Persiste mesmo ao fechar o navegador
- ✅ Simples de implementar
- ✅ Não requer infraestrutura adicional
- ✅ Funciona offline

**Alternativas consideradas:**
- ❌ Context API: Não persiste ao recarregar
- ❌ Zustand: Requer biblioteca adicional
- ❌ Database: Overhead desnecessário

---

### **Z-Index Hierarchy:**

```
9999 → Tela Full-Screen da OS
9998 → Dock Global
50   → Modals/Dialogs normais
10   → Sidebar/Header
1    → Conteúdo normal
```

---

## 🧪 Casos de Teste

### **Teste 1: Full-Screen Cobre Tudo**
1. Aceitar uma OS
2. Verificar que sidebar não está visível
3. Verificar que header não está visível
4. Verificar que apenas o conteúdo da OS aparece

✅ **Resultado Esperado:** Tela cobre 100% da viewport

---

### **Teste 2: Minimizar e Navegar**
1. Abrir OS full-screen
2. Clicar em "Minimizar"
3. Voltar para dashboard
4. Navegar para "Clientes"
5. Navegar para "Técnicos"
6. Verificar que dock está sempre visível

✅ **Resultado Esperado:** Dock permanece visível em todas as páginas

---

### **Teste 3: Cronômetro Persistente**
1. Abrir OS full-screen
2. Anotar tempo do cronômetro (ex: 00:05:30)
3. Minimizar
4. Esperar 1 minuto
5. Verificar que cronômetro continua (ex: 00:06:30)

✅ **Resultado Esperado:** Cronômetro não para

---

### **Teste 4: Restaurar Full-Screen**
1. Minimizar OS
2. Navegar para outra página
3. Clicar em "Maximizar" no dock
4. Verificar que volta para `/os/{id}/full`
5. Verificar que cronômetro está sincronizado

✅ **Resultado Esperado:** Tela full-screen é restaurada corretamente

---

### **Teste 5: Fechar Dock**
1. Minimizar OS
2. Clicar no "X" no dock
3. Verificar que dock desaparece
4. Recarregar página
5. Verificar que dock não reaparece

✅ **Resultado Esperado:** Dock é removido permanentemente até próxima minimização

---

### **Teste 6: Persistência ao Recarregar**
1. Minimizar OS
2. Recarregar página (F5)
3. Verificar que dock reaparece
4. Verificar que cronômetro está correto

✅ **Resultado Esperado:** Dock persiste ao recarregar

---

## 📁 Arquivos Modificados/Criados

### **Criados:**
- ✅ `/src/components/os-dock.tsx` (componente de dock global)
- ✅ `/docs/FULLSCREEN_IMPLEMENTATION.md` (esta documentação)

### **Modificados:**
- ✅ `/src/app/(protected)/os/[id]/full/page.tsx`
  - Adicionado `position: fixed` e `z-index: 9999`
  - Implementado salvamento no localStorage ao minimizar
  - Removido código do dock inline (movido para componente global)
- ✅ `/src/app/(protected)/layout.tsx`
  - Importado `OSDock`
  - Renderizado fora do `SidebarProvider`

---

## 🚀 Melhorias Futuras (Opcional)

### **1. Múltiplas OS Simultâneas**
Permitir que o técnico aceite múltiplas OS e alterne entre elas via dock.

**Implementação:**
- Armazenar array no localStorage: `os_docks: OSDockData[]`
- Mostrar múltiplos cards no dock ou um card com dropdown
- Botão "Alternar OS" para trocar entre OS ativas

---

### **2. Notificações no Dock**
Alertas quando o tempo de deslocamento passa de X minutos.

**Implementação:**
- Verificar `tempoDecorrido.total_seconds`
- Mostrar badge de alerta no dock
- Tocar som/notificação nativa

---

### **3. Sincronização Multi-Aba**
Se usuário abrir em múltiplas abas, sincronizar estado.

**Implementação:**
- Usar `storage` event do localStorage
- Atualizar dock em todas as abas simultaneamente

---

### **4. Animação de Transição**
Transição suave ao abrir/fechar full-screen.

**Implementação:**
- Usar Framer Motion ou CSS transitions
- Fade in/out + scale

---

## ✅ Conclusão

A implementação de **tela full-screen + dock global** foi concluída com sucesso! O sistema agora oferece:

- ✅ Imersão total durante atendimento (full-screen)
- ✅ Flexibilidade de navegação (dock global)
- ✅ Persistência de estado (localStorage)
- ✅ UX fluída e intuitiva

**Próxima Tarefa:** Tarefa 3 - Implementar Check-in (Chegada)

---

**Documento mantido por**: Elisha Team  
**Última atualização**: 28/10/2025

