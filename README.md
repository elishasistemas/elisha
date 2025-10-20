# 🇧🇷 Elisha - Sistema de Gestão

Sistema de gestão completo para empresas brasileiras, desenvolvido com Next.js, Supabase e interface 100% em português brasileiro.

## 🚀 Funcionalidades

- **Gestão de Clientes**: Cadastro e controle de clientes e contratos
- **Equipamentos**: Controle de inventário e histórico de manutenção
- **Ordens de Serviço**: Criação e acompanhamento de serviços técnicos
- **Colaboradores**: Gestão de equipe técnica
- **Relatórios**: Geração de relatórios PDF e análises
- **Feedbacks**: Coleta de avaliações dos clientes
- **Autenticação**: Login seguro com email/senha e magic link

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

- [Diretrizes de Localização](./LOCALIZACAO.md) - Guia completo de português brasileiro
- [Supabase Docs](https://supabase.com/docs) - Documentação do Supabase
- [Next.js Docs](https://nextjs.org/docs) - Documentação do Next.js
- [Shadcn UI](https://ui.shadcn.com/) - Componentes de UI

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

**Desenvolvido especificamente para o mercado brasileiro** 🇧🇷
