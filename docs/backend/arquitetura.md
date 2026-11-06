# Arquitetura do backend

Versão 0.2 · 2026-11-03 (NestJS, ADR-009) · Complementa [decisoes-tecnicas.md](../decisoes-tecnicas.md)

## 1. Resumo

- **Um único deploy**: NestJS 11 com TypeScript, em `tbfernandes-backend/` (até a etapa 11 era Spring Boot com Java; reescrito pelo ADR-009).
- **Monólito modular**: cada domínio é um módulo Nest com a API pública no `index.ts`, e o teste `src/architecture.spec.ts` falha se um módulo usar internals de outro ou depender fora de `ALLOWED_MODULE_DEPENDENCIES`.
- **Clean architecture dentro de cada módulo**: as regras de negócio ficam em TypeScript puro; Nest, TypeORM e HTTP ficam nas bordas.
- **PostgreSQL 17**, um schema por módulo, migrações SQL no formato do Flyway aplicadas pelo `SqlMigrator`.
- **Integrações externas atrás de portas**: Pluggy (Open Finance) e o futuro provedor de IA.

## 2. Módulos

| Módulo | Pacote | Schema | Conteúdo | Telas |
|---|---|---|---|---|
| Kernel comum | `common` + `infrastructure` | `public` | ids, erros base, dono da requisição, CORS, Problem Details | todas |
| Identity | `identity` | `identity` | usuário dono; login depois | Settings |
| Work | `work` | `work` | empresas, projetos, tarefas, checklist | Dashboard, Companies, Projects, Tasks |
| Knowledge | `knowledge` | `knowledge` | notas, snippets, vínculos, métodos | Knowledge, Snippets, Graph, Methods |
| Goals | `goals` | `goals` | metas, submetas, marcos, indicador | Goals |
| Learning | `learning` | `learning` | estudos, materiais, habilidades, certificações, formação | Learning, Certifications |
| Finance | `finance` | `finance` | lançamentos, metas de compra, porta Open Finance | Finance |
| Contacts | `contacts` | `contacts` | contatos e interações | Contacts |
| Assistant | `assistant` | — | perguntas sobre os dados e grafo (só leitura) | Assistant, Graph |

A lista de módulos agrupa `company`, `project` e `task` da proposta inicial em um único módulo **Work** (ADR-002).

## 3. Camadas dentro de um módulo

O módulo `work` é a referência; os outros seguem o mesmo desenho.

```
src/modules/work
├── index.ts                     API pública: WorkModule, WorkLookup e WorkEvents (ex.: taskCompleted)
├── work.module.ts, work.lookup.ts, work.events.ts
├── domain/                      TypeScript puro: entidades, regras, repositórios como classes abstratas
│   ├── company/  company.ts, company.repository.ts, company.spec.ts
│   ├── project/  project.ts, project.repository.ts, project.spec.ts
│   └── task/     task.ts, task.repository.ts, task.spec.ts
├── application/                 casos de uso: orquestram domínio, transação (UnitOfWork) e eventos
│   └── company.service.ts, project.service.ts, task.service.ts, work-lookup.service.ts
├── infrastructure/
│   └── persistence/             entidades TypeORM, TypeOrm*Repository (implementa o repositório do domínio), mappers/
├── protocols/                   DTOs: *.request.ts (classe + schema Joi), *.response.ts, mappers/ (domínio ↔ JSON)
└── web/                         controllers REST
```

Sem o padrão de portas e adaptadores (`adapter/in`, `adapter/out`, `application/port/out`), por decisão do Thiago (ADR-008). O que era `adapter/out/*` agora fica em `infrastructure/*` (`persistence`, `pluggy`, `model`, `security`), e as interfaces de integração externa (`OpenFinanceGateway`, `LanguageModel`, `EmbeddingModel`, `KnowledgeIndex`) ficam direto em `application/`.

### Regra de dependência

