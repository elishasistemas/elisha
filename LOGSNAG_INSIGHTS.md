LogSnag — Eventos e Insights

Como está configurado
- Envio de eventos via servidor: `src/lib/logsnag.ts` (HTTP API). 
- Rota cliente→servidor: `src/app/api/telemetry/logsnag/route.ts` com allowlist de canais.
- Eventos instrumentados: auth, invites, checklist, orders, clients, technicians, users, pwa.
- Snapshot/Insights: `POST /api/metrics/snapshot` calcula contagens e atualiza insights + emite evento `insights · Snapshot Updated`.

Variáveis de ambiente
- `LOGSNAG_TOKEN` — token da API
- `LOGSNAG_PROJECT` — slug do projeto
- `LOGSNAG_ALLOW_CLIENT=true` — habilita eventos do cliente
- `CRON_SECRET` — segredo opcional para proteger `/api/metrics/snapshot`

Como gerar insights imediatos
1) Reinicie o app com as envs preenchidas. 
2) Gere ações no sistema (login, criar cliente, criar OS etc.).
3) Rode o snapshot (local):
   - `curl -X POST http://localhost:3000/api/metrics/snapshot` 
   - ou com segredo: `curl -X POST http://localhost:3000/api/metrics/snapshot -H "Authorization: Bearer $CRON_SECRET"`

Métricas publicadas no snapshot
- Clients · Total
- Technicians · Active
- Orders · Today
- Orders · Open
- Orders · Closed

Eventos por canal (para gráficos/time-series)
- `orders`
  - Order Created, Order Updated, Order Deleted, Checklist Linked
- `clients`
  - Client Created, Client Updated, Client Deleted, Equipments Added
- `technicians`
  - Technician Created, Technician Updated, Technician Activated/Deactivated, Technician Deleted
- `users`
  - User Updated, User Deleted
- `auth`
  - Login Success, Signup Success, Invite Accepted
- `invites`
  - Invite Created, Elisha Admin Invited
- `checklist`
  - Checklist Started, Checklist Answered
- `pwa`
  - SW Registered, Install Prompt, PWA Installed
- `insights`
  - Snapshot Updated (inclui tags com métricas)

Sugestões de insights no painel do LogSnag
- Contagem diária
  - `orders · Order Created` — Count over time (últimos 7/30 dias)
  - `clients · Client Created` — Count over time
  - `technicians · Technician Created` — Count over time
  - `auth · Login Success` — Count over time
- “Número atual” (via snapshot)
  - `Clients · Total`
  - `Technicians · Active`
  - `Orders · Open`
  - `Orders · Closed`

Agendando snapshot na Vercel (opcional)
- Configure um cron (Vercel Scheduled Functions) chamando `POST /api/metrics/snapshot` a cada 15 minutos ou 1 hora.
- Inclua `Authorization: Bearer $CRON_SECRET` se configurado.

Observações
- A integração usa HTTP API — se preferir a SDK oficial, podemos trocar facilmente.
- Falhas de envio não interrompem o fluxo do app; são registradas como warnings no servidor.

