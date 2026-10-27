# Backend (api/) — regras para o Claude Code

Leia também: [arquitetura](../docs/backend/arquitetura.md), [requisitos](../docs/backend/requisitos.md), [modelo de dados](../docs/backend/modelo-de-dados.md), [contrato da API](../docs/backend/api.md), [backlog](../docs/backend/backlog.md) e [padrões de código](../docs/padroes-de-codigo.md#backend).

## Stack

Spring Boot 4.1 · Java 25 · Spring Modulith 2.1 · PostgreSQL 17 · Flyway · springdoc-openapi 3 · JUnit 5 · Testcontainers 2 · ArchUnit. Build com `./mvnw` (Maven Wrapper).

## Módulos (`com.tbfernandes.api.<modulo>`)

`shared` (kernel) · `identity` · `work` (módulo de referência) · `knowledge` · `goals` · `learning` · `finance` · `contacts` · `assistant`.

Cada módulo:

```
<modulo>/
├── package-info.java        @ApplicationModule
├── <Modulo>Lookup.java      API pública para outros módulos (+ eventos como TaskCompleted)
├── domain/                  Java puro: entidades, value objects, regras, portas de repositório
├── application/             um serviço por agregado; portas de saída em application/port/out
└── adapter/
    ├── in/web/              controllers e DTOs (records)
    └── out/persistence/     entidades JPA, Spring Data, mapeamento JPA ⇄ domínio
```

Direção permitida entre módulos: `goals → work, learning, finance`; `knowledge, contacts → work`; `assistant → todos` (só leitura).

## Regras

- `domain` não importa Spring, JPA nem nada de `application`/`adapter`. `application` não importa `adapter`, JPA nem Spring Web. `ArchitectureTests` falha se isso quebrar.
- Regra de negócio (RN-xx de `requisitos.md`) mora no domínio e tem teste unitário `*Test` sem Spring.
- Cada módulo tem um `*ApiIntegrationTests` (HTTP → caso de uso → PostgreSQL real via Testcontainers). Nada de H2.
- Schema: nova migração em `src/main/resources/db/migration/V<n>__<descricao>.sql` (próximo número = maior existente + 1). Nunca editar migração aplicada. Hibernate só valida (`ddl-auto=validate`).
- Um schema por módulo; referências entre módulos são `uuid` sem FK, validadas pelo `*Lookup` do módulo dono.
- Toda raiz de agregado tem `owner_id`, `created_at`, `updated_at`, `version`; toda consulta filtra por `OwnerContext.currentOwnerId()`.
- Ids UUID v7 (`shared.domain.Ids`); `POST` aceita `X-Client-Id` (ADR-007).
- Enums: MAIÚSCULAS no Java e no banco (`text` + `CHECK`), minúsculas no JSON.
- Rotas: `/api/v1/<recurso-no-plural>`, recurso plano por coleção do frontend; status em `PATCH /{id}/status`. Listas aceitam `?page=&size=` e devolvem `X-Total-Count`.
- Erros em Problem Details: `NotFound` 404, `Conflict` 409, `BusinessRuleViolation` 422 (com `rule`), validação 400 (com `errors`). Mensagens para o usuário em **pt-BR**.
- Integrações externas (Pluggy, IA) atrás de porta, com adaptador desligado como padrão (ADR-005).
- Dados de exemplo do perfil `dev` em `db/dev/R__dev_seed.sql`, iguais aos de `web/src/lib/sample-data` (ADR-006).
- Mudou contrato, modelo ou regra: atualize `docs/backend/*.md` no mesmo commit e registre a etapa em `docs/backend/implementacao/`.

## Verificar

```bash
./mvnw verify          # precisa do Docker rodando
./mvnw spring-boot:run # sobe banco + API; Swagger em http://localhost:8080/swagger-ui.html
```

Se a máquina não tiver JDK 25, `./mvnw -Djava.version=21 verify` compila e testa com JDK 21.
