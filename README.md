# 🇧🇷 Elisha - Sistema de Gestão

Sistema de gestão completo para empresas brasileiras, desenvolvido com Next.js, Supabase e interface 100% em português brasileiro.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro e controle de clientes e contratos
- **Equipamentos**: Controle de inventário e histórico de manutenção
- **Ordens de Serviço**: 
  - Criação e acompanhamento de serviços técnicos
  - OS Preventivas com geração automática por tipo de equipamento
  - OS Corretivas e Chamados
  - Dashboard técnico com aceitar/recusar OS
  - Fluxo completo sem cronômetro (apenas timestamps)
- **Checklists Inteligentes**: 
  - Sistema completo de checklists com snapshot imutável
  - Templates por tipo de equipamento (Elétrico, Hidráulico, Plataforma)
  - Compliance score automático
  - Integração com laudo técnico e evidências
- **Planos Preventivos**: 
  - Configuração de frequências por tipo de equipamento
  - Geração automática de OS preventivas no cadastro
  - Job recorrente para manutenção contínua
- **Colaboradores**: Gestão de equipe técnica
- **Relatórios**: Geração de relatórios PDF e análises
- **Feedbacks**: Coleta de avaliações dos clientes
- **Autenticação**: Login seguro com email/senha e magic link
- **Super Admin**: Sistema de administração multi-empresa com impersonation

## 🛠️ Tecnologias

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Shadcn UI, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Autenticação**: Supabase Auth UI com localização pt-BR
- **Deploy**: Vercel (recomendado)

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd web-admin
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

4. Execute o servidor de desenvolvimento:
```bash
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🌍 Localização

Este projeto está **100% em português brasileiro (pt-BR)**:

- ✅ Interface totalmente traduzida
- ✅ Supabase Auth UI em português
- ✅ Formatação brasileira (datas, moeda, telefone)
- ✅ Terminologia adequada ao mercado brasileiro
- ✅ Documentação em português

Consulte [LOCALIZACAO.md](./LOCALIZACAO.md) para diretrizes detalhadas de localização.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas da aplicação
│   ├── login/             # Página de login
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes reutilizáveis
│   └── ui/               # Componentes de UI (Shadcn)
├── lib/                  # Utilitários e configurações
│   ├── i18n.ts          # Strings de localização
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Utilitários gerais
```

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Verificação de código
```

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

## 📚 Documentação

### Sistema Elisha
- [Diretrizes de Localização](./LOCALIZACAO.md) - Guia completo de português brasileiro
- [Sistema de Checklist](./CHECKLIST_INDEX.md) - Índice completo do sistema de checklists
  - [Guia Rápido](./CHECKLIST_QUICKSTART.md) - Setup em 5 minutos
  - [Documentação Completa](./CHECKLIST_SYSTEM.md) - Referência técnica
  - [Integração PDF](./CHECKLIST_RELATORIO_INTEGRATION.md) - Relatórios com checklist
- [Plan de Implementação](./.cursor/plan.yaml) - Roadmap completo do sistema de OS
- [Contexto de OS](./docs/context-os.md) - Schema e estrutura de dados

### Funcionalidades Recentes
- ✅ **Templates de Checklist por Tipo**: Templates específicos para cada tipo de equipamento
- ✅ **Planos Preventivos**: Sistema de agendamento automático de manutenções
- ✅ **Geração Automática de OS**: OS preventivas criadas automaticamente ao cadastrar equipamentos
- ✅ **Dashboard Técnico**: Interface para técnicos aceitarem/recusarem OS
- ✅ **Sistema de Evidências**: Upload de fotos, vídeos e áudios vinculados à OS

### Tecnologias
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
- [Next.js Docs](https://nextjs.org/docs) - Documentação do Next.js
- [Shadcn UI](https://ui.shadcn.com/) - Componentes de UI

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 🔄 Changelog Recente

### Novembro 2025
- ✅ Sistema de OS Preventivas com geração automática
- ✅ Templates de checklist por tipo de equipamento
- ✅ Planos preventivos configuráveis
- ✅ Correções de UI e UX
- ✅ Desativação temporária do Resend (convite por link)
- ✅ Scripts de seed para templates e planos

### Outubro 2025
- ✅ Sistema completo de checklist com snapshot imutável
- ✅ Dashboard técnico com aceitar/recusar OS
- ✅ Sistema de evidências (fotos, vídeos, áudios)
- ✅ Laudo técnico com autosave
- ✅ Histórico de mudanças de status

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

**Desenvolvido especificamente para o mercado brasileiro** 🇧🇷
