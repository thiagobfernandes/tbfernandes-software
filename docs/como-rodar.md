# Como rodar

Ambiente de referência: Windows com **WSL (Ubuntu)**, repositório em `~/projects/tbfernandes-software`.

## Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| JDK | 25 | `sdk install java 25-tem` (SDKMAN). Maven não é necessário: use `./mvnw` |
| Node.js | 22 (o mesmo do CI) | npm vem junto |
| Docker | Docker Desktop com integração WSL, ou Docker Engine no Ubuntu | O backend sobe o PostgreSQL pelo `api/compose.yaml`; os testes usam Testcontainers |

## Backend

```bash
cd api
./mvnw spring-boot:run     # sobe o PostgreSQL 17 do compose, aplica as migrações e o seed de dev
```

- API: http://localhost:8080/api/v1/tasks
- Swagger UI: http://localhost:8080/swagger-ui.html
- Saúde e módulos: http://localhost:8080/actuator/health, http://localhost:8080/actuator/modulith

O jar empacotado (`java -jar`) não sobe o compose sozinho: rode `docker compose up -d` antes.

Banco local:

```bash
docker compose up -d                                     # só o banco
docker compose exec postgres psql -U tbf -d tbfernandes  # \dn lista schemas, \dt work.* tabelas
docker compose down -v                                   # apaga tudo e recomeça
```

Autenticação, variáveis de ambiente e perfis: [api/README.md](../api/README.md).

## Frontend

```bash
cd web
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

| `NEXT_PUBLIC_DATA_SOURCE` | Comportamento |
|---|---|
| `local` (padrão) | Dados de exemplo simulados, salvos no localStorage do navegador. Não precisa do backend. Configurações → "Restaurar dados de exemplo" reinicia |
| `api` | Lê e grava na API em `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8080`). Com `TBF_AUTH_MODE=session` na API, aparece a tela de login |

Depois de trocar `.env.local`, reinicie o `npm run dev`.

## Tudo junto

```bash
# terminal 1
cd api && ./mvnw spring-boot:run
# terminal 2
cd web && echo "NEXT_PUBLIC_DATA_SOURCE=api" >> .env.local && npm run dev
```

Para levar dados criados no modo local para a API: Configurações → Dados → "Importar dados salvos neste navegador".

## Testes e verificação

```bash
cd api && ./mvnw verify                # unidade, integração (Testcontainers) e ArchitectureTests
cd web && npm run lint && npm run build
cd web && npm run api:types            # com a API no ar: regenera os tipos TypeScript do OpenAPI
```

O CI (`.github/workflows/ci.yml`) roda os mesmos comandos a cada push na `main` e em cada PR.

## Problemas comuns

- **Testes do backend falham ao subir container**: o Docker não está rodando ou o WSL não tem integração com o Docker Desktop.
- **Sem JDK 25**: `./mvnw -Djava.version=21 verify` compila com JDK 21.
- **Banco de dev com textos em inglês**: foi semeado antes da tradução (o seed usa `ON CONFLICT DO NOTHING`). Rode `docker compose down -v` e suba de novo.
- **Tela não reflete a mudança**: reinicie o `npm run dev` depois de aplicar patches grandes.