```
web ─▶ protocols ─▶ domain
web ─▶ application ─▶ domain ◀─ infrastructure
```

| Camada | Pode depender de | Não pode depender de |
|---|---|---|
| `domain` | `common/domain`, módulos `node:*` | qualquer pacote npm, `application`, `infrastructure`, `protocols`, `web` |
| `application` | `domain`, `common/application` (`UnitOfWork`, `EventPublisher`, `OwnerContext`, `Clock`), `@nestjs/common` | `infrastructure`, `protocols`, `web`, TypeORM, Express |
| `protocols` | `domain`, `common/protocols`, Joi | `infrastructure`, `web`, TypeORM |
| `infrastructure` | `domain`, `application`, Nest, TypeORM, HTTP | classes internas de outro módulo |
| `web` | `application`, `domain`, `protocols`, Nest | `infrastructure` de outro módulo |

O `src/architecture.spec.ts` e o ESLint verificam as três primeiras linhas e falham se aparecer alguma pasta `adapter` ou `port`.

### Por que este nível e não mais

Clean architecture "completa" teria uma interface de caso de uso por operação, objetos de entrada e saída por caso de uso e presenters. Para um time de uma pessoa, isso multiplica arquivos sem proteger mais as regras. A versão adotada mantém o que importa:

- **Regras no domínio**, testáveis sem Nest nem banco (`task.spec.ts` roda em milissegundos).
- **Interfaces onde a regra mora**: repositórios no domínio, integrações externas em `application`. A implementação fica em `infrastructure`.
- **Um serviço de aplicação por agregado** em vez de uma classe por caso de uso. Se um serviço passar de ~300 linhas, ele se divide.
- **Mapeamento explícito** entre entidade TypeORM e domínio em `infrastructure/persistence/mappers`, e entre domínio e JSON em `protocols/mappers`. Custa algumas linhas, mas mantém o domínio sem anotações e deixa o schema evoluir sem mexer nas regras.

## 4. Comunicação entre módulos

1. **Eventos de domínio** (preferido): o módulo publica um evento da sua API pública, como `WorkEvents.taskCompleted`; quem se interessa escuta com `@OnEvent` (`@nestjs/event-emitter`). Eventos publicados dentro de `UnitOfWork.run` saem só depois do commit. Não há registro persistente: um evento perdido num reinício não é reenviado (a tabela `event_publication`, do Java, ficou sem uso).
2. **Consulta síncrona**: quando um módulo precisa validar uma referência (ex.: `contacts` verificar se uma empresa existe), o módulo dono exporta uma classe abstrata no `index.ts` (ex.: `WorkLookup`). Nunca se acessa repositório de outro módulo.
3. **Sem FK entre schemas** (ADR-003): `task.goal_id` é só um `uuid`. A aplicação valida na escrita e os eventos de exclusão limpam vínculos.

## 5. Integrações externas

### Open Finance (Pluggy)

- Interface: `finance.application.OpenFinanceGateway` (token de conexão, contas, transações).
- Implementações em `finance.infrastructure.pluggy`:
  - `DisabledOpenFinanceGateway`: padrão; responde com a regra RN-15.
  - `PluggyOpenFinanceGateway`: ativo com `tbf.pluggy.enabled=true`. Detalhes na [etapa 7](implementacao/etapa-7-open-finance.md).
- Credenciais por `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`; webhook por `PLUGGY_WEBHOOK_SECRET`.
- Rotas em `/api/v1/webhooks/**` são públicas na segurança, sem sessão nem CSRF: cada controller confere o próprio segredo. Sincronização nunca roda dentro do webhook, que precisa responder em 10 s; roda depois do commit, por evento interno do módulo.
- Tabelas `finance.bank_connection` e `finance.bank_account`; `finance.entry` recebe as transações com `source` e `external_id`, sem duplicar (RN-16).

### Autenticação (etapa 6)

