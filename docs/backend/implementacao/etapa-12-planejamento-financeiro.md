# Etapa 12 — Planejamento financeiro

Data: 2026-11-21 · Itens: FIN-PLN-01..08

## Objetivo

Responder, ao abrir o sistema: **quanto vou receber este mês, quanto preciso pagar, quanto vai sobrar, quanto tenho guardado e quanto falta para a meta**. Ver os próximos meses antecipadamente e simular mudanças sem tocar nos dados reais.

O fluxo de caixa (lançamentos) continua como era. O planejamento é uma camada à parte, no mesmo módulo `finance`, que olha para a frente.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| FIN-PLN-01 | Compromissos com histórico: salário, freelances, empréstimos, contas fixas, assinaturas e gastos extras. Alteração "a partir de um mês", valor de um mês só, suspensão e reativação, pagamentos | `Commitment`, `CommitmentService`, `/finance/commitments` |
| FIN-PLN-02 | Cartões, faturas (CSV ou à mão), transações, compras parceladas e classificação de assinaturas | `CreditCard`, `card-csv.ts`, `/finance/cards` |
| FIN-PLN-03 | Reservas com movimentações (aporte, retirada, a receber), reserva protegida e metas com contribuição de terceiros | `ReserveFund`, `/finance/reserves` |
| FIN-PLN-04 | Projeção mês a mês com linhas por conta, certeza de cada valor, sobra, sobra acumulada, saldo da conta, reservas, dívidas, o que termina e quanto libera, faixas de salário e risco | `projection/plan-projector.ts`, `GET /finance/planning/projection` |
| FIN-PLN-05 | Simulador: operações aplicadas numa cópia do plano; confirmar aplica as mesmas operações e salva | `scenario.ts`, `POST /finance/planning/simulate` e `/scenario/apply` |
| FIN-PLN-06 | Visão geral do mês, metas e relatório (aumentou, diminuiu, terminou, planejado × realizado com o plano guardado quando o mês abriu) | `plan-insights.ts`, `month-report.ts`, `/overview`, `/report` |
| FIN-PLN-07 | Fechamento de meses: nada muda num mês fechado | `MonthLock`, `PlanningSettings.closeThrough` |
| FIN-PLN-08 | Telas: Planejamento, Próximos meses, Simulador, Compromissos, Cartões, Reservas e metas, e Gastos | `features/finance/components/planning/` |

## Regras (RN-PLN)

| Regra | O que garante | Onde |
|---|---|---|
| RN-PLN-01 | Meses até o último fechado não aceitam alteração: pagamentos, faturas, valores do mês, alterações "a partir de", compras e movimentações | `MonthLock.assertOpen` |
| RN-PLN-02 | Dívida com total termina sozinha quando os pagamentos chegam nele; a última parcela é o que falta. Total + último mês que somam mais que o total são recusados | `Commitment.buildSchedule`, `assertWithinTotal` |
| RN-PLN-03 | Parcelamento sem juros soma exatamente o total (centavos que sobram vão na 1ª parcela); com juros, as parcelas nunca somam menos que o total | `CreditCard.validPurchase`, `purchaseInstallment` |
| RN-PLN-04 | Todo valor diz se é confirmado, estimado ou desconhecido | `Certainty` em cada linha |
| RN-PLN-05 | Nada é contado duas vezes: compras ficam dentro da fatura; assinatura cobrada no cartão aparece mas não soma; compra parcelada registrada só soma em meses sem fatura importada; o que sai é o pagamento da fatura | `cardMonth`, `Commitment.counted` |
| RN-PLN-06 | Mudar um valor a partir de um mês nunca reescreve os meses anteriores | `CommitmentChange` |
| RN-PLN-07 | Importar o mesmo CSV de novo não duplica: a chave é cartão + competência + data + título normalizado + valor + ocorrência. Duas compras iguais no mesmo arquivo continuam duas (ocorrência 1 e 2) | `transactionKey` + índice único `card_transaction_dedupe_idx` |
| RN-PLN-08 | Reserva não é saldo de conta. Aporte da conta é transferência, não despesa. Dinheiro a receber não conta como disponível. Retirada confirmada nunca deixa a reserva negativa | `ReserveFund`, `accountTransfers` |
| RN-PLN-09 | O simulador nunca grava; confirmar aplica as mesmas operações com as mesmas regras | `applyScenario` sobre cópia × sobre o estado carregado |

## Modelo de caixa

Para cada mês, cada linha tem `planned` (o plano) e `amount` (o pagamento se houver, senão o plano):

