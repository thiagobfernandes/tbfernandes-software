# tbfernandes-api

Backend da TBFernandes Software: Spring Boot 4.1, Java 25, PostgreSQL 17, Flyway e Spring Modulith, em monólito modular com clean architecture.

Documentação: [docs/backend](../docs/backend/README.md).

## Pré-requisitos (WSL)

- **JDK 25**. Com SDKMAN: `curl -s https://get.sdkman.io | bash`, depois `sdk install java 25-tem`.
- **Docker** com integração WSL (Docker Desktop → Settings → Resources → WSL integration) ou Docker Engine instalado no Ubuntu.
- Maven não é necessário: use `./mvnw`.

## Rodar

```bash
cd tbfernandes-backend
./mvnw spring-boot:run        # sobe o PostgreSQL do compose.yaml, aplica as migrações e o seed de dev
```

- API: http://localhost:8080/api/v1/tasks
- Swagger UI: http://localhost:8080/swagger-ui.html
- Saúde e módulos: http://localhost:8080/actuator/health, http://localhost:8080/actuator/modulith

O frontend já aponta para `http://localhost:8080` (`tbfernandes-frontend/.env.example`). Para as telas lerem da API em vez do armazenamento simulado, use `NEXT_PUBLIC_DATA_SOURCE=api` no `tbfernandes-frontend/.env.local`.

## Modos de autenticação

| `TBF_AUTH_MODE` | Uso |
|---|---|
| `single-user` (padrão) | desenvolvimento local, sem login; tudo pertence ao dono do seed |
| `session` | login por e-mail e senha, sessão em cookie e CSRF; forçado no perfil `prod` |

No modo `session`, a conta é criada na primeira subida com `TBF_AUTH_BOOTSTRAP_EMAIL`, `TBF_AUTH_BOOTSTRAP_PASSWORD` (12 a 128 caracteres) e `TBF_AUTH_BOOTSTRAP_NAME`.

```bash
TBF_AUTH_MODE=session TBF_AUTH_BOOTSTRAP_EMAIL=voce@exemplo.com \
TBF_AUTH_BOOTSTRAP_PASSWORD='uma senha bem longa' TBF_AUTH_BOOTSTRAP_NAME=Thiago ./mvnw spring-boot:run
```

## Outras variáveis

| Variável | Padrão | Uso |
|---|---|---|
| `TBF_CORS_ORIGINS` | `http://localhost:3000` | origens do frontend |
| `TBF_ASSISTANT_MODEL` | `none` | provedor de IA do assistente (só `none` existe hoje) |
| `PLUGGY_ENABLED`, `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` | desligado | Open Finance (em aberto) |
| `TBF_DB_URL`, `TBF_DB_USER`, `TBF_DB_PASSWORD` | — | banco no perfil `prod` |

Listas aceitam `?page=0&size=50`; o total vem no cabeçalho `X-Total-Count`. Contrato completo em [docs/backend/api.md](../docs/backend/api.md).

## Banco local

```bash
docker compose up -d                                   # só o banco
docker compose exec postgres psql -U tbf -d tbfernandes  # \dn lista os schemas, \dt work.* as tabelas
docker compose down -v                                 # apaga tudo e recomeça
```

As migrações ficam em `src/main/resources/db/migration` (uma por módulo). O perfil `dev`, que é o padrão, também carrega `db/dev/R__dev_seed.sql` com os mesmos dados de exemplo do frontend.

## Testes

```bash
./mvnw test
```

- `ArchitectureTests`: fronteiras entre módulos (Spring Modulith) e regra de dependência da clean architecture (ArchUnit). Também gera os diagramas dos módulos em `target/spring-modulith-docs`.
- `*Test`: regras de domínio sem Spring (`TaskTest`, `RuleBasedAssistantTest`, `KnowledgeGraphTest`).
- `*ApiIntegrationTests`, um por módulo: HTTP → caso de uso → PostgreSQL real (Testcontainers; precisa do Docker rodando).

São 46 testes. O registro de cada etapa está em [docs/backend/implementacao](../docs/backend/implementacao/README.md).

## Estrutura

```
src/main/java/com/tbfernandes/api
├── shared/       kernel compartilhado
├── identity/     conta, login, sessão, perfil
├── work/         empresas, projetos, tarefas, painel (módulo de referência)
├── knowledge/    notas, snippets, métodos, busca
├── goals/        metas, marcos, indicador, progresso
├── learning/     estudos, materiais, habilidades, certificações, formação
├── finance/      lançamentos, fluxo de caixa, compras; Open Finance pela Pluggy, atrás da porta OpenFinanceGateway
├── contacts/     contatos, interações, follow-up
└── assistant/    perguntas e grafo, só leitura; porta LanguageModel (IA em aberto)

Cada módulo: domain · application · adapter/in/web · adapter/out/persistence
```

## Origem do projeto

Gerado com a mesma configuração do [start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=4.1.2&packaging=jar&jvmVersion=25&groupId=com.tbfernandes&artifactId=tbfernandes-api&name=tbfernandes-api&description=TBFernandes%20Software%20API&packageName=com.tbfernandes.api&dependencies=web,data-jpa,validation,flyway,postgresql,actuator,docker-compose,modulith,testcontainers) (Maven, Java 25, Boot 4.1.2). Depois foram adicionados springdoc-openapi, ArchUnit e o starter de RestClient.
