# 🚀 Configuração MCP (Model Context Protocol)

## 📋 MCP Servers Configurados

### ✅ Já Funcionando:
1. **shadcn** - Adicionar componentes UI automaticamente
2. **resend** - Enviar emails via Resend API

### 🔧 Requer Configuração:
3. **filesystem** - Operações avançadas de arquivos (já configurado com path do projeto)
4. **github** - Gerenciar repositório, PRs, issues (requer token)
5. **postgres-dev** - Acesso direto ao Supabase DEV (requer senha)
6. **postgres-prod** - Acesso direto ao Supabase PROD (requer senha)
7. **sequential-thinking** - Raciocínio passo-a-passo para tarefas complexas

---

## 🔑 Passo 1: Configurar GitHub Token

1. Acesse: https://github.com/settings/tokens/new
2. Nome: "MCP Elisha Admin"
3. Permissões necessárias:
   - ✅ `repo` (full control)
   - ✅ `workflow` (update workflows)
   - ✅ `read:org` (read org data)
4. Clique em "Generate token"
5. Copie o token gerado

Edite `.cursor/mcp.json` e substitua `<YOUR_GITHUB_TOKEN>` pelo token.

---

## 🗄️ Passo 2: Configurar Supabase Database

### Opção A: Usar Senhas Diretas (Menos Seguro)

Edite `.cursor/mcp.json` e substitua:
- `[YOUR_DEV_PASSWORD]` pela senha do banco DEV
- `[YOUR_PROD_PASSWORD]` pela senha do banco PROD

### Opção B: Usar Variáveis de Ambiente (Mais Seguro)

1. Crie um arquivo `.env.mcp` na raiz do projeto:

```bash
SUPABASE_DEV_PASSWORD=sua_senha_dev
SUPABASE_PROD_PASSWORD=sua_senha_prod
GITHUB_TOKEN=seu_github_token
```

2. Adicione ao `.gitignore`:
```
.env.mcp
```

3. Modifique `.cursor/mcp.json` para usar variáveis:

```json
{
  "mcpServers": {
    "postgres-dev": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.tbxumetajqwnmbcqpfmr:${SUPABASE_DEV_PASSWORD}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
      ],
      "env": {
        "SUPABASE_DEV_PASSWORD": "${SUPABASE_DEV_PASSWORD}"
      }
    }
  }
}
```

---

## 🎯 Passo 3: Obter Senhas do Supabase

### Para Supabase DEV (tbxumetajqwnmbcqpfmr):
1. Acesse: https://supabase.com/dashboard/project/tbxumetajqwnmbcqpfmr/settings/database
2. Vá em "Connection String" → "Connection pooling"
3. Copie a senha (depois de `postgres:`)

### Para Supabase PROD (pfgaepysyopkbnlaiucd):
1. Acesse: https://supabase.com/dashboard/project/pfgaepysyopkbnlaiucd/settings/database
2. Vá em "Connection String" → "Connection pooling"
3. Copie a senha (depois de `postgres:`)

---

## ✅ Passo 4: Reiniciar VS Code/Cursor

Após configurar as credenciais:
1. Feche e abra o Cursor/VS Code
2. Os MCP servers serão iniciados automaticamente

---

## 🎉 Como Usar MCP

### Exemplos de Comandos:

#### GitHub:
```
"Crie uma branch chamada feature/nova-funcionalidade"
"Abra uma PR da branch dev para main"
"Liste os últimos 10 commits"
"Mostre as issues abertas"
```

#### Supabase (Postgres):
```
"Mostre todas as tabelas do banco DEV"
"Execute: SELECT * FROM empresas LIMIT 5"
"Aplique a migration do arquivo X no banco DEV"
"Copie a estrutura da tabela colaboradores de DEV para PROD"
```

#### Filesystem:
```
"Liste todos os arquivos TypeScript em apps/web/src"
"Busque por 'TODO' em todos os arquivos"
"Crie um backup da pasta supabase/migrations"
```

#### Shadcn:
```
"Adicione o componente calendar do shadcn"
"Liste todos os componentes shadcn disponíveis"
```

#### Resend:
```
"Envie um email de teste para meu@email.com"
"Liste os últimos emails enviados"
```

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:
- **NUNCA** commite `.cursor/mcp.json` com tokens/senhas reais
- Use `.env.mcp` para credenciais sensíveis
- Adicione `.env.mcp` ao `.gitignore`
- Considere usar secrets managers (1Password, Bitwarden CLI)

### Verificar antes de commitar:
```bash
git diff .cursor/mcp.json
```

Se houver tokens/senhas visíveis, **NÃO COMMITE!**

---

## 🐛 Troubleshooting

### MCP server não inicia:
1. Verifique se as credenciais estão corretas
2. Teste a conexão Postgres manualmente:
   ```bash
   psql "postgresql://postgres.tbxumetajqwnmbcqpfmr:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
   ```
3. Verifique os logs: `View → Output → Model Context Protocol`

### GitHub token não funciona:
1. Verifique se o token tem as permissões corretas
2. Teste o token:
   ```bash
   curl -H "Authorization: token SEU_TOKEN" https://api.github.com/user
   ```

### Postgres timeout:
- Use connection pooling (porta 6543) em vez de direct connection (porta 5432)
- Verifique se o IP está na whitelist do Supabase (ou use `0.0.0.0/0`)

---

## 📚 Documentação Oficial

- MCP Protocol: https://modelcontextprotocol.io
- MCP Servers: https://github.com/modelcontextprotocol/servers
- Supabase Connection: https://supabase.com/docs/guides/database/connecting-to-postgres

---

## 🎯 Próximos Passos

Após configurar, você poderá:
1. ✅ Fazer deploys direto do chat
2. ✅ Gerenciar banco de dados via comandos
3. ✅ Criar PRs e branches automaticamente
4. ✅ Executar queries SQL diretamente
5. ✅ Automatizar workflows completos

**Seu workflow vai ficar 10x mais rápido!** 🚀