| Modo (`TBF_AUTH_MODE`) | Uso | Comportamento |
|---|---|---|
| `single-user` | desenvolvimento local (padrão do perfil `dev`) | sem login; toda requisição age como `TBF_AUTH_OWNER_ID` |
| `session` | qualquer ambiente compartilhado (forçado no perfil `prod`) | login por `POST /api/v1/auth/login`, sessão em cookie HttpOnly/SameSite=Lax, CSRF no cookie `XSRF-TOKEN` devolvido no cabeçalho `X-XSRF-TOKEN` |

O `OwnerContext` é implementado pelo módulo identity (`SessionOwnerContext`), então nenhum outro módulo muda ao trocar de modo. Não há cadastro público: a conta é criada no início pelas variáveis `TBF_AUTH_BOOTSTRAP_*`.

### IA do assistente (etapa 8)

- Classe abstrata: `LanguageModel`, em `modules/assistant/application`. O modelo transforma a pergunta em um `StructuredQuery` (saída estruturada em JSON) e depois reescreve o texto. Ele nunca acessa o banco: `QueryEngine` executa a consulta sobre o retrato dos dados, e as referências vêm sempre dessa execução, então todo link aponta para um registro real (RN-20).
- Implementações (em `modules/assistant/infrastructure/model`): `DisabledLanguageModel` (padrão, `TBF_ASSISTANT_MODEL=none`), `AnthropicLanguageModel` (`anthropic`, com `ANTHROPIC_API_KEY`, saída estruturada estrita) e `OpenAiCompatibleLanguageModel` (`openai-compatible`: Groq por padrão, xAI ou Ollama pela URL; modo JSON com o schema nas instruções, validado por `QueryPlans`). Os prompts ficam em `model/prompts.ts`, iguais para todos. Detalhes em [etapa 10](implementacao/etapa-10-assistente-ia.md).
- Se o modelo falhar, a API responde com as regras; o assistente nunca fica fora do ar por causa da IA.

### RAG do assistente (etapa 11)

- Perguntas abertas são respondidas com trechos das notas e snippets. `KnowledgeRetrievalService` mantém o índice `assistant.knowledge_chunk` em dia (só reprocessa o que mudou) e `PassageRanker` faz a busca híbrida (BM25 + cosseno) em TypeScript puro.
- Portas: `EmbeddingModel` (adaptadores `DisabledEmbeddingModel`, padrão, `VoyageEmbeddingModel`, com `TBF_ASSISTANT_EMBEDDING=voyage`, e `OllamaEmbeddingModel`, com `ollama`, local e gratuito, `bge-m3` por padrão) e `KnowledgeIndex` (`SqlKnowledgeIndex`). O `LanguageModel` ganhou `answerFromPassages`.
- Observabilidade (AST-05): `AssistantTracer`, em `modules/assistant/application`, com `DisabledTracer` (padrão) e `LangfuseTracer` (`TBF_ASSISTANT_TRACING=langfuse`, OpenTelemetry com provider próprio e `LangfuseSpanProcessor`). Um trace `answer-question` por pergunta, com `userId` do dono; os adapters de modelo e de embedding abrem generations e embeddings, e a busca do RAG abre um retriever. Falha no tracing nunca muda a resposta.
- Sem pgvector: os vetores ficam em `real[]` porque o PostgreSQL embutido do app desktop não tem a extensão. Detalhes em [etapa 11](implementacao/etapa-11-rag.md).

### Leitura entre módulos do assistant

O assistant monta um `Workspace` (retrato só leitura, lido pelo `WorkspaceReader`) com as APIs públicas `WorkLookup`, `KnowledgeLookup`, `GoalsLookup`, `LearningLookup`, `FinanceLookup` e `ContactsLookup`. As respostas (`RuleBasedAssistant`) e o grafo (`KnowledgeGraphs`) são funções puras desse retrato, testadas sem Nest.

## 6. Convenções

