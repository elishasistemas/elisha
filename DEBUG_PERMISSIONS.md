# 🐛 Debug - Problemas de Permissões

## ✅ Correções Aplicadas

### 1. **Página de Usuários** (settings/users)
**Problema:** Mostrava "Apenas administradores podem gerenciar usuários" mesmo sendo admin.

**Correção:**
- Agora verifica `active_role === "admin"` OU `roles.includes("admin")` OU `is_elisha_admin`
- Adicionado log de debug para ver qual permissão está sendo detectada

### 2. **Link Super Admin** (sidebar)
**Problema:** Não conseguia clicar no "Super Admin" na sidebar.

**Correção:**
- Adicionado logs para debug
- Verificação se `is_elisha_admin` está corretamente carregado

---

## 🧪 Teste Agora

### Passo 1: Abrir Console
1. Pressione **F12** (ou **Cmd+Option+I** no Mac)
2. Aba **Console**
3. Limpar console (ícone 🚫)

### Passo 2: Hard Reload
1. Pressione **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows)

---

## 🎯 Teste 1: Página de Usuários

### Passos:
1. Login como super admin
2. **Admin → Empresas → Impersonar** uma empresa
3. Ir em **Configurações → Usuários**

### Resultado Esperado:
**✅ Deve funcionar agora!**

Verifique no console:
```javascript
[UsersPage] Permission check: {
  active_role: "admin",
  roles: ["admin", "gestor", "tecnico"],
  is_elisha_admin: true,
  isAdmin: true  // ← Deve ser TRUE
}
```

### ❌ Se ainda der erro:
Me mostre o log `[UsersPage] Permission check` do console!

---

## 🎯 Teste 2: Link Super Admin

### Passos:
1. Ainda no modo impersonation
2. Olhe a sidebar (menu lateral)
3. **Procure o botão "Super Admin"** (com ícone de escudo 🛡️)

### Resultado Esperado:

#### ✅ Caso 1: Botão aparece
```javascript
[AppSidebar] Debug: {
  is_elisha_admin: true,  // ← TRUE
  impersonating: "abc-123...",
  ...
}
```
**Ação:** Clique no botão "Super Admin"

**Deve:** Redirecionar para `/admin/companies` e ver:
```javascript
[AppSidebar] Link Super Admin clicado
```

#### ❌ Caso 2: Botão NÃO aparece
```javascript
[AppSidebar] Super Admin NÃO visível - is_elisha_admin: false
```
**Problema:** O perfil não está carregando `is_elisha_admin` corretamente

**Me mostre o log completo de `[AppSidebar] Debug`**

---

## 🔍 Logs Importantes

### 1. Permissão de Usuários
```javascript
[UsersPage] Permission check: {
  active_role: "admin",
  roles: [...],
  is_elisha_admin: true,
  isAdmin: true
}
```

### 2. Sidebar Debug
```javascript
[AppSidebar] Debug: {
  active: "admin",
  roles: ["admin", "gestor", "tecnico"],
  profile_active_role: "admin",
  is_elisha_admin: true,  // ← Deve ser TRUE
  impersonating: "abc-123...",
  jwt_metadata: {...}
}
```

### 3. Papel Ativo
```javascript
[getActiveRole] Debug: {
  fromAppMeta: "admin",
  fromProfile: "admin",
  result: "admin"
}
```

---

## 📊 Cenários de Teste

### Cenário 1: Super Admin SEM impersonation
1. Login como super admin
2. NÃO impersonar nenhuma empresa
3. Clicar em "Super Admin" na sidebar
4. **Deve:** Ir para `/admin/companies` ✅

---

### Cenário 2: Super Admin COM impersonation
1. Login como super admin
2. Impersonar uma empresa
3. Verificar se botão "Super Admin" ainda aparece na sidebar
4. **Deve:** Aparecer e funcionar ✅

---

### Cenário 3: Acessar Usuários enquanto impersona
1. Super admin impersonando empresa
2. Ir em **Configurações → Usuários**
3. **Deve:** Ver a lista de usuários (não mostrar "Acesso negado") ✅

---

## 🐛 Troubleshooting

### Problema: "Acesso negado" na página de usuários

**Verifique o log:**
```javascript
[UsersPage] Permission check: {
  active_role: "tecnico",  // ← Errado! Deveria ser "admin"
  roles: ["admin", ...],
  is_elisha_admin: true,
  isAdmin: false  // ← FALSE = problema!
}
```

**Causa:** O `active_role` está errado.

**Solução:** Trocar de papel usando o RoleSwitcher para "Admin"

---

### Problema: Botão "Super Admin" não aparece

**Verifique o log:**
```javascript
[AppSidebar] Debug: {
  is_elisha_admin: false,  // ← FALSE = problema!
  ...
}
```

**Causa:** O perfil não está carregando `is_elisha_admin`.

**Solução:** 
1. Verificar no banco de dados se o usuário tem `is_elisha_admin = true`
2. Fazer logout e login novamente

---

### Problema: Link "Super Admin" não funciona (não navega)

**Verifique o log ao clicar:**
```javascript
[AppSidebar] Link Super Admin clicado
```

**Se o log não aparecer:** O clique não está sendo capturado.

**Se o log aparecer mas não navega:** Problema de roteamento.

---

## 📸 Me Envie

Tire print ou copie e cole os seguintes logs:

1. **Console completo** depois de recarregar
2. **Log ao tentar acessar Usuários:**
   ```
   [UsersPage] Permission check: {...}
   ```
3. **Log da sidebar:**
   ```
   [AppSidebar] Debug: {...}
   ```

---

## 🎯 Checklist Rápido

- [ ] Hard reload (Cmd+Shift+R)
- [ ] Console aberto (F12)
- [ ] Impersonar uma empresa
- [ ] Acessar Configurações → Usuários
- [ ] Ver se funciona ou mostra "Acesso negado"
- [ ] Ver se botão "Super Admin" aparece na sidebar
- [ ] Clicar em "Super Admin"
- [ ] Ver se navega para /admin/companies

---

**Próximo passo:** Faça os testes e me mostre os logs que aparecem!