- `income.total = Σ amount` das receitas; `income.expected` e `income.received` separados.
- `expenses.total = Σ amount` das despesas contadas; `paid`, `toPay`, `confirmed`, `estimated` separados.
- `balance = income.total − expenses.total`.
- `availableToSave = max(0, balance − safetyMargin)`. A tela mostra também `balance − safetyMargin` como "livre para gastar mantendo a margem" (ex.: margem de R$ 1.000).
- `accumulated` soma `balance − aportes da conta` desde o primeiro mês da tela.
- `accountBalance` só existe se o saldo da conta for informado (Configurar). No mês do saldo, só o que ainda está em aberto depois daquele dia mexe nele.

## Cartões e faturas

- A competência da fatura é o mês do vencimento (`Nubank_2027-01-19.csv` → jan/27). A tela tira o vencimento do nome do arquivo.
- Fatura importada é a verdade do mês. Sem fatura, o mês do cartão é: parcelas futuras **inferidas** de faturas importadas (ex.: "2/3" em janeiro → "3/3" em fevereiro, estimada) + compras parceladas registradas + previsão mensal do cartão (a partir do mês configurado). Sem nada disso, a linha é R$ 0 **desconhecido**, não fatura zerada.
- Uma compra parcelada registrada que não aparece na fatura importada do mês gera um aviso.
- Despesa cadastrada por fora com mesmo valor e nome parecido com uma transação de fatura importada gera aviso de possível duplicidade.

## Cenário de referência

`planning.spec.ts` reproduz as tabelas do pedido com CSVs no formato do Nubank (nomes trocados, valores reais): totais 3.212,12 · 2.427,73 · 2.287,90 · 1.645,80 · 1.645,80 e a sobra de cada faixa de salário (R$ 3.000 a R$ 4.000).

## Banco

`V22__financial_planning.sql`: `planning_settings`, `commitment` (+ `commitment_change`, `commitment_month`, `commitment_payment`), `credit_card` (+ `card_statement`, `card_transaction`, `card_purchase`), `reserve_fund` (+ `reserve_movement`) e `month_snapshot`. Dinheiro em `numeric(14,2)`, centavos inteiros no código. Filhos são regravados junto com o agregado.

## Frontend

As telas de planejamento falam direto com a API (`features/finance/lib/planning-api.ts`), como as conexões bancárias: a projeção, a importação e o simulador dependem das regras do domínio no backend. No modo local, mostram como ligar a API.

## Testes

`planning.spec.ts` (42 testes do domínio, incluindo as tabelas de referência) e `test/planning.e2e-spec.ts` (HTTP até o PostgreSQL: importação duplicada, histórico, simulação sem gravar, inferência, reservas, relatório e meses fechados).

## Gastos unificados (RF-PLN-08)

A tela Gastos mostrava só os lançamentos do fluxo de caixa, então ficava em R$ 0 com o plano todo cadastrado. Agora `GET /finance/planning/expenses` junta, num mês:

- as linhas de despesa da projeção (compromissos, faturas e compras parceladas), com a mesma regra de Próximos meses (RN-PLN-10);
- compromissos suspensos no mês, como **cancelado** e sem somar;
- lançamentos de saída do mês, como **realizado**. Transferências e pagamentos de fatura (por categoria ou descrição) aparecem, mas não somam (RN-PLN-11).

Situação de cada item: pago (há pagamento), a pagar (valor confirmado), previsto (estimado ou desconhecido), realizado (lançamento) ou cancelado. Assinaturas no cartão continuam visíveis, sem somar, porque já estão na fatura. As compras de uma fatura são mostradas como composição dela, nunca somadas de novo. A regra está em `domain/planning/expense-breakdown.ts`, com testes em `expense-breakdown.spec.ts`.

Na tela: resumo, conciliação com Próximos meses, categorias que abrem, lista com busca, filtros e ordem, e faturas dos cartões. Cada linha de despesa, ali e no Planejamento, pode ser excluída: o compromisso, a compra parcelada, a fatura do mês ou o lançamento. Em Próximos meses, cada mês do cabeçalho leva aos gastos daquele mês.

## Limitações conhecidas

- Pagamentos de fatura com valor negativo no CSV (estornos) entram na soma da fatura como vierem.
- O planejamento não cria lançamentos no fluxo de caixa: são duas visões separadas. Gastos as mostra juntas.
- Juros, amortização e tarifas de empréstimo não são separados: o compromisso só tem o valor da parcela.