| Tema | Convenção |
|---|---|
| Ids | UUID v7 gerado na aplicação (`IdGenerator`), ou o `X-Client-Id` do frontend (ADR-007): ordenado no tempo, bom para índice. |
| Dono | `OwnerContext.currentOwnerId()`: no modo `single-user` vem de `TBF_AUTH_OWNER_ID`; no modo `session`, do usuário logado. |
| Erros | `NotFound` → 404, `Conflict` → 409, `BusinessRuleViolation` → 422 com `rule`, validação → 400 com `errors`. |
| Enums | Maiúsculas no domínio e no banco (CHECK); minúsculas no JSON e nos parâmetros de URL. |
| Datas | Texto `YYYY-MM-DD` (`IsoDate`) para dias, `Date` (UTC) para momentos. |
| Auditoria | `created_at`, `updated_at`, `version` em toda tabela de agregado. |
| Rotas | `/api/v1/<recurso-no-plural>`, um recurso plano por coleção do frontend; mudança de status em `PATCH /{id}/status`. |
| Testes | `*.spec.ts` ao lado do código (unidade); `test/*.e2e-spec.ts` da requisição HTTP ao PostgreSQL real (Testcontainers). |

## 7. Decisões de arquitetura (ADR)

### ADR-001 — Clean architecture leve dentro do monólito modular
**Contexto:** o usuário quer separar regras de negócio sem aumentar demais a complexidade.
**Decisão:** domínio puro, casos de uso por agregado, portas e adaptadores; Spring Modulith para as fronteiras entre módulos.
**Consequências:** regras testáveis sem infraestrutura; um pouco de código de mapeamento por agregado. Os nomes de pacote de portas e adaptadores foram trocados no ADR-008.

### ADR-002 — Work agrupa empresas, projetos e tarefas
**Contexto:** a proposta inicial tinha `company`, `project` e `task` como módulos separados, mas eles mudam juntos e têm FKs fortes (tarefa → projeto → empresa).
**Decisão:** um módulo `work` com três agregados.
**Consequências:** menos eventos artificiais; se um dia `task` precisar sair, as portas já estão separadas por agregado.

### ADR-003 — Um schema por módulo e nenhuma FK entre schemas
**Contexto:** FKs entre módulos acoplam a ordem de migração e impedem extrair um módulo.
**Decisão:** FKs só dentro do módulo; referências entre módulos são `uuid` validados pela aplicação.
**Consequências:** possível referência órfã se um evento falhar; mitigado pelo registro de eventos do Modulith e por um job de verificação (backlog PLT-07).

### ADR-004 — Enums como texto com CHECK, não tipos `enum` do PostgreSQL
**Decisão:** `text` + `CHECK (... IN (...))`.
**Consequências:** adicionar um valor é uma migração simples (`ALTER TABLE ... DROP/ADD CONSTRAINT`), sem `ALTER TYPE`.

### ADR-005 — Integrações externas desligadas por padrão
**Decisão:** toda integração tem um adaptador "desligado" que é o padrão; o real liga por propriedade.
**Consequências:** o ambiente local e os testes nunca chamam serviços externos sem querer.

### ADR-006 — Dados de exemplo iguais aos do frontend no perfil `dev`
**Decisão:** `db/dev/R__dev_seed.sql` é gerado a partir de `tbfernandes-frontend/src/lib/sample-data`, com ids UUIDv5 dos ids do frontend.
**Consequências:** as telas mostram os mesmos registros com a API real; o seed nunca roda fora do perfil `dev`.

### ADR-007 — O cliente pode escolher o id do registro que cria
**Contexto:** o store do frontend aplica cada mudança na hora e envia para a API depois. Se o id só existisse depois da resposta, a tela teria que trocar ids já usados (seleção, vínculos, uma interação que aponta para a tarefa de follow-up criada no mesmo clique).
**Decisão:** `POST` aceita o cabeçalho opcional `X-Client-Id` com um UUID; o primeiro agregado criado na requisição usa esse id (`Ids.forNewAggregate()`). Se uma linha com esse id já existir, de qualquer dono, a API responde 409 em vez de sobrescrever (`AuditedEntity` recusa no `@PostLoad`). Itens filhos, como os do checklist, continuam com ids do servidor.
**Consequências:** criação otimista com id estável, e importação idempotente: importar duas vezes os mesmos dados não duplica nada. O frontend gera UUIDv7, como a API.

