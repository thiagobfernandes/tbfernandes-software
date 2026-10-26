# tbfernandes-api

Backend da TBFernandes Software: Spring Boot 4.1, Java 25, PostgreSQL 17, Flyway e Spring Modulith, em monólito modular com clean architecture.

Documentação: [docs/backend](../docs/backend/README.md).

## Pré-requisitos (WSL)

- **JDK 25**. Com SDKMAN: `curl -s https://get.sdkman.io | bash`, depois `sdk install java 25-tem`.
- **Docker** com integração WSL (Docker Desktop → Settings → Resources → WSL integration) ou Docker Engine instalado no Ubuntu.
- Maven não é necessário: use `./mvnw`.

## Rodar

```bash
cd api
./mvnw spring-boot:run        # sobe o PostgreSQL do compose.yaml, aplica as migrações e o seed de dev
```

- API: http://localhost:8080/api/v1/tasks
- Swagger UI: http://localhost:8080/swagger-ui.html
- Saúde e módulos: http://localhost:8080/actuator/health, http://localhost:8080/actuator/modulith

O frontend já aponta para `http://localhost:8080` (`web/.env.example`).

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
- `TaskTest`: regras de negócio da tarefa, sem Spring.
- `WorkApiIntegrationTests` e `TbfernandesApiApplicationTests`: HTTP → caso de uso → PostgreSQL real (Testcontainers; precisa do Docker rodando).

## Estrutura

```
src/main/java/com/tbfernandes/api
├── shared/       kernel compartilhado
├── work/         referência completa: domain · application · adapter/in/web · adapter/out/persistence
├── finance/      porta OpenFinanceGateway + adaptadores Pluggy (em aberto)
└── identity/ knowledge/ goals/ learning/ contacts/ assistant/   módulos declarados, implementação no backlog
```

## Origem do projeto

Gerado com a mesma configuração do [start.spring.io](https://start.spring.io/#!type=maven-project&language=java&platformVersion=4.1.2&packaging=jar&jvmVersion=25&groupId=com.tbfernandes&artifactId=tbfernandes-api&name=tbfernandes-api&description=TBFernandes%20Software%20API&packageName=com.tbfernandes.api&dependencies=web,data-jpa,validation,flyway,postgresql,actuator,docker-compose,modulith,testcontainers) (Maven, Java 25, Boot 4.1.2). Depois foram adicionados springdoc-openapi, ArchUnit e o starter de RestClient.
