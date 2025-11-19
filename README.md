# 🇧🇷 Elisha - Plataforma de Manutenção Inteligente

**Elisha é uma plataforma de manutenção inteligente para empresas de elevadores de pequeno e médio porte.** Organiza operação de campo e backoffice, reduz fricção do técnico e do gestor, e adiciona inteligência prática. Canal nativo: WhatsApp. Entidade central: OS.

## 🎯 Objetivos do Produto

1. **Aumentar a conformidade e a segurança das manutenções**
2. **Reduzir o tempo operacional** de abrir, executar e fechar OS
3. **Padronizar e centralizar evidências e relatórios** com qualidade profissional
4. **Facilitar comunicação via WhatsApp** sem exigir mudança de hábitos

---

## 🚀 Funcionalidades Principais

### 1. 📋 OS e Fluxo Operacional

**Entidade central do sistema** - Ordem de Serviço completa com fluxo operacional otimizado.

#### Tipos de OS
- **Preventiva**: Manutenções programadas por tipo de equipamento e frequência
- **Chamado**: Solicitações de atendimento do cliente
- **Corretiva**: Correções de problemas identificados
- **Corretiva Programada**: Correções agendadas
- **Urgência**: Atendimentos de emergência

#### Estados do Fluxo
- **Aberta**: OS criada e disponível para atribuição
- **Em deslocamento**: Técnico a caminho do local
- **Check-in**: Técnico chegou ao local (timestamp automático)
- **Em execução**: OS em andamento
- **Checkout**: Finalização da execução
- **Fechada**: OS concluída e documentada
- **Reaberta**: OS reaberta para correções ou complementos

#### Características
- ✅ Histórico completo de status com timestamps
- ✅ **Sem cronômetro em tempo real** - apenas timestamps de transição
- ✅ Dashboard técnico para aceitar/recusar OS disponíveis
- ✅ Atribuição automática ou manual de técnicos
- ✅ Reagendamento de OS preventivas

---

### 2. ✅ Checklists e Conformidade

Sistema completo de checklists baseado em normas ABNT para garantir conformidade e segurança.

#### Templates por Tipo de Equipamento
- **Elevador Elétrico**: Templates para mensal, trimestral, semestral e anual
- **Elevador Hidráulico**: Templates para mensal, bimestral, trimestral, semestral e anual
- **Plataforma Vertical**: Templates para mensal, bimestral, semestral e anual

#### Normas ABNT Aplicadas
- **NBR 16083**: Requisitos de segurança para elevadores
- **NBR 16858-1**: Elevadores elétricos - Requisitos de segurança
- **NBR 16858-2**: Elevadores hidráulicos - Requisitos de segurança
- **NBR 16858-7**: Manutenção e inspeção
- **NBR 9050**: Acessibilidade (para plataformas)
- **NBR ISO 9386-1**: Plataformas elevatórias
- **NM 313**: Norma Mercosul aplicável

#### Funcionalidades
- ✅ **Snapshot imutável**: Template anexado à OS no momento da geração (não muda mesmo se template for atualizado)
- ✅ Respostas padronizadas: **Conforme**, **Não conforme**, **N/A**
- ✅ Compliance score automático com cálculo de percentual de conformidade
- ✅ Validação de itens críticos antes de concluir OS
- ✅ Integração com laudo técnico e evidências

---

### 3. 📸 Evidências e Relatórios

Sistema completo de captura e documentação profissional.

#### Tipos de Evidências
- **Fotos**: Captura de imagens durante a execução
- **Vídeos**: Gravação de procedimentos ou problemas
- **Áudio**: Anotações por voz
- **Leituras**: Valores numéricos (tensão, corrente, etc.)
- **Assinaturas**: Assinatura digital do técnico e cliente

#### Relatórios Profissionais
- ✅ **Geração de PDF assinado** da OS completa
- ✅ PDF inclui: checklist completo, evidências, pontuação de conformidade, laudo técnico
- ✅ Link assinado e seguro para compartilhamento
- ✅ Qualidade profissional para apresentação ao cliente

---

### 4. 🔄 Preventivo e Agenda

Sistema inteligente de manutenção preventiva automatizada.

#### Planos Preventivos
- Configuração por **tipo de equipamento** e **frequência**
- Intervalos configuráveis: mensal, bimestral, trimestral, semestral, anual
- Janelas de tolerância para agendamento

#### Geração Automática
- ✅ **Geração automática ao cadastrar** cliente e equipamentos
- ✅ **Recorrência automática** enquanto cliente estiver ativo
- ✅ OS preventivas criadas **sem técnico atribuído** (atribuição posterior)
- ✅ **Data automática** calculada baseada em intervalos e janelas
- ✅ Job recorrente para manter agenda atualizada

#### Gestão de Agenda
- Atribuição de técnico a OS preventivas
- Reagendamento com motivo
- Visualização de agenda completa

---

### 5. 📅 Calendário de Manutenção

Visualização e gestão de OS em formato de calendário.

- ✅ Nova aba no sidebar usando componente de calendário (shadcn)
- ✅ Visual de OS por período (mês/semana)
- ✅ Ações rápidas: atribuir técnico e reagendar
- ✅ Filtros por tipo, status e técnico
- ✅ Integração com fluxo operacional

---

### 6. 🏢 Multiempresa e Acesso

Sistema multi-tenant completo com controle granular de acesso.

#### Multi-Tenancy
- ✅ **Tenant por empresa** de manutenção
- ✅ Isolamento completo de dados por empresa (RLS)
- ✅ Super Admin com acesso a todas as empresas
- ✅ Impersonation para suporte e debugging

