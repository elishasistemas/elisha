# Roteiro de Testes E2E para Agente (ChatGPT)

Objetivo: validar, ponta a ponta, os fluxos principais do Elisha Admin para todos os perfis (elisha_admin, admin, tecnico), incluindo onboarding, convites, autenticação, navegação, permissões (RLS), execução de OS e checklists, além de PWA (instalação, offline e atualização de ícone). Documentar qualquer bug ou atrito de usabilidade segundo heurísticas de Nielsen e princípios de Dieter Rams.

## Pré‑requisitos
- App rodando em `http://localhost:3000` (ou a URL informada).
- Supabase com migrações aplicadas e variáveis `.env.local` válidas.
- Perfil `elisha_admin` criado (ver `scripts/create-elisha-admin.sql`).
- Dados mínimos: 1 empresa, 1 usuário admin da empresa, 1 técnico (pode ser criado via convite durante o teste).

## Regras do teste
- Siga os passos em ordem. Se um problema não bloquear a continuação, anote e prossiga.
- Registre evidências (print da tela, mensagem de erro do console/network, URL).
- Use as seções “Critérios de sucesso” para marcar cada etapa como OK/FAIL.
- Sempre que trocar de perfil, valide o menu lateral, conteúdos e permissões.

## Severidades e decisão de avanço
- Bloqueante: impede o fluxo. Pare, registre e tente contorno simples. Se não houver, pule para próximo fluxo.
- Alta: causa erro grave, mas permite seguir depois de recarregar/relogar. Registre e continue.
- Média: atrito de usabilidade ou bug com alternativa. Registre e continue.
- Baixa: melhoria/ajuste visual/texto. Registre e continue.

## Template de registro (copiar/colar)
- ID: AGT-YYYYMMDD-XXX
- Título: curto, descritivo
- Severidade: Bloqueante | Alta | Média | Baixa
- Passos para reproduzir: 1..n
- Esperado:
- Obtido:
- Evidências: screenshot, log console, request/response
- Heurística: [Nielsen-X] e/ou [Rams-Y] (ver abaixo)
- Contexto extra: dispositivo, navegador, perfil ativo

## Heurísticas para anotação
- Nielsen (10): Visibilidade do status; Correspondência com o mundo real; Controle e liberdade; Consistência; Prevenção de erros; Reconhecer vs lembrar; Flexibilidade/eficiência; Estética e minimalismo; Ajuda no reconhecimento, diagnóstico e correção de erros; Ajuda/documentação.
- Dieter Rams (10): Inovador; Útil; Estético; Compreensível; Discreto; Honesto; Durável; Detalhes precisos; Ecológico; Mínimo essencial.

---

## 1) Autenticação e Convites
1. Acessar `/login`.
2. Gerar convite para um novo usuário admin da empresa (se necessário) em `/settings/users` ou fluxo de convites disponível.
3. Seguir o link de convite (via UI ou URL gerada) e concluir `/signup` criando senha.
4. Fazer logout e login novamente para validar sessão.

Critérios de sucesso:
- Login sem erros; redireciona para `/dashboard` conforme perfil.
- Convite cria usuário com role correta.
- Tela de criação de senha aceita senhas válidas e rejeita fracas/inválidas.

Observações/Registros: …

## 2) Perfil Admin (empresa)
Entrar como admin da empresa.

Fluxos:
1. Dashboard `/dashboard`: cards e métricas carregam sem erro.
2. Clientes `/clients`: criar cliente, editar, listar.
3. Equipamentos `/equipments`: criar equipamento atrelado ao cliente.
4. Técnicos `/technicians`: listar, convidar técnico.
5. Ordens de Serviço `/orders`: criar OS, atribuir cliente/equipamento/técnico.
6. Checklists `/checklists`: visualizar modelos ou listas disponíveis.
7. Settings `/settings`:
   - Atualizar logo da empresa (URL/Upload). Ver se aparece no avatar/menu.
   - Gerenciar usuários (convidar/remover). 

Critérios de sucesso:
- CRUDs funcionam (criar/editar/listar) e persistem.
- OS criada aparece na listagem e possui vínculo correto.
- Logo atualizada reflete no layout (navbar/sidebar) após refresh ou sem.
- Sem acesso a rotas de super admin.

