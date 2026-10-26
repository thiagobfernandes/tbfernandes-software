# Contrato da API

Versão 0.2 · 2026-10-26 · O contrato executável é o OpenAPI em `http://localhost:8080/v3/api-docs` (Swagger UI em `/swagger-ui.html`, desligado no perfil `prod`).

## Convenções

- Base: `/api/v1`. JSON em camelCase, enums em minúsculas (`"in_progress"`), datas ISO 8601 (`2026-10-26`), meses `YYYY-MM`.
- Ids são UUID v7. O corpo de resposta tem o mesmo formato dos tipos do frontend: `{ "id": "...", ...campos }`.
- `POST` cria e responde `201` com `Location`; `PUT` substitui os campos editáveis; `PATCH` muda uma parte (status, indicador); `DELETE` responde `204`.
- **Paginação (PLT-09)**: toda lista aceita `page` (a partir de 0) e `size` (1 a 200, padrão 50). Sem `page`, a lista vem inteira. Os totais vão nos cabeçalhos `X-Total-Count`, `X-Page` e `X-Page-Size`, e o corpo continua um array.
- **Autenticação**: no modo `single-user` não há login. No modo `session`, toda rota fora de `/auth/*` exige sessão (401 sem ela), e toda escrita exige o cabeçalho `X-XSRF-TOKEN` com o valor do cookie `XSRF-TOKEN`. Ver [arquitetura](arquitetura.md#autenticação-etapa-6).
- Erros em Problem Details (RFC 9457):

| Status | Quando | Exemplo |
|---|---|---|
| 400 | campo inválido ou ausente | `{ "status": 400, "detail": "Invalid request", "errors": { "name": ["must not be blank"] } }` |
| 401 | sem sessão, ou login errado | `{ "status": 401, "detail": "E-mail or password is wrong" }` |
| 404 | registro não existe ou é de outro dono | `{ "status": 404, "detail": "Task 0192... not found" }` |
| 409 | conflito de estado ou de versão | empresa com projetos, versão desatualizada |
| 422 | regra de negócio | `{ "status": 422, "detail": "Unblock the task before completing it", "rule": "RN-07" }` |

## Identity

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET | `/auth/session` | `{ mode, signedIn }`; também grava o cookie `XSRF-TOKEN` | IDN-01 |
| POST | `/auth/login` | `{ email, password }` → 204 e cookie de sessão | IDN-01 |
| POST | `/auth/logout` | encerra a sessão | IDN-01 |
| GET / PUT | `/me` | perfil: nome, e-mail, idioma, fuso | IDN-02 |
| PUT | `/me/password` | `{ current, next }` (RN-25) | IDN-03 |

## Work

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET / POST | `/companies` | lista, cria | WRK-01 |
| GET / PUT / DELETE | `/companies/{id}` | detalhe, edita, exclui (409 se tiver projetos, RN-01) | WRK-01, WRK-11 |
| GET | `/projects?companyId=` | lista, filtro por empresa | WRK-02 |
| POST | `/projects` | cria | WRK-02 |
| GET / PUT / DELETE | `/projects/{id}` | detalhe, edita, exclui (as tarefas ficam sem projeto) | WRK-02, WRK-11 |
| GET | `/tasks?projectId=&status=&dueFrom=&dueTo=&overdue=` | lista com filtros combináveis | WRK-03, WRK-06 |
| POST | `/tasks` | cria | WRK-03 |
| GET / PUT / DELETE | `/tasks/{id}` | detalhe, edita, exclui | WRK-03 |
| PATCH | `/tasks/{id}/status` | `{ status }`, usado pelo quadro (RN-06, RN-07) | WRK-04 |
| GET | `/dashboard/summary` | contadores do painel | WRK-07 |

## Knowledge

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET | `/notes?q=&tag=` | lista e busca | KNW-01, KNW-04 |
| POST | `/notes` | cria (`projectIds` e `taskIds` validados) | KNW-01, KNW-03 |
| GET / PUT / DELETE | `/notes/{id}` | detalhe, edita, exclui | KNW-01 |
| GET | `/snippets?q=&language=&tag=` | lista e busca | KNW-02, KNW-04 |
| POST | `/snippets` | cria (código guardado como enviado, RN-11) | KNW-02 |
| GET / PUT / DELETE | `/snippets/{id}` | detalhe, edita, exclui | KNW-02 |
| GET / POST | `/methods` | lista, cria | KNW-07 |
| GET / PUT / DELETE | `/methods/{id}` | detalhe, edita, exclui | KNW-07 |
| GET | `/graph` | nós e arestas do grafo (servido pelo módulo assistant, ver abaixo) | KNW-05 |

## Goals

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET / POST | `/goals` | lista, cria (submeta por `parentId`, sem ciclo, RN-19) | GOL-01, GOL-02 |
| GET / PUT / DELETE | `/goals/{id}` | detalhe, edita, exclui com submetas e marcos (RN-09) | GOL-01 |
| PATCH | `/goals/{id}/indicator` | `{ current }` (RN-21) | GOL-01 |
| GET | `/goals/{id}/links` | projetos, tarefas, estudos e compras ligados à meta | GOL-04 |
| GET | `/milestones?goalId=` | lista | GOL-03 |
| POST | `/milestones` | cria | GOL-03 |
| PUT / DELETE | `/milestones/{id}` | edita, exclui | GOL-03 |

## Learning

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET / POST | `/studies` | lista, cria | LRN-01 |
| GET / PUT / DELETE | `/studies/{id}` | detalhe, edita, exclui | LRN-01 |
| GET | `/materials?studyId=` | lista | LRN-02 |
| POST | `/materials` | cria | LRN-02 |
| GET / PUT / DELETE | `/materials/{id}` | detalhe, edita, exclui | LRN-02 |
| GET / POST | `/skills` | lista, cria (nível de 1 a 5, RN-13) | LRN-03 |
| GET / PUT / DELETE | `/skills/{id}` | detalhe, edita, exclui | LRN-03 |
| GET | `/certifications?expiringWithinDays=` | lista; com o filtro, só as que vencem na janela | LRN-04, LRN-06 |
| POST | `/certifications` | cria (RN-14) | LRN-04 |
| GET / PUT / DELETE | `/certifications/{id}` | detalhe, edita, exclui | LRN-04 |
| GET / POST | `/educations` | lista, cria | LRN-05 |
| GET / PUT / DELETE | `/educations/{id}` | detalhe, edita, exclui | LRN-05 |

## Finance

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET | `/finance/entries?month=&scope=` | lançamentos do mês, por escopo `personal` ou `business` | FIN-01 |
| POST | `/finance/entries` | cria | FIN-01 |
| GET / PUT / DELETE | `/finance/entries/{id}` | detalhe, edita, exclui | FIN-01 |
| GET | `/finance/cash-flow?month=&months=6&scope=` | totais do mês, por categoria, e série dos últimos meses (RN-12) | FIN-02 |
| GET / POST | `/finance/purchases` | metas de compra (RN-17, RN-18) | FIN-03 |
| GET / PUT / DELETE | `/finance/purchases/{id}` | detalhe, edita, exclui | FIN-03 |
| GET | `/finance/purchases/{id}/projection` | quanto falta e quando a compra cabe no orçamento | FIN-04 |

Open Finance (Pluggy) continua em aberto. As rotas planejadas são `POST /finance/connections/token`, `/finance/connections` e `POST /finance/webhooks/pluggy` (épico FIN-OF).

## Contacts

| Método | Rota | Uso | Item |
|---|---|---|---|
| GET | `/contacts?dueWithinDays=` | lista; com o filtro, só quem tem próximo contato na janela | CTC-01, CTC-04 |
| POST | `/contacts` | cria (`companyId` ou `companyName`, nunca os dois, RN-23) | CTC-01 |
| GET / PUT / DELETE | `/contacts/{id}` | detalhe, edita, exclui junto com as interações | CTC-01 |
| GET | `/interactions?contactId=` | lista | CTC-02 |
| POST | `/interactions` | cria | CTC-02 |
| PUT / DELETE | `/interactions/{id}` | edita, exclui | CTC-02 |
| POST | `/interactions/{id}/follow-up` | `{ dueDate }` → cria a tarefa de follow-up, uma vez só (RN-24) | CTC-03 |

## Assistant

| Método | Rota | Uso | Item |
|---|---|---|---|
| POST | `/assistant/questions` | `{ question }` (até 500 caracteres) → resposta com referências | AST-01, AST-02 |
| GET | `/graph` | `{ nodes: [{ id, kind, label, href }], edges: [{ source, target }] }` | KNW-05 |

Exemplo de resposta do assistente. O formato é o de `web/src/features/assistant/lib/answer.ts`, mais o campo `source`:

```json
{
  "text": "You have 1 overdue task:\n- **Fix invoice totals**, overdue 2d (blocked)\n\nStart with blocked items: they usually need a message, not work.",
  "references": [{ "kind": "Task", "label": "Fix invoice totals", "href": "/tasks?q=Fix%20invoice%20totals" }],
  "source": "rules"
}
```

`source` vale `rules` enquanto nenhum modelo de IA estiver configurado (`TBF_ASSISTANT_MODEL=none`). Com um modelo, passa a valer `model`, mas as referências continuam sendo as que as regras encontraram.

## Exemplo de tarefa

Mesmo formato de `web/src/features/tasks/types/task.ts`:

```json
{
  "id": "0192f1a2-...",
  "title": "Investigate telemetry ingestion alert",
  "projectId": "9cc39cfc-...",
  "status": "in_progress",
  "priority": "urgent",
  "tag": "Backend",
  "startDate": "2026-10-22",
  "dueDate": "2026-10-23",
  "checklist": { "done": 2, "total": 5 },
  "checklistItems": [],
  "goalId": null,
  "completedAt": null
}
```

## Ainda não existe na API

| Rota | Motivo | Item |
|---|---|---|
| exportar e importar JSON | fica no frontend, que já tem o formato `AppData` e lê e grava pela API | IDN-04, IDN-05 |
| Open Finance | épico em aberto | FIN-OF-* |