### ADR-008 — Pacotes `infrastructure`, `protocols` e `web` no lugar de `adapter/in` e `adapter/out`
**Contexto:** o padrão de portas e adaptadores (`adapter/in/web`, `adapter/out/persistence`, `application/port/out`) espalhava cada módulo em pastas profundas e misturava DTOs dentro dos controllers.
**Decisão:** cada módulo tem `domain`, `application`, `infrastructure` (persistência e clientes externos, só quando necessário), `protocols` (DTOs) e `web` (controllers). Interfaces de integração ficam em `application`; implementações de repositório se chamam `<Agregado>RepositoryImpl`.
**Consequências:** a regra de dependência continua igual e verificada pelo `ArchitectureTests`; um teste novo impede que pacotes `adapter` ou `port` voltem.

### ADR-009 — Backend em NestJS
**Contexto:** o Thiago decidiu sair do Java por enquanto e ficar em NestJS (2026-11-02), seguindo a estrutura do projeto my-self.so (variáveis de ambiente com `registerAs` e Joi, `DatabaseModule.forRoot/forFeature`, `BaseRepository`) e o logger e o `ParseJsonPipe` do projeto INFRA.
**Decisão:** o backend é reescrito em NestJS (primeiro em `tbfernandes-backend-nest/`) (NestJS 11, TypeORM, Joi), módulo a módulo, com as mesmas camadas (`domain`, `application`, `infrastructure`, `protocols`, `web`), o mesmo banco e o mesmo contrato JSON. As migrações SQL continuam as mesmas e são aplicadas por um executor próprio (`SqlMigrator`) na tabela `flyway_schema_history`, com o checksum do Flyway: um banco que o Java migrou é reconhecido como atualizado. Repositórios e integrações são classes abstratas no domínio ou em `application`; mappers explícitos separam linha, domínio e JSON. Fronteiras de módulo e de camada são verificadas por `src/architecture.spec.ts` e pelo ESLint. O Java continuou funcionando até o NestJS cobrir todos os módulos. **Concluído em 2026-11-03:** o Java saiu, a pasta virou `tbfernandes-backend/` e o app desktop leva Node no lugar do Java.
**Consequências:** uma linguagem só no frontend e no backend; sessões em memória como antes (uma instância); Spring Modulith dá lugar a `@nestjs/event-emitter` com eventos depois do commit (sem o registro persistente de eventos). Registro das etapas em [implementacao/migracao-nestjs.md](implementacao/migracao-nestjs.md).

## 8. Ambiente local

```
WSL (Ubuntu)
├── tbfernandes-frontend/  Next.js :3000  ──HTTP──▶  tbfernandes-backend/  NestJS :8080  ──TCP──▶  PostgreSQL 17 :5434 (Docker, serviço postgres do compose.yaml)
```

Veja [README do backend](../../tbfernandes-backend/README.md) para os comandos.

### Frontend com a API (etapa 9)

`NEXT_PUBLIC_DATA_SOURCE=api` no `tbfernandes-frontend/.env.local` troca o armazenamento simulado pela API sem mudar as telas: o store (`tbfernandes-frontend/src/lib/sample-data/store.ts`) continua sendo o que as telas leem, mas começa vazio, carrega as 17 coleções da API e envia cada mudança por `tbfernandes-frontend/src/lib/api/remote-store.ts`, uma de cada vez e em ordem. Se a API recusar uma mudança, o store recarrega tudo da API e mostra o motivo. No modo `session`, a tela de login aparece antes do painel.