#### Convites e Permissões
- ✅ Convites por email (sistema de tokens)
- ✅ Permissões por papel: **Admin**, **Técnico**, **Super Admin**
- ✅ Controle granular de acesso por recurso
- ✅ Histórico de convites e permissões

---

### 7. 📝 Cadastros e Base

Sistema completo de cadastros para gestão de clientes e equipamentos.

#### Clientes e Sites
- Cadastro completo de clientes (CNPJ, endereço, contatos)
- Múltiplos sites por cliente
- Contatos e responsáveis por site

#### Equipamentos
- Cadastro detalhado de equipamentos
- Tipos: Elevador Elétrico, Elevador Hidráulico, Plataforma Vertical
- Informações: marca, modelo, capacidade, pavimentos
- Histórico completo de manutenções

#### Contratos
- Contratos com planos e SLAs
- Vigência e status de contratos
- Valores e condições comerciais

#### Tabelas de Apoio
- Modelos de equipamentos
- Marcas e fabricantes
- Capacidades padrão
- Tipos de elevador

---

### 8. 👥 Colaboradores

Gestão completa da equipe técnica.

- Cadastro de técnicos e gestores
- Vinculação a empresas
- Histórico de OS por técnico
- Estatísticas e desempenho

---

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Shadcn UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Autenticação**: Supabase Auth UI com localização pt-BR
- **Deploy**: Vercel (recomendado)
- **PWA**: Suporte a Progressive Web App para uso offline

---

## 📦 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/idantas/Elisha-admin.git
cd web-admin
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp env.example .env.local
```

Edite o `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Execute o servidor de desenvolvimento:
```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🌍 Localização

Este projeto está **100% em português brasileiro (pt-BR)**:

- ✅ Interface totalmente traduzida
- ✅ Supabase Auth UI em português
- ✅ Formatação brasileira (datas, moeda, telefone)
- ✅ Terminologia adequada ao mercado brasileiro
- ✅ Documentação em português

Consulte [LOCALIZACAO.md](./LOCALIZACAO.md) para diretrizes detalhadas de localização.

---

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas da aplicação (Next.js App Router)
│   ├── (protected)/       # Rotas protegidas
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── orders/        # Lista de OS
│   │   ├── os/[id]/full/  # Tela fullscreen de OS
│   │   ├── clients/       # Gestão de clientes
│   │   └── technicians/   # Gestão de técnicos
│   ├── login/             # Página de login
│   └── signup/            # Cadastro com token
├── components/            # Componentes reutilizáveis
│   ├── service-orders/    # Componentes específicos de OS
│   └── ui/                # Componentes de UI (Shadcn)
├── lib/                   # Utilitários e configurações
│   ├── supabase.ts        # Cliente Supabase
│   └── storage.ts         # Gerenciamento de storage
├── services/              # Serviços de negócio
│   ├── checklist/         # Serviços de checklist
│   └── reports/           # Geração de relatórios
└── types/                 # Tipos TypeScript
```

---

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Verificação de código
```

### Scripts de Seed (Opcional)

```bash
# Popular templates de checklist
npx tsx scripts/seed-checklist-templates.ts <empresa_id>

# Popular planos preventivos
npx tsx scripts/seed-preventive-plans.ts <empresa_id>
```

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

O projeto é compatível com qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS Amplify

---

## 📚 Documentação

### Sistema Elisha
- [Diretrizes de Localização](./LOCALIZACAO.md) - Guia completo de português brasileiro
- [Sistema de Checklist](./CHECKLIST_INDEX.md) - Índice completo do sistema de checklists
  - [Guia Rápido](./CHECKLIST_QUICKSTART.md) - Setup em 5 minutos
  - [Documentação Completa](./CHECKLIST_SYSTEM.md) - Referência técnica
  - [Integração PDF](./CHECKLIST_RELATORIO_INTEGRATION.md) - Relatórios com checklist
- [Plan de Implementação](./.cursor/plan.yaml) - Roadmap completo do sistema de OS
- [Contexto de OS](./docs/context-os.md) - Schema e estrutura de dados

### Migrations e Setup
- [Tarefa 4a - Templates](./docs/TASK_4a_COMPLETED.md) - Templates de checklist por tipo
- [Tarefa 4b - Planos](./docs/TASK_4b_COMPLETED.md) - Planos preventivos
- [Tarefa 4c - Geração Automática](./docs/TASK_4c_COMPLETED.md) - Sistema de geração automática

### Tecnologias
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
- [Next.js Docs](https://nextjs.org/docs) - Documentação do Next.js
- [Shadcn UI](https://ui.shadcn.com/) - Componentes de UI

---

## 🔄 Changelog Recente

### Novembro 2025
- ✅ Sistema de OS Preventivas com geração automática
- ✅ Templates de checklist por tipo de equipamento
- ✅ Planos preventivos configuráveis
- ✅ Calendário de manutenção (em desenvolvimento)
- ✅ Correções de UI e UX
- ✅ Desativação temporária do Resend (convite por link)
- ✅ Scripts de seed para templates e planos

### Outubro 2025
- ✅ Sistema completo de checklist com snapshot imutável
- ✅ Dashboard técnico com aceitar/recusar OS
- ✅ Sistema de evidências (fotos, vídeos, áudios)
- ✅ Laudo técnico com autosave
- ✅ Histórico de mudanças de status
- ✅ Fluxo completo de OS sem cronômetro

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat(os): Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

**Desenvolvido especificamente para o mercado brasileiro** 🇧🇷

**Elisha** - Manutenção Inteligente de Elevadores
