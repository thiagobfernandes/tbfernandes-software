# Etapa 2 — Work completo, CI e OpenAPI

Data: 2026-10-26 · Itens: PLT-06, PLT-10, PLT-12, WRK-06, WRK-07, WRK-08, WRK-09, WRK-11

## Objetivo

Fechar o módulo Work na API para que as telas de empresas, projetos, tarefas e o painel possam sair do armazenamento simulado, e colocar o build sob CI.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| WRK-06 | `GET /tasks` aceita `dueFrom`, `dueTo` e `overdue=true` (abertas com prazo antes de hoje). Os filtros viraram uma `Specification` do JPA, então combinar filtros não exige uma query nova. | `TaskController`, `TaskPersistenceAdapter` |
| WRK-07 | `GET /dashboard/summary`: tarefas abertas, atrasadas, bloqueadas, vencendo hoje, concluídas na semana (desde segunda), projetos e empresas ativos. | `WorkSummaryService`, `DashboardController` |
| WRK-08 | API pública do módulo: `WorkLookup` (existência e cópias leves de projetos/tarefas) e `FollowUpTasks` (criar tarefa a partir de outro módulo). | `work/WorkLookup.java`, `work/FollowUpTasks.java`, `WorkLookupService` |
| WRK-09 | Eventos `TaskDeleted`, `ProjectDeleted` e `CompanyDeleted`, publicados na mesma transação da exclusão. | `work/*Deleted.java`, serviços |
| WRK-11 | `DELETE /companies/{id}` (409 se tiver projetos) e `DELETE /projects/{id}` (as tarefas ficam, sem projeto). | `CompanyService`, `ProjectService` |
| PLT-10 | `Conflict` (409) para regras de estado e para conflito de versão otimista. | `shared/domain/Conflict`, `ApiExceptionHandler` |
| PLT-12 | Título, versão e descrição no OpenAPI. | `OpenApiConfig` |
| PLT-06 | GitHub Actions: `./mvnw verify` (com Testcontainers) e `npm ci`, `lint`, `build` do frontend. | `.github/workflows/ci.yml` |
| — | Relógio da aplicação no fuso do usuário (`tbf.time-zone`, padrão `America/Sao_Paulo`), para "hoje" e "semana" baterem com a tela. | `TimeConfig` |

## Decisões

- **RN-01 revisada para seguir o frontend**: o frontend já permite excluir empresa sem projetos e excluir projeto mantendo as tarefas. A API faz o mesmo. Ver [requisitos](../requisitos.md#3-regras-de-negócio).
- **Direção das dependências entre módulos**: `work` não depende de nenhum módulo. Quem precisa de dados de trabalho (knowledge, contacts, goals, assistant) usa `WorkLookup` ou escuta os eventos. Por isso `work` guarda `goal_id` sem validar: validar exigiria `work → goals`, e `goals` já depende de `work` (o Spring Modulith recusa ciclos).
- **Painel calculado na hora**: com o volume de um usuário, somar em memória é mais simples que manter contadores. Se passar de alguns milhares de tarefas, vira consulta agregada.

## Testes

`WorkApiIntegrationTests` ganhou três cenários: exclusão de empresa com e sem projetos, exclusão de projeto mantendo a tarefa, filtro de atrasadas e o resumo do painel. Total da suíte: 15 testes, todos passando.

## Como verificar

```bash
cd api && ./mvnw spring-boot:run
curl -s localhost:8080/api/v1/dashboard/summary
curl -s "localhost:8080/api/v1/tasks?overdue=true"
```
