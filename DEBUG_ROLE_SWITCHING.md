# 🐛 Debug - Troca de Papéis no Modo Impersonation

## 🔍 O que foi adicionado

Logs detalhados para identificar por que o menu não atualiza após trocar de papel.

---

## 🧪 Teste Agora

### Passo 1: Abrir Console
1. Pressione **F12** (ou **Cmd+Option+I** no Mac)
2. Aba **Console**
3. Limpar console (ícone 🚫)

### Passo 2: Recarregar Página
1. Pressione **Cmd+Shift+R** (Mac) ou **Ctrl+Shift+R** (Windows)
2. Isso força reload sem cache

### Passo 3: Ver Logs Atuais
Procure por:
```
[getActiveRole] Debug: {...}
[AppSidebar] Debug: {...}
```

**Me diga o que aparece nesses logs!** Especialmente:
- `active`: qual papel está detectado?
- `fromAppMeta`: o que vem do JWT?
- `fromProfile`: o que vem do banco?

### Passo 4: Trocar de Papel
1. No banner amarelo, clique no **RoleSwitcher**
2. Troque para **Admin** ou **Gestor**
3. Aguarde o reload automático (500ms)

### Passo 5: Ver Novos Logs
Depois do reload, procure novamente:
```
[getActiveRole] Debug: {...}
[AppSidebar] Debug: {...}
```

**Compare:** O `active` mudou? O `fromAppMeta` atualizou?

---

## 📊 Resultado Esperado

### ✅ Cenário Normal (Funcionando):
```javascript
[getActiveRole] Debug: {
  fromAppMeta: "admin",         // ← JWT atualizado
  fromUserMeta: undefined,
  fromProfile: "admin",         // ← Profile atualizado
  fromCookie: "admin",
  result: "admin"               // ← Papel final correto
}

[AppSidebar] Debug: {
  active: "admin",              // ← Admin detectado
  roles: ["admin", "gestor", "tecnico"],
  profile_active_role: "admin",
  jwt_metadata: { active_role: "admin", ... }
}

[AppSidebar] Modo admin/gestor - mostrando menu completo
```

**Resultado:** Menu completo aparece ✅

---

### ❌ Cenário com Problema (Bug):
```javascript
[getActiveRole] Debug: {
  fromAppMeta: "tecnico",       // ← JWT NÃO atualizou!
  fromUserMeta: undefined,
  fromProfile: "admin",         // ← Profile está correto
  fromCookie: "admin",
  result: "tecnico"             // ← Pegou o JWT antigo!
}

[AppSidebar] Debug: {
  active: "tecnico",            // ← Técnico detectado (errado!)
  roles: ["admin", "gestor", "tecnico"],
  profile_active_role: "admin", // ← Profile correto mas ignorado
  jwt_metadata: { active_role: "tecnico", ... }
}

[AppSidebar] Modo técnico detectado - filtrando menu
```

**Resultado:** Menu filtrado (só OS) ❌

**Causa:** JWT não foi atualizado pela API `update-claims`

---

## 🔧 Possíveis Problemas e Soluções

### Problema 1: JWT não atualiza
**Sintoma:** `fromAppMeta` continua com papel antigo

**Solução:** Verificar API `/api/auth/update-claims`

```bash
# Ver logs da API
tail -f .next/server.log | grep "update-claims"
```

---

### Problema 2: RefreshSession não funciona
**Sintoma:** `fromAppMeta` não muda mesmo depois do reload

**Solução:** Forçar hard refresh da session

Adicionar no `RoleSwitcher`:
```typescript
// Antes de recarregar, limpar cache
localStorage.removeItem('supabase.auth.token')
window.location.reload()
```

---

### Problema 3: Cache do navegador
**Sintoma:** Logs não aparecem ou são antigos

**Solução:** Hard reload
- Mac: **Cmd+Shift+R**
- Windows/Linux: **Ctrl+Shift+R**
- Ou fechar e reabrir o navegador

---

## 📸 Me Envie

**Tire print dos logs** e me mostre:

1. **Antes de trocar:**
   ```
   [getActiveRole] Debug: { ... }
   [AppSidebar] Debug: { ... }
   ```

2. **Depois de trocar (após reload):**
   ```
   [getActiveRole] Debug: { ... }
   [AppSidebar] Debug: { ... }
   ```

---

## 🎯 Checklist

- [ ] Console aberto (F12)
- [ ] Hard reload (Cmd+Shift+R)
- [ ] Ver logs [getActiveRole]
- [ ] Ver logs [AppSidebar]
- [ ] Trocar de técnico → admin
- [ ] Aguardar reload automático
- [ ] Ver novos logs
- [ ] Comparar `fromAppMeta` antes e depois

---

**Próximo passo:** Faça isso e me mostre o que aparece nos logs!

