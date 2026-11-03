# Migração do backend para NestJS

Decisão em [ADR-009](../arquitetura.md#adr-009--backend-em-nestjs). O NestJS cresce em `tbfernandes-backend-nest/`; o Java em `tbfernandes-backend/` segue no ar até a última etapa, então o modo API do frontend e o app desktop funcionam o tempo todo.

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | Base (ambiente, banco, migrações, logger, erros, paginação, `X-Client-Id`, transações, eventos), `identity` e `work` | feita |
| 2 | `knowledge` e `contacts` | feita |
| 3 | `learning` (feita), `finance` (com Open Finance) e `goals`, um PR cada | em andamento |
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

## Etapa 3a — learning

- Estudos, materiais, habilidades, certificações e formação, com um repositório e um serviço por agregado (no Java era um repositório só para os cinco).
- Regras no domínio: estudo começa `planned` e o prazo não vem antes do início (RN-02); material começa `to_consume` e precisa de tipo; nível da habilidade de 1 a 5 (RN-13, 422); certificação obtida precisa da data e vence depois dela (RN-14); formação com início antes do fim.
- Referências dentro do módulo: habilidades do estudo e estudos da certificação precisam ser do mesmo dono (404). Excluir um estudo deixa os materiais sem estudo (`ON DELETE SET NULL`); nome de habilidade repetido dá 409.
- `expiringWithinDays` (LRN-06) devolve só certificações obtidas que vencem entre hoje e o fim da janela.
- `LearningLookup` (estudos e certificações) para `goals` e o assistente.
- Conferido com o Java lado a lado: mesmo JSON em `/studies`, `/materials`, `/skills`, `/certifications` e `/educations` (listas de ids em ordem estável).
- Testes: 57 unitários e 31 e2e (porte de `LearningApiIntegrationTests` mais estudo excluído, 409 de habilidade repetida e ordem das formações).
