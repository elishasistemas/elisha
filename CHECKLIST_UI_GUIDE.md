# Guia de Uso - Interface de Checklists

## 📋 Acessando a Interface

1. **Faça login** no sistema
2. No menu lateral, clique em **"Checklists"** (ícone de CheckSquare)
3. Você verá a lista de templates de checklist

## ➕ Criar um Novo Checklist

### Passo 1: Abrir o Formulário
- Clique no botão **"Novo Checklist"** (canto superior direito)

### Passo 2: Informações Básicas
Preencha os campos:
- **Nome**: Ex: "Manutenção Preventiva - Elevador"
- **Tipo de Serviço**: Selecione entre:
  - Preventiva
  - Corretiva
  - Emergencial
  - Chamado
  - Todos os Tipos
- **Origem**: Selecione entre:
  - Personalizado (criado pela sua empresa)
  - Elisha Padrão (template do sistema)
  - ABNT (baseado em normas)
- **Referências ABNT**: (Opcional) Ex: "NBR 16083, NBR 5666"

### Passo 3: Adicionar Itens
1. Clique em **"Adicionar Item"**
2. Para cada item, configure:
   - **Seção**: Agrupe itens por categoria (Ex: "Segurança", "Medições")
   - **Tipo**: Escolha o tipo de resposta:
     - **Sim/Não**: Para verificações simples
     - **Texto**: Para observações
     - **Número**: Para valores numéricos
     - **Leitura (Medição)**: Para medições com unidade
     - **Foto**: Para evidências fotográficas
     - **Assinatura**: Para assinaturas digitais
   - **Descrição**: O que deve ser verificado
   - **Obrigatório**: ☑️ Marque se for obrigatório preencher
   - **Crítico**: ☑️ Marque se for crítico para a conclusão da OS

### Passo 4: Organizar Itens
- Use os botões **↑** e **↓** para reordenar os itens
- Use o botão **🗑️** para remover itens

### Passo 5: Salvar
- Clique em **"Criar Checklist"**
- O template estará disponível para uso em ordens de serviço

## ✏️ Editar um Checklist

1. Na lista de checklists, clique no menu **⋮** (três pontos)
2. Selecione **"Editar"**
3. Faça as alterações necessárias
4. Clique em **"Atualizar"**

> **Nota**: Ao editar, a versão será incrementada automaticamente. As OS que já usam este checklist não serão afetadas (elas mantêm o snapshot da versão anterior).

## 📋 Outras Ações

### Duplicar Checklist
1. Menu **⋮** → **"Duplicar"**
2. Uma cópia será criada com o nome "(Cópia)"
3. Edite a cópia conforme necessário

### Desativar/Ativar Checklist
1. Menu **⋮** → **"Desativar"** ou **"Ativar"**
2. Checklists inativos não aparecem na criação de OS
3. Útil para manter templates antigos sem deletá-los

### Excluir Checklist
1. Menu **⋮** → **"Excluir"**
2. Confirme a exclusão
3. **Importante**: OS que já usam este checklist não serão afetadas

## 🎯 Exemplo Prático

### Checklist de Manutenção Preventiva

**Informações Básicas**:
- Nome: "Manutenção Preventiva - Elevador"
- Tipo: Preventiva
- Origem: Personalizado
- Refs ABNT: "NBR 16083"

**Itens**:

1. **Seção: Segurança**
   - Tipo: Sim/Não
   - Descrição: "Equipamento desenergizado?"
   - ☑️ Obrigatório ☑️ Crítico

2. **Seção: Segurança**
   - Tipo: Sim/Não
   - Descrição: "EPIs adequados em uso?"
   - ☑️ Obrigatório ☑️ Crítico

3. **Seção: Inspeção Visual**
   - Tipo: Texto
   - Descrição: "Estado geral da cabine"
   - ☑️ Obrigatório

4. **Seção: Medições**
   - Tipo: Leitura
   - Descrição: "Corrente do motor principal"
   - ☑️ Obrigatório

5. **Seção: Documentação**
   - Tipo: Foto
   - Descrição: "Foto do painel de comando"
   - ☑️ Obrigatório

6. **Seção: Finalização**
   - Tipo: Assinatura
   - Descrição: "Assinatura do técnico"
   - ☑️ Obrigatório ☑️ Crítico

## 🔗 Usando o Checklist em uma OS

Depois de criar o template:

1. Vá para **"Ordens de Serviço"**
2. Abra uma OS existente ou crie uma nova
3. Na OS, você verá a opção de **"Iniciar Checklist"**
4. Selecione o template criado
5. O checklist será vinculado automaticamente
6. Preencha os itens durante a execução da OS

## 💡 Dicas

### ✅ Boas Práticas

1. **Use seções** para organizar itens relacionados
2. **Marque como crítico** apenas itens essenciais para segurança
3. **Marque como obrigatório** itens que devem ser preenchidos
4. **Use nomes descritivos** para facilitar a seleção
5. **Crie versões** ao invés de editar templates em uso

### ⚠️ Atenção

- **Itens críticos não conformes** bloqueiam a conclusão da OS
- **Itens críticos pendentes** também bloqueiam a conclusão
- **Versões antigas** continuam válidas em OS já criadas
- **Exclusão** só remove o template, não afeta OS existentes

## 🎨 Badges e Status

### Status do Checklist
- 🟢 **Ativo**: Disponível para novas OS
- ⚫ **Inativo**: Não aparece na seleção

### Origem
- 🟣 **ABNT**: Baseado em normas
- 🔵 **Personalizado**: Criado pela empresa
- 🟢 **Elisha Padrão**: Template do sistema

### Tipo de Serviço
- Preventiva
- Corretiva
- Emergencial
- Chamado
- Todos os Tipos

## 📊 Dashboard de Checklists

A tela principal mostra:
- **Total de templates** cadastrados
- **Nome** do checklist
- **Tipo de serviço** associado
- **Origem** do template
- **Quantidade de itens**
- **Versão** atual
- **Status** (Ativo/Inativo)

## 🆘 Problemas Comuns

### "Erro ao salvar checklist"
- Verifique se preencheu o nome
- Verifique se adicionou pelo menos 1 item
- Verifique sua conexão com internet

### "Checklist não aparece na OS"
- Verifique se está **Ativo**
- Verifique se o **tipo de serviço** corresponde
- Atualize a página

### "Não consigo excluir"
- Verifique se você tem permissão (admin/gestor)
- Tente desativar ao invés de excluir

---

**Pronto!** Agora você pode criar e gerenciar checklists facilmente! 🎉

Para mais informações técnicas, consulte:
- [Documentação Completa](./CHECKLIST_SYSTEM.md)
- [Guia Rápido para Desenvolvedores](./CHECKLIST_QUICKSTART.md)

