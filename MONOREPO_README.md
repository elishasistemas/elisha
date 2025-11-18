# 🚀 Elisha Monorepo - Frontend + Backend

Este projeto foi reorganizado em uma estrutura de **monorepo** contendo:

- **Frontend** (Next.js) em `apps/web/`
- **Backend** (NestJS) em `apps/api/`

## 📁 Estrutura do Projeto

```
/
├── apps/
│   ├── web/          # Frontend Next.js (React + Tailwind + Supabase)
│   └── api/          # Backend NestJS (API + Business Logic)
├── pnpm-workspace.yaml
└── package.json      # Scripts do monorepo
```

## 🛠️ Setup Inicial

### 1. Instalar dependências

**⚠️ Problema atual:** Há um problema temporário com pnpm e conexão. Use npm como alternativa:

```bash
# Instalar dependências do frontend
cd apps/web
npm install

# Instalar dependências do backend  
cd ../api
npm install
```

### 2. Configurar variáveis de ambiente

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Backend** (`apps/api/.env.local`):
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://wkccxgeevizhxmclvsnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## 🚀 Executar o projeto

### Desenvolvimento (recomendado)

Execute cada aplicação em terminais separados:

**Terminal 1 - Frontend:**
```bash
cd apps/web
npm run dev
```
Acesse: `http://localhost:3000`

**Terminal 2 - Backend:**
```bash
cd apps/api
npm run start:dev
```
Acesse: `http://localhost:3001/api/docs` (Swagger)

### Scripts do Monorepo (quando pnpm funcionar)

```bash
# Executar ambos simultaneamente
pnpm dev

# Executar apenas frontend
pnpm dev:web

# Executar apenas backend  
pnpm dev:api

# Build de produção
pnpm build

# Instalar todas as dependências
pnpm install
```

## 🏗️ Backend NestJS - Funcionalidades

### Módulos Implementados

1. **AuthModule** - Autenticação
   - Login/Logout
   - Registro de usuários
   - JWT Guard para rotas protegidas

2. **UsersModule** - Gestão de usuários
   - Listar usuários
   - Perfil do usuário atual
   - Buscar usuário por ID

3. **SupabaseModule** - Integração com Supabase
   - Cliente admin (service role)
   - Cliente do usuário autenticado

4. **HealthModule** - Monitoramento
   - Status da API

### Endpoints da API

**Saúde:**
- `GET /api/v1/health` - Status da API

**Autenticação:**
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `GET /api/v1/auth/profile` - Perfil (protegido)
- `POST /api/v1/auth/logout` - Logout (protegido)

**Usuários:**
- `GET /api/v1/users/me` - Usuário atual (protegido)
- `GET /api/v1/users/:id` - Usuário por ID (protegido)
- `GET /api/v1/users` - Todos os usuários (protegido)

## 🔄 Migração das Regras de Negócio

O objetivo é migrar as regras de negócio do Supabase (RLS, Functions, Triggers) para o backend NestJS:

### Próximos Passos

1. **Análise das RLS atuais** - Mapear policies do Supabase
2. **Criação de Guards** - Implementar autorização no NestJS
3. **Business Logic** - Mover lógica para services
4. **Validações** - Implementar validação de dados
5. **Testes** - Criar testes unitários e e2e

### Vantagens da Migração

✅ **Controle total** sobre regras de negócio  
✅ **Melhor testabilidade** com Jest  
✅ **Documentação automática** com Swagger  
✅ **TypeScript end-to-end**  
✅ **Validação robusta** com class-validator  
✅ **Arquitetura modular** e escalável  

## 🐛 Problemas Conhecidos

1. **pnpm network error** - Use npm temporariamente
2. **Dependências não instaladas** - Execute `npm install` em cada pasta

## 📚 Documentação

- Frontend: `apps/web/README.md`
- Backend API: `http://localhost:3001/api/docs` (Swagger)
- Supabase: `https://supabase.com/dashboard`

---

**🎯 Status:** Estrutura criada ✅ | Dependências pendentes ⏳ | Pronto para desenvolvimento ✅