# 🚀 Quick Start: Ambientes Dev & Prod

## 📋 TL;DR

```bash
# 1. Configurar ambiente de desenvolvimento
cp docs/ENV_DEVELOPMENT_TEMPLATE.md .env.development
# Editar .env.development com as credenciais do dashboard

# 2. Instalar dependências
pnpm install

# 3. Aplicar migrations no develop
pnpm db:setup:dev

# 4. Rodar projeto
pnpm dev

# 5. Abrir no navegador
open http://localhost:3000
```

---

## 🎯 Setup Completo (Primeira Vez)

### **1. Clonar Repositório**
```bash
git clone https://github.com/idantas/Elisha-admin.git
cd Elisha-admin
```

### **2. Instalar Dependências**
```bash
pnpm install
```

### **3. Configurar Ambiente**

#### **Opção A: Desenvolvimento (Recomendado)**
```bash
# Copiar template
cp docs/ENV_DEVELOPMENT_TEMPLATE.md .env.development

# Editar e preencher as credenciais
# Pegar em: https://supabase.com/dashboard/project/dahfsyvxvacibowwxgns/settings/api
code .env.development
```

#### **Opção B: Produção (apenas se necessário)**
```bash
# Copiar exemplo
cp env.example .env.local

# Editar e preencher as credenciais
# Pegar em: https://supabase.com/dashboard/project/wkccxgeevizhxmclvsnz/settings/api
code .env.local
```

### **4. Aplicar Migrations (Dev)**
```bash
# Verificar status do branch develop
pnpm db:status:dev

# Se STATUS = ACTIVE_HEALTHY, aplicar migrations
pnpm db:setup:dev
```

### **5. Rodar Projeto**
```bash
# Modo desenvolvimento (com hot-reload)
pnpm dev

# Ou com Webpack (se Turbopack tiver problemas)
pnpm dev:webpack
```

### **6. Acessar Aplicação**
```
http://localhost:3000
```

---

## 🔑 Credenciais Default (Dev)

### **Super Admin (Elisha)**
- **Email**: `iverson@elisha.app.br`
- **Senha**: (pedir ao admin)

### **Cliente de Teste**
- **Empresa**: B&S
- **Email**: (criar novo usuário)

---

## 📊 Comandos Úteis

```bash
# Ver status de ambos branches
pnpm db:branches

# Ver detalhes do branch develop
pnpm db:status:dev

# Ver detalhes do projeto prod
pnpm db:status:prod

# Resetar branch develop (⚠️ apaga todos dados)
# supabase branches delete develop --project-ref wkccxgeevizhxmclvsnz
# supabase branches create develop --project-ref wkccxgeevizhxmclvsnz --persistent

# Aplicar migrations manualmente
./scripts/setup-dev-environment.sh
```

---

## 🐛 Troubleshooting

### **Erro: "Failed to connect to Supabase"**
```bash
# 1. Verificar se branch está ativo
pnpm db:status:dev

# 2. Verificar se credenciais estão corretas
cat .env.development | grep SUPABASE

# 3. Reiniciar servidor
pnpm dev
```

### **Erro: "Module not found"**
```bash
# Limpar cache e reinstalar
rm -rf node_modules .next
pnpm install
pnpm dev
```

### **Erro: "Database not found"**
```bash
# Aplicar migrations
pnpm db:setup:dev
```

### **Erro: "Permission denied" no script**
```bash
# Dar permissão de execução
chmod +x scripts/setup-dev-environment.sh
```

---

## 📚 Próximos Passos

1. **Ler documentação completa**: `docs/ENVIRONMENTS_SETUP.md`
2. **Ver progresso do projeto**: `docs/PROGRESS_SUMMARY.md`
3. **Entender estrutura de OS**: `docs/context-os.md`
4. **Ver plan de desenvolvimento**: `.cursor/plan.yaml`

---

## 🆘 Ajuda

- **Documentação**: `docs/`
- **Issues**: GitHub Issues
- **Admin**: Iverson Dantas
- **Supabase**: https://supabase.com/dashboard
- **Vercel**: https://vercel.com/dashboard

---

**Última atualização**: 2025-10-29  
**Versão**: 1.0.0

