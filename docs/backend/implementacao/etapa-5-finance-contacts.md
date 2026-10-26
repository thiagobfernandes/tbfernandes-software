# Etapa 5 — Finance manual e Contacts

Data: 2026-10-26 · Itens: FIN-01..04, CTC-01..04

## Objetivo

Lançamentos, fluxo de caixa e metas de compra com dados digitados à mão, e a rede de contatos com interações e follow-ups que viram tarefas. A integração Pluggy continua em aberto (épico FIN-OF), atrás da porta `OpenFinanceGateway`.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| FIN-01 | `/finance/entries?month=YYYY-MM&scope=`: CRUD de receitas e despesas; valor sempre positivo, em BRL com 2 casas; escopo pessoal ou empresa (RN-12). Lançamentos manuais têm `source = MANUAL`. | `FinanceEntry`, `FinanceService`, `FinanceController` |
| FIN-02 | `GET /finance/cash-flow?month=&months=6&scope=`: totais do mês, série dos meses anteriores e despesas por categoria, igual à tela. | `FinanceService.cashFlow`, `CashFlow` |
| FIN-03 | `/finance/purchases`: metas de compra; reservado nunca negativo (RN-18); comprada exige valor pago (RN-17). | `PurchaseGoal` |
| FIN-04 | `GET /finance/purchases/{id}/projection`: quanto falta, em quantos meses e se cumpre a data desejada. Mesma regra de `web/src/features/finance/lib/projection.ts`. | `PurchaseGoal.project` |
| CTC-01 | `/contacts`: CRUD; empresa cadastrada (validada via `WorkLookup`) ou só o nome, nunca os dois (RN-23); e-mail em minúsculas; especialidades sem repetição. | `Contact`, `ContactService` |
| CTC-02 | `/interactions?contactId=`: CRUD; excluir o contato exclui as interações (RN-10). | `Interaction` |
| CTC-03 | `POST /interactions/{id}/follow-up {title?, dueDate}`: cria uma tarefa `todo` pelo `FollowUpTasks` do Work e grava o id; uma por interação (RN-24). | `ContactService.createFollowUp` |
| CTC-04 | `GET /contacts?dueWithinDays=7`: contatos com próximo contato vencido ou na janela. | `ContactService.contacts` |
| — | Excluir empresa desvincula contatos; excluir tarefa limpa o follow-up da interação (ouvintes de eventos). | `WorkEventsListener` |
| — | `GET /goals/{id}/links` agora inclui as compras ligadas à meta, via `FinanceLookup`. | `GoalLinksService` |

## Dependências entre módulos depois desta etapa

```
goals ──▶ work, learning, finance
knowledge ──▶ work
contacts ──▶ work
finance, learning, work ──▶ (só shared)
```

Sem ciclos: o teste `ArchitectureTests.modulesOnlyUseEachOthersPublicApi` continua verde.

## Decisões

- **Lançamento recorrente é só uma marca**, como no frontend: não gera lançamentos futuros automaticamente. Gerar recorrências é um item futuro, se fizer falta.
- **Fluxo "todos os escopos" soma tudo** e o frontend já avisa que transferências da empresa para a pessoa contam duas vezes. A API devolve `scope: "all"` para a tela saber.
- **Follow-up pela API pública do Work**: o módulo contacts nunca grava em `work.task`; ele chama `FollowUpTasks`, que aplica as regras de tarefa.

## Testes

`FinanceApiIntegrationTests` (3) e `ContactsApiIntegrationTests` (3). Suíte: 32 testes passando.
