# Backend (tbfernandes-backend/) — regras para o Claude Code

Leia também: [arquitetura](../docs/backend/arquitetura.md) (ADR-009), [requisitos](../docs/backend/requisitos.md), [modelo de dados](../docs/backend/modelo-de-dados.md), [contrato da API](../docs/backend/api.md) e [padrões de código](../docs/padroes-de-codigo.md#backend).

## Stack

NestJS 11 · TypeScript 5 (strict) · TypeORM 1 (sem `synchronize`) · PostgreSQL 17 · Joi (ambiente e requisições) · @nestjs/event-emitter · Jest + supertest + Testcontainers. Base de estrutura: o projeto my-self.so do Thiago (environments com `registerAs` + Joi, `DatabaseModule.forRoot/forFeature`, `BaseRepository`); logger e `ParseJsonPipe` do projeto INFRA.

## Estrutura

```
src/
├── main.ts, app.module.ts, bootstrap/configure-app.ts   (prefixo /api/v1, CORS, sessão, Swagger)
├── common/            kernel: domain (erros, Require, ids), application (OwnerContext, Clock, IdGenerator,
│                      UnitOfWork, EventPublisher), middlewares, pipes, filters, interceptors, protocols (Joi)
├── infrastructure/    environments, database (TypeORM, SqlMigrator, transações), logger, events, time, ids, desktop
└── modules/<modulo>/
    ├── index.ts       API pública (lookups e eventos); outro módulo só importa daqui
    ├── domain/        TypeScript puro: entidades, regras (RN-xx) e repositórios como classes abstratas
    ├── application/   um serviço por agregado; interfaces de integração (ex.: PasswordHasher)
    ├── infrastructure/ persistence/ (entidades TypeORM, TypeOrm<Agregado>Repository, mappers/), security/ etc.
    ├── protocols/     DTOs: <x>.request.ts (classe + schema Joi), <x>.response.ts, mappers/ (domínio ↔ JSON)
    └── web/           controllers
```

## Regras

- **SOLID na prática:** casos de uso dependem de classes abstratas (`CompanyRepository`, `OwnerContext`, `Clock`), nunca de TypeORM; o módulo liga a implementação com `{ provide: Abstração, useClass: Implementação }`.
- **Mappers sempre:** `infrastructure/persistence/mappers/*.persistence-mapper.ts` (linha ↔ domínio) e `protocols/mappers/*.mapper.ts` (domínio ↔ JSON). Entidade TypeORM nunca sai da infraestrutura; objeto de domínio nunca vai direto para a resposta.
- `domain` não importa pacotes (só `node:*`) nem outras camadas. `application` não importa `infrastructure`, `protocols`, `web`, TypeORM nem Express. `protocols` não importa persistência nem controllers. `src/architecture.spec.ts` e o ESLint verificam.
- Módulo só usa outro pelo `index.ts` e na direção permitida (`ALLOWED_MODULE_DEPENDENCIES` em `architecture.spec.ts`): `goals → work, learning, finance`; `knowledge, contacts → work`; `assistant → todos`.
- Toda escrita com mais de um passo roda em `UnitOfWork.run`; eventos publicados dentro dela saem depois do commit.
- Schema: só SQL em `db/migration/V<n>__<descricao>.sql` (próximo número = maior + 1; nunca editar um aplicado). `db/dev` e `db/desktop` são `R__` por perfil. O `SqlMigrator` usa a tabela e o checksum do Flyway.
- Toda raiz de agregado estende `AuditedEntity` (`owner_id`, `created_at`, `updated_at`, `version`) e toda consulta filtra pelo dono (`OwnerContext.currentOwnerId()`).
- Ids: `IdGenerator.forNewAggregate()` (UUID v7 ou o `X-Client-Id`, ADR-007); filhos com `IdGenerator.newId()`.
- Enums: MAIÚSCULAS no domínio e no banco, minúsculas no JSON (`J.enumOf`). Datas `YYYY-MM-DD` como texto.
- Erros: lance `NotFoundError`, `ConflictError`, `BusinessRuleViolationError` (com a regra), `InvalidArgumentError`; o `ProblemDetailsFilter` responde em Problem Details. Mensagens para o usuário em **pt-BR**.
- Nova variável de ambiente: no `register` e no `schema` Joi correspondentes.
- Integrações externas (IA, Pluggy) atrás de uma classe abstrata em `application`, sem nome de fornecedor no domínio, desligadas por padrão.
- Nada de coautoria nem menção a ferramentas de IA nos commits, no código ou nos comentários.

## Verificar

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build
```
