# Contrato da API

Versão 0.1 · 2026-10-26 · O contrato executável é o OpenAPI em `http://localhost:8080/v3/api-docs` (Swagger UI em `/swagger-ui.html`).

## Convenções

- Base: `/api/v1`. JSON em camelCase, enums em minúsculas (`"in_progress"`), datas ISO 8601.
- `POST` cria e responde `201` com `Location`; `PUT` substitui os campos editáveis; `PATCH /{id}/status` muda só o status; `DELETE` responde `204`.
- Erros em Problem Details (RFC 9457):

```json
{ "status": 422, "title": "Business rule violated", "detail": "Unblock the task before completing it", "rule": "RN-07" }
{ "status": 400, "detail": "Invalid request", "errors": { "name": ["must not be blank"] } }
```

## Work (pronto)

| Método | Rota | Uso | Requisito |
|---|---|---|---|
| GET | `/companies` | lista empresas | RF-WRK-03 |
| GET | `/companies/{id}` | detalhe | RF-WRK-03 |
| POST | `/companies` | cria | RF-WRK-01 |
| PUT | `/companies/{id}` | edita, inclusive status | RF-WRK-02 |
| GET | `/projects?companyId=` | lista, filtro opcional por empresa | RF-WRK-06 |
| GET | `/projects/{id}` | detalhe | RF-WRK-06 |
| POST | `/projects` | cria | RF-WRK-04 |
| PUT | `/projects/{id}` | edita | RF-WRK-05 |
| GET | `/tasks?projectId=&status=` | lista com filtros | RF-WRK-11 |
| GET | `/tasks/{id}` | detalhe | RF-WRK-08 |
| POST | `/tasks` | cria | RF-WRK-07 |
| PUT | `/tasks/{id}` | edita (e status, se enviado) | RF-WRK-08 |
| PATCH | `/tasks/{id}/status` | muda status (quadro) | RF-WRK-09 |
| DELETE | `/tasks/{id}` | exclui | RF-WRK-10 |

Exemplo de tarefa (mesmo formato de `web/src/features/tasks/types/task.ts`):

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

## Planejado

| Módulo | Rotas | Backlog |
|---|---|---|
| Work | `GET /dashboard/summary`, filtros `dueFrom`, `dueTo`, `overdue` em `/tasks` | WRK-06, WRK-07 |
| Knowledge | `/notes`, `/snippets`, `/methods`, `GET /knowledge/graph`, `GET /knowledge/search?q=&tag=` | KNW-* |
| Goals | `/goals`, `/goals/{id}/milestones`, `PATCH /goals/{id}/indicator`, `GET /goals/{id}/links` | GOL-* |
| Learning | `/studies`, `/materials`, `/skills`, `/certifications`, `/educations` | LRN-* |
| Finance | `/finance/entries`, `GET /finance/cash-flow?month=`, `/finance/purchases` | FIN-* |
| Open Finance | `POST /finance/connections/token`, `/finance/connections`, `POST /finance/webhooks/pluggy` | FIN-OF-* |
| Contacts | `/contacts`, `/contacts/{id}/interactions`, `POST /contacts/{id}/interactions/{iid}/follow-up` | CTC-* |
| Assistant | `POST /assistant/questions` | AST-* |
| Identity | `POST /auth/login`, `POST /auth/logout`, `GET /me`, `GET /export`, `POST /import/local-storage` | IDN-* |
