# Migração do backend para NestJS

Decisão em [ADR-009](../arquitetura.md#adr-009--backend-em-nestjs). O NestJS cresce em `tbfernandes-backend-nest/`; o Java em `tbfernandes-backend/` segue no ar até a última etapa, então o modo API do frontend e o app desktop funcionam o tempo todo.

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | Base (ambiente, banco, migrações, logger, erros, paginação, `X-Client-Id`, transações, eventos), `identity` e `work` | feita |
| 2 | `knowledge` e `contacts` | feita |
| 3 | `learning`, `finance` (com Open Finance) e `goals`, um PR cada | em andamento (`finance` feita) |
| 4 | `assistant` (regras, grafo, RAG; modelo de IA atrás de uma interface sem fornecedor fixo) | a fazer |
| 5 | Desktop com Node no lugar do Java (PostgreSQL embutido, backup, token), compose, CI e remoção do Java; a pasta vira `tbfernandes-backend/` | a fazer |

## Etapa 1 — base, identity e work

### Referências usadas

- **my-self.so**: `infrastructure/environments` com `ConfigModule` global, `registerAs` por assunto (`app`, `database`, `auth`, `desktop`) e schemas Joi que derrubam a aplicação na subida se uma variável estiver errada; `infrastructure/database` com `DatabaseModule.forRoot()` e `forFeature([...])` por cima do TypeORM; `BaseRepository` usado por composição; `.prettierrc`, ESLint e `tsconfig` do projeto.
- **INFRA**: `Logger` estático com as marcas `[---->]` e `[<----]` e o `LoggerMiddleware` (a linha de entrada agora sai na hora, porque esperar `readable` pulava requisições sem corpo; `LOG_FORMAT=json` para produção); `ParseJsonPipe` em `common/pipes`, para campos JSON em multipart ou query.

### O que foi feito

- **Camadas por módulo** iguais às do Java (ADR-008): `domain` em TypeScript puro, `application` com um serviço por agregado, `infrastructure/persistence` com entidades TypeORM, repositórios `TypeOrm<Agregado>Repository` e mappers, `protocols` com requisições (classe para o Swagger + schema Joi), respostas e mappers, e `web` com os controllers.
- **SOLID**: os serviços recebem classes abstratas (`CompanyRepository`, `OwnerContext`, `Clock`, `IdGenerator`, `UnitOfWork`, `EventPublisher`, `PasswordHasher`) e o módulo escolhe a implementação. Trocar TypeORM, o relógio ou o hash de senha não mexe em caso de uso.
- **Migrações**: `SqlMigrator` aplica `db/migration` (e `db/dev` ou `db/desktop` conforme `TBF_PROFILE`) em ordem, cada script na sua transação, com trava `pg_advisory_lock`, na tabela `flyway_schema_history` e com o mesmo checksum do Flyway. Conferido lado a lado: o Java e o NestJS gravaram os mesmos checksums para os 13 scripts.
- **Contrato**: mesmas rotas `/api/v1`, mesmo JSON (comparado com o Java em todas as listas de work, painel, `/me` e `/auth/session`), Problem Details com `rule` e `errors` por campo, `X-Total-Count`/`X-Page`/`X-Page-Size`, `Location` no 201, `X-Client-Id` (409 se o id já existe), health em `/actuator/health`, OpenAPI em `/v3/api-docs` e Swagger em `/swagger-ui`.
- **Identity**: modo `single-user` e `session` (cookie de sessão HttpOnly, CSRF por cookie `XSRF-TOKEN` + cabeçalho `X-XSRF-TOKEN`, login também exige o token), bootstrap da conta por variável, troca de senha (RN-25). As senhas continuam no formato `{bcrypt}...`, então as que já existem no banco valem.
- **Desktop**: o token `X-TBF-Desktop-Token` já é exigido quando `TBF_DESKTOP_TOKEN` existe. PostgreSQL embutido, backup e desligamento ficam para a etapa 5.
- **Mensagens em pt-BR**: erros de validação, `NotFound` ("A tarefa … não existe") e regras (RN-02, RN-03) que no Java ainda estavam em inglês.

### Diferenças em relação ao Java

- Eventos entre módulos com `@nestjs/event-emitter`, depois do commit, sem o registro persistente do Spring Modulith (`event_publication` fica no banco, sem uso).
- Sessões em memória, como a sessão do servlet; sem `TBF_SESSION_SECRET`, elas valem até reiniciar.
- O cookie de sessão se chama `TBF_SESSION` (era `JSESSIONID`); o frontend não depende do nome.

### Testes

- 31 unitários (`npm test`): regras de `Task`, `Company`, `Project`, `AppUser` e senha, UUID v7, checksum do Flyway, schemas Joi, `ParseJsonPipe`, filtro de erros e as regras de arquitetura (`src/architecture.spec.ts`: fronteiras de módulo, camadas e nada de `adapter`/`port`).
- 20 e2e (`npm run test:e2e`, PostgreSQL real): ciclo empresa → projeto → tarefa com evento `TaskCompleted`, paginação, 400 com campos, RN-01, RN-03, RN-07, projeto excluído mantendo as tarefas, atrasadas e painel, PUT com checklist e campos desconhecidos, `X-Client-Id`, sessão com CSRF e donos separados, RN-25, token do desktop, health, OpenAPI e migrações idempotentes.

## Etapa 2 — knowledge e contacts

### O que foi feito

- **Knowledge**: notas, snippets e métodos de trabalho com o mesmo JSON do Java. Tags normalizadas no domínio (`Tags`: sem espaços, minúsculas, sem repetição, até 40 caracteres), vínculos com projetos e tarefas em `KnowledgeLinks` e checados pelo `LinkValidator` através do `WorkLookup` (RN-05). Busca com o mesmo SQL: `tsvector` gerado (`search @@ plainto_tsquery('simple', …)`) ou trecho do título com `ILIKE`, tag exata e, nos snippets, linguagem exata em minúsculas. O código do snippet é gravado sem nenhuma alteração (RN-11). Passos e exemplos do método são regravados em ordem a cada edição; o método precisa de pelo menos um passo.
- **Contacts**: contatos e interações em dois repositórios (`ContactRepository` e `InteractionRepository`), empresa cadastrada ou nome de empresa, nunca os dois (RN-23), e-mail em minúsculas, especialidades sem repetição, filtro `dueWithinDays` (CTC-04) e follow-up (CTC-03) que cria a tarefa pelo `FollowUpTasks` do work. O follow-up roda numa transação só, então o segundo pedido (RN-24) não deixa tarefa sobrando.
- **Eventos**: `WorkItemDeletedListener` (KNW-06) tira o vínculo de notas e snippets quando um projeto ou tarefa é excluído; `WorkEventsListener` tira a empresa dos contatos e o follow-up das interações. Cada listener roda depois do commit, na sua própria transação.
- **APIs públicas**: `KnowledgeLookup` (notas e snippets) e `ContactsLookup` (contatos), que o assistente vai usar na etapa 4. `ALLOWED_MODULE_DEPENDENCIES` passou a ter `knowledge → work` e `contacts → work`.
- **Requisições**: `companyId`, `followUpTaskId` e datas opcionais em branco (`""`) valem como vazio, como o Jackson fazia.

### Conferência com o Java

Java (porta 8081) e NestJS (porta 8080) com o seed de desenvolvimento: as listas de notas, snippets, métodos, contatos e interações e as buscas (`?q=`, `?language=`, `?dueWithinDays=`) devolveram o mesmo JSON. Criação de contato e interação, follow-up e o 422 do RN-24 também saíram iguais; só as mensagens de erro mudaram para pt-BR.

### Testes

- 49 unitários: mais `Tags`, `Note`, `Snippet`, `Method`, `Contact`, `Interaction` e `IsoDates`.
- 27 e2e: portes de `KnowledgeApiIntegrationTests` e `ContactsApiIntegrationTests` (busca por texto, trecho do título e tag; vínculo removido ao excluir o projeto; 404 de tarefa desconhecida; código literal; ordem dos passos; RN-23; empresa removida do contato; follow-up único sem tarefa sobrando; `dueWithinDays`; interações excluídas com o contato).

## Etapa 3b — finance

### O que foi feito

- **Dinheiro em centavos.** `Money` converte os números do JSON e o texto do `numeric` do PostgreSQL em centavos inteiros, com arredondamento meio-para-par como o `BigDecimal` do Java, e volta para número (JSON) ou texto `"1500.00"` (banco). O número do JSON é lido como foi escrito (`12.345` vira 1234 centavos, não o binário 12,3449…). Somas e projeções são exatas.
- **Lançamentos e fluxo de caixa** (RF-FIN-01, FIN-02): `FinanceEntry` com escopo pessoal ou empresa (RN-12), valor sempre positivo. `CashFlows` (domínio) monta a série do mês escolhido e dos anteriores (`months` padrão 6, de 1 a 24), os totais do mês e as despesas por categoria, da maior para a menor. Sem `scope`, soma os dois e devolve `"scope": "all"`.
- **Compras** (RF-FIN-03, FIN-04): `PurchaseGoal` com RN-17 (compra feita precisa do valor pago) e RN-18 (reserva não negativa) e a projeção (`missing`, `ready`, `months`, `month`, `onTime`), a mesma regra do frontend.
- **Open Finance** (épico FIN-OF): `OpenFinanceGateway` (application) esconde o fornecedor. `PluggyOpenFinanceGateway` usa `fetch`: reaproveita a chave de API por 110 minutos, pede outra uma vez quando a Pluggy responde 401, segue o cursor `next` de `/v2/transactions`, ignora transações pendentes, trata o sinal do cartão de crédito e usa `amountInAccountCurrency` em compras no exterior. Qualquer falha vira `ExternalServiceError` (502) sem dados sensíveis na mensagem. Com `PLUGGY_ENABLED` diferente de `true`, entra o `DisabledOpenFinanceGateway`, que responde 422 RN-15.
- **Sincronização**: cadastro (`POST /finance/connections`) e webhooks publicam `finance.connection-sync-requested`; o `ConnectionSyncListener` sincroniza depois do commit, fora da requisição. A conexão é travada com `SELECT … FOR UPDATE`, o cadastro concorrente usa `INSERT … ON CONFLICT (external_id) DO NOTHING` e a importação é idempotente pelo id da transação (RN-16). Falha no fornecedor fica registrada na conexão (`status: error`, `lastError`) sem perder as contas da última sincronização boa. Conexão de outra conta dá 409 RN-21.
- **Webhook** `POST /webhooks/pluggy`: rota pública, comparação do `X-Webhook-Secret` em tempo constante; sem segredo configurado, tudo é recusado com 401. Trata `item/updated`, `item/error` (inclusive conexão ainda não cadastrada, pelo `clientUserId` `"<owner>:<SCOPE>"`), `item/deleted` e `transactions/deleted`.
- **API pública**: `FinanceLookup` (compras com projeção e totais do mês por escopo, em reais) para goals e assistente. `ALLOWED_MODULE_DEPENDENCIES` ganhou `finance: []`.
- **Configuração**: `PLUGGY_ENABLED`, `PLUGGY_BASE_URL`, `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` e `PLUGGY_WEBHOOK_SECRET`, validadas no início (id e segredo obrigatórios quando ligado). Ver `.env.example`.

### Conferência com o Java

Java (porta 8081) e NestJS (porta 8080) recebendo as mesmas requisições: lançamentos, lista por mês, fluxo de caixa com e sem escopo, compra, projeção, 400 de valor negativo, 422 RN-17, 404, lista de conexões, 422 RN-15 com o Open Finance desligado, 400 do token sem escopo e 401 do webhook sem segredo deram o mesmo JSON. A única diferença é de escrita: o Java manda `10000.00` e o NestJS `10000`, o mesmo número para o frontend.

### Testes

- Unitários: `Money`, `CashFlows`, `PurchaseGoal`, `BankConnection`, `ConnectionClaims` e o porte de `PluggyOpenFinanceGatewayTest` com um `fetch` falso.
- e2e: portes de `FinanceApiIntegrationTests` e `OpenFinanceApiIntegrationTests` com um gateway falso (`startApp` agora aceita trocar providers). O vínculo compra ↔ meta fica para o módulo goals.

