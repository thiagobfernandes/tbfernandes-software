# Migração do backend para NestJS

Decisão em [ADR-009](../arquitetura.md#adr-009--backend-em-nestjs). O NestJS cresce em `tbfernandes-backend-nest/`; o Java em `tbfernandes-backend/` segue no ar até a última etapa, então o modo API do frontend e o app desktop funcionam o tempo todo.

| Etapa | Conteúdo | Situação |
|---|---|---|
| 1 | Base (ambiente, banco, migrações, logger, erros, paginação, `X-Client-Id`, transações, eventos), `identity` e `work` | feita |
| 2 | `knowledge` e `contacts` | a fazer |
| 3 | `learning`, `goals` e `finance` (com Open Finance) | a fazer |
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