Observações/Registros: …

## 3) Perfil Técnico
Entrar como técnico.

Fluxos:
1. `/orders`: ver apenas OS atribuídas a ele.
2. Abrir OS e iniciar checklist (quando disponível): responder, salvar, concluir.
3. Tentar acessar rotas restritas (ex.: `/settings`, `/clients`): deve negar ou redirecionar.

Critérios de sucesso:
- Filtragem por RLS correta: técnico não vê dados de outras pessoas/empresas.
- Checklist salva respostas, calcula score e muda status conforme esperado.

Observações/Registros: …

## 4) Elisha Admin (Super Admin)
Entrar como `elisha_admin`.

Fluxos:
1. Acesso `/admin/*`: permitido.
2. Impersonation:
   - Iniciar impersonation de uma empresa (tela de empresas ou botão disponível).
   - Ver banner de impersonation e `RoleSwitcher`.
   - Alternar roles (admin/tecnico) durante impersonation e validar menus/conteúdo.
   - Encerrar impersonation e voltar ao estado original.
3. Gerenciar usuários e empresas conforme permissões especiais.

Critérios de sucesso:
- `is_elisha_admin` permite acesso total às telas dedicadas.
- Impersonation altera o contexto da empresa e limita roles conforme especificado.
- Encerrar impersonation restaura o contexto original.

Observações/Registros: …

## 5) Proteções e RLS
Testes direcionados:
1. Com técnico, tentar acessar `/admin/*` e endpoints admin: negar acesso.
2. Com admin, tentar editar recursos de outra empresa (se possível simular via URL): negar acesso.
3. Alterar `active_role` via UI (RoleSwitcher) e validar que menu e permissões mudam na hora.

Critérios de sucesso:
- Policies RLS aplicadas corretamente em todas as entidades chave (empresas, clientes, equipamentos, OS, checklists, usuários).
- `active_role` influencia query/rotas.

Observações/Registros: …

## 6) PWA e Offline
Fluxos:
1. Instalação:
   - Android/Chrome: banner “Instalar” aparece; app instala e abre em modo standalone.
   - iOS/Safari: seguir instruções de “Adicionar à Tela de Início”.
2. Ícone e nome:
   - Verificar qualidade do ícone e recorte (maskable) e título.
3. Atualizações:
   - Publicar mudança pequena (já feito: versionamento de ícones). Reabrir PWA e validar nova versão.
4. Offline:
   - Desconectar rede e tentar navegar: ver fallback `offline.html` em navegações.

Critérios de sucesso:
- SW registrado, `start_url` abre o app e não uma imagem.
- Ícones corretos (192/512/maskable/Apple) e atualizam sem reinstalar no Android.
- Fallback offline funciona para navegações.

Observações/Registros: …

## 7) UX Heuristics Sweep
Percorra as principais telas (Login, Dashboard, Clients, Equipments, Orders, Checklists, Settings, Admin/*, Profile) e avalie:
- Consistência visual e de linguagem; feedbacks rápidos; estados de carregamento e erro claros.
- Prevenção de erros (desabilitar ações inválidas, validações); mensagens úteis.
- Hierarquia e foco; acessibilidade básica (labels, contraste, foco visível).

Critérios de sucesso:
- Sem bloqueios; problemas anotados e classificados.

Observações/Registros: …

---

## Dados e preparação sugeridos
- Criar 1 empresa “Acme Elevadores”.
- Usuários:
  - `elisha_admin`: criado via `scripts/create-elisha-admin.sql`.
  - `admin@acme.com`: via convite do elisha_admin ou existente.
  - `tecnico@acme.com`: via convite do admin.
- 1 cliente “Condomínio Central” + 1 equipamento vinculado.
- 1 OS atribuída ao técnico.

## Entrega do relatório final
- Listar todos os itens do template com IDs únicos.
- Tabela de métricas: total de casos OK/FAIL por fluxo e por perfil.
- Recomendações priorizadas (P1/P2/P3) com estimativa de impacto e esforço.

