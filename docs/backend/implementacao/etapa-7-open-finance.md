# Etapa 7 — Open Finance com Pluggy

Data: 2026-10-30 · Itens: FIN-OF-01..08

## Objetivo

Conectar bancos pela Pluggy e transformar as transações em lançamentos do fluxo de caixa, sem duplicar e sem atrapalhar quem usa só lançamentos manuais (RN-15).

## Decisões de escopo (FIN-OF-01)

| Pergunta | Decisão |
|---|---|
| Quais contas | Todas as contas da conexão, corrente e cartão |
| Quanto histórico | Janela móvel de 90 dias a cada sincronização (`OpenFinanceService.HISTORY_DAYS`). A importação é idempotente, então reler a janela não duplica (RN-16) e pega compras que só liquidam com o fechamento da fatura |
| Categoria | A da Pluggy, como vem (em inglês, ex.: `Transfers`). Categorização própria fica para depois |
| Pessoal ou empresa | Escolhido ao conectar e vale para tudo que aquele banco importar (RN-20) |
| Pendentes | Só transações liquidadas entram (RN-22). Pendentes incluem parcelas futuras e compras de fatura aberta |

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| FIN-OF-02 | `POST /auth` com a API key reutilizada por 110 minutos (vale 2 h) e renovada uma vez se a Pluggy recusar | `PluggyOpenFinanceGateway` |
| FIN-OF-03 | Token do widget e tela "Contas conectadas" com o `pluggy-connect-sdk` | `OpenFinanceController`, `connections-page.tsx` |
| FIN-OF-04 | Tabelas `bank_connection` e `bank_account`; registro idempotente da conexão | `V11__open_finance.sql`, `BankConnection` |
| FIN-OF-05 | Importação pela `GET /v2/transactions` com cursor. A rota antiga `GET /transactions` sai do ar depois de 2026-12-31 | `OpenFinanceService`, `PluggyOpenFinanceGateway` |
| FIN-OF-06 | `POST /api/v1/webhooks/pluggy` responde na hora e sincroniza depois do commit, por evento | `PluggyWebhookController`, `ConnectionSyncListener` |
| FIN-OF-07 | Contrato do adaptador com `MockRestServiceServer` do Spring, no lugar do WireMock, para não adicionar dependência | `PluggyOpenFinanceGatewayTest` |
| FIN-OF-08 | Status, última sincronização, sincronizar, entrar de novo e desconectar | `connections-page.tsx` |

## Pontos que não são óbvios

- **Sinal do valor.** No cartão, valor positivo é compra e negativo é pagamento. Na conta, quem manda é o `type` (`DEBIT` ou `CREDIT`). O adaptador normaliza: para o resto do sistema, negativo é dinheiro saindo.
- **Fatura de cartão.** O pagamento aparece como saída na conta e entrada no cartão. Entradas e saídas ficam infladas pelo valor da fatura, mas o saldo do mês fica certo.
- **Webhook sem assinatura.** A Pluggy não assina webhooks. Ela devolve o cabeçalho `X-Webhook-Secret` definido no registro (`api/scripts/pluggy-register-webhook.sh`), comparado em tempo constante. Sem `PLUGGY_WEBHOOK_SECRET`, todo webhook recebe 401.
- **Webhook e widget chegam juntos.** O callback do widget pode nem rodar, então o webhook sozinho consegue registrar a conexão: dono e escopo vão no `clientUserId` do token (`ConnectionClaim`). O registro usa `ON CONFLICT DO NOTHING`.
- **Duas sincronizações ao mesmo tempo.** Cada uma trava a linha da conexão (`FOR UPDATE`), então rodam em fila e a segunda não encontra nada novo. O bloqueio é por SQL nativo e seguido de `refresh`, porque uma consulta com lock sobre uma entidade já carregada na transação falha por versão.
- **Falha da Pluggy durante a sincronização** não é erro HTTP: fica em `lastError` na conexão, e nada é importado pela metade.

## Limitações conhecidas

- Excluir um lançamento importado não impede que ele volte na próxima sincronização, enquanto estiver na janela de 90 dias.
- Desconectar e conectar o mesmo banco de novo gera ids novos na Pluggy, então os últimos 90 dias podem duplicar. Para banco que pede login de novo, use "Entrar de novo", que mantém a conexão. A tela avisa ao desconectar.
- Não foi testado contra a Pluggy real: os testes usam o contrato documentado. Falta rodar com credenciais e o sandbox (`NEXT_PUBLIC_PLUGGY_SANDBOX=true`).

## Banco

`V11__open_finance.sql`: `finance.bank_connection` e `finance.bank_account`. As contas são substituídas a cada sincronização.

## Testes

`BankConnectionTest` (regras), `PluggyOpenFinanceGatewayTest` (contrato) e `OpenFinanceApiIntegrationTests` (HTTP até o PostgreSQL, com gateway falso). Suíte: 74 testes.
