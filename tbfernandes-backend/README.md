# TBFernandes Software — backend (NestJS)

API do TBFernandes Software em NestJS 11, TypeScript e PostgreSQL 17. Substituiu o backend Java (ADR-009) com o mesmo banco e o mesmo contrato JSON. Arquitetura e regras: [CLAUDE.md](CLAUDE.md) e [docs/backend/arquitetura.md](../docs/backend/arquitetura.md#adr-009--backend-em-nestjs).

## Rodar

```bash
docker compose -f ../compose.yaml up -d postgres   # PostgreSQL em localhost:5434
npm install
npm run dev                  # http://localhost:8080, Swagger em /swagger-ui
```

As migrações de `db/` rodam ao subir (as mesmas do Flyway, na mesma tabela `flyway_schema_history`). O perfil `dev` também carrega os dados de exemplo de `db/dev`. Variáveis em [.env.example](.env.example).

## Verificar

```bash
npm run lint && npm run typecheck
npm test                     # domínio, regras de arquitetura, pipes e filtros
npm run test:e2e             # HTTP → caso de uso → PostgreSQL real (Testcontainers; precisa do Docker)
npm run build
```

Sem Docker, os testes e2e usam um PostgreSQL já rodando: `TBF_TEST_DB_HOST=localhost TBF_TEST_DB_PORT=5434 npm run test:e2e` cria um banco novo nele a cada execução.
