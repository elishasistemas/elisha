# 🇧🇷 Diretrizes de Localização - Português Brasileiro

Este documento estabelece as diretrizes para manter toda a interface do usuário em **português brasileiro (pt-BR)**.

## 📋 Princípios Fundamentais

### 1. **Idioma Oficial**
- **Português brasileiro (pt-BR)** é o idioma oficial de toda a interface
- Todas as strings visíveis ao usuário devem estar em português
- Evitar anglicismos desnecessários

### 2. **Tom e Voz**
- **Tom profissional e acolhedor**
- **Linguagem clara e direta**
- **Foco na experiência do usuário brasileiro**

## 🎯 Áreas de Aplicação

### ✅ **Obrigatório em Português:**
- Títulos e cabeçalhos
- Labels de formulários
- Mensagens de erro e sucesso
- Botões e ações
- Placeholders de input
- Tooltips e ajuda contextual
- Navegação e menus
- Documentação do usuário

### ⚠️ **Podem permanecer em inglês:**
- Nomes técnicos de APIs
- Códigos de erro técnicos
- Nomes de variáveis e funções
- URLs e endpoints
- Logs de sistema

## 📝 Padrões de Redação

### **Formalidade**
- Use **você** (não "tu")
- Tratamento respeitoso mas não excessivamente formal
- Evite jargões técnicos desnecessários

### **Exemplos de Traduções Corretas:**

| Inglês | Português Correto | ❌ Evitar |
|--------|-------------------|-----------|
| Login | Entrar | Login |
| Sign Up | Criar conta | Cadastrar-se |
| Password | Senha | Password |
| Email | Email | E-mail |
| Save | Salvar | Save |
| Delete | Excluir | Deletar |
| Upload | Enviar | Upload |
| Download | Baixar | Download |
| Settings | Configurações | Settings |
| Dashboard | Painel | Dashboard |
| Loading... | Carregando... | Loading... |

### **Termos Técnicos Específicos:**
- **Magic Link** → **Link Mágico**
- **Service Order** → **Ordem de Serviço**
- **Equipment** → **Equipamento**
- **Collaborator** → **Colaborador**
- **Feedback** → **Feedback** (aceito)
- **Report** → **Relatório**

## 🛠️ Implementação Técnica

### **Arquivo Central: `src/lib/i18n.ts`**
Todas as strings da interface estão centralizadas neste arquivo para:
- ✅ Manter consistência
- ✅ Facilitar manutenção
- ✅ Permitir mudanças globais
- ✅ Evitar duplicação

### **Como Usar:**
```typescript
import { ui } from '@/lib/i18n'

// Em vez de:
<Button>Save</Button>

// Use:
<Button>{ui.actions.save}</Button>
```

### **Para Novos Componentes:**
1. Adicione as strings necessárias em `src/lib/i18n.ts`
2. Importe e use as constantes
3. **NUNCA** hardcode strings em português diretamente no componente

## 🎨 Supabase Auth UI

### **Configuração de Localização:**
O componente `Auth` do Supabase já está configurado com todas as strings em português brasileiro:

```typescript
localization={{
  variables: {
    sign_in: {
      email_label: 'Email',
      password_label: 'Senha',
      button_label: 'Entrar',
      // ... todas as strings em pt-BR
    }
  }
}}
```

## 📱 Formatação Brasileira

### **Data e Hora:**
- Formato: `DD/MM/YYYY`
- Exemplo: `15/10/2024`
- Horário: `15/10/2024 14:30`

### **Moeda:**
- Símbolo: `R$`
- Formato: `R$ 1.234,56`
- Código: `BRL`

### **Telefone:**
- Formato: `(11) 99999-9999`
- Celular: `(11) 9 9999-9999`

### **CNPJ/CPF:**
- CNPJ: `00.000.000/0000-00`
- CPF: `000.000.000-00`

## 🚀 Checklist para Novos Recursos

Antes de implementar qualquer nova funcionalidade, verifique:

- [ ] Todas as strings estão em `src/lib/i18n.ts`
- [ ] Formatação brasileira (data, moeda, telefone)
- [ ] Terminologia consistente
- [ ] Tom profissional e acolhedor
- [ ] Mensagens de erro em português
- [ ] Placeholders em português
- [ ] Botões e ações em português

## 📚 Referências

- [Guia de Português Brasileiro](https://www.normaculta.com.br/)
- [Acordo Ortográfico](https://www.academia.org.br/)
- [Padrões de UI/UX Brasileiros](https://www.gov.br/ds/)

---

**Lembre-se:** A experiência do usuário brasileiro deve ser natural e familiar. Quando em dúvida, prefira termos que os usuários brasileiros já conhecem e usam no dia a dia.
