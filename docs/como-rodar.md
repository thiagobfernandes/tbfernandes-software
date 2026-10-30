# Como rodar

Ambiente de referência: Windows com **WSL (Ubuntu)**, repositório em `~/projects/tbfernandes-software`.

## Tudo com Docker Compose

É o jeito mais simples de usar o sistema, e o mesmo do deploy. Só precisa do Docker.

```bash
cp .env.example .env        # opcional: sem ele, valem os padrões
docker compose up -d --build
```

Abra http://localhost. O nginx é a única porta de entrada:

| Caminho | Destino | Pasta |
|---|---|---|
| `/` | Frontend Next.js (`frontend:3000`) | `tbfernandes-frontend/` |
| `/api/` | Backend Spring Boot (`backend:8080`) | `tbfernandes-backend/` |
| — | Proxy nginx | `tbfernandes-nginx/` |
| — | PostgreSQL 17, só em `127.0.0.1:5434` | `tbfernandes-backend/compose.yaml` |

O navegador chama `/api` na mesma origem, então não há CORS. Variáveis em [.env.example](../.env.example). `NEXT_PUBLIC_*` entram no código na hora do build: depois de mudá-las, rode `docker compose up -d --build`.

```bash
docker compose logs -f backend                          # logs de um serviço
docker compose exec postgres psql -U tbf -d tbfernandes # \dn lista schemas, \dt work.* tabelas
docker compose down                                     # para tudo e mantém os dados
```

**Os dados reais ficam no volume `api_tbf-pgdata`.** `docker compose down -v` apaga esse volume. Não use sem ter um backup.

Se a porta 80 estiver ocupada, use `TBF_HTTP_PORT=8090` no `.env`.

### Deploy

No servidor, no `.env`: `TBF_PROFILE=prod` (sem dados de exemplo e com login), `TBF_AUTH_MODE=session`, `TBF_DB_PASSWORD` forte e `TBF_AUTH_BOOTSTRAP_*` para criar a conta. O perfil `prod` só aceita cookie seguro, então o acesso precisa ser por HTTPS: o nginx deste repositório escuta só na porta 80 e o certificado fica em um proxy à frente dele.

Um banco que já rodou no perfil `dev` tem o seed de exemplo registrado no Flyway e não sobe em `prod`. O deploy começa com um volume novo (`TBF_PGDATA_VOLUME`), e os dados entram por `pg_dump`/`pg_restore`.

## Desenvolvimento

### Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| JDK | 25 | `sdk install java 25-tem` (SDKMAN). Maven não é necessário: use `./mvnw` |
| Node.js | 22 (o mesmo do CI) | npm vem junto |
| Docker | Docker Desktop com integração WSL, ou Docker Engine no Ubuntu | O backend sobe o PostgreSQL pelo `tbfernandes-backend/compose.yaml`; os testes usam Testcontainers |

## Backend

```bash
cd tbfernandes-backend
./mvnw spring-boot:run     # sobe o PostgreSQL 17 do compose, aplica as migrações e o seed de dev
```

- API: http://localhost:8080/api/v1/tasks
- Swagger UI: http://localhost:8080/swagger-ui.html
- Saúde e módulos: http://localhost:8080/actuator/health, http://localhost:8080/actuator/modulith

O banco é o mesmo container e o mesmo volume do compose da raiz, na porta 5434. Pare o serviço `backend` do compose antes, se ele estiver no ar: `docker compose stop backend`.

O jar empacotado (`java -jar`) não sobe o compose sozinho: rode `docker compose up -d` em `tbfernandes-backend/` antes.

Autenticação, variáveis de ambiente e perfis: [tbfernandes-backend/README.md](../tbfernandes-backend/README.md).

## Frontend

```bash
cd tbfernandes-frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

| `NEXT_PUBLIC_DATA_SOURCE` | Comportamento |
|---|---|
| `local` (padrão) | Dados de exemplo simulados, salvos no localStorage do navegador. Não precisa do backend. Configurações → "Restaurar dados de exemplo" reinicia |
| `api` | Lê e grava na API em `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8080`). Com `TBF_AUTH_MODE=session` na API, aparece a tela de login |

Depois de trocar `.env.local`, reinicie o `npm run dev`.

## Backend e frontend fora do Docker

```bash
# terminal 1
cd tbfernandes-backend && ./mvnw spring-boot:run
# terminal 2
cd tbfernandes-frontend && echo "NEXT_PUBLIC_DATA_SOURCE=api" >> .env.local && npm run dev
```

Para levar dados criados no modo local para a API: Configurações → Dados → "Importar dados salvos neste navegador".

## Open Finance (Pluggy)

Desligado por padrão: a tela "Contas conectadas" avisa e os lançamentos manuais seguem normais. Para ligar, com a API em modo `api` no frontend:

```bash
# Credenciais em https://dashboard.pluggy.ai
export PLUGGY_ENABLED=true
export PLUGGY_CLIENT_ID=...
export PLUGGY_CLIENT_SECRET=...
cd tbfernandes-backend && ./mvnw spring-boot:run

# Bancos de teste no widget, em tbfernandes-frontend/.env.local
NEXT_PUBLIC_PLUGGY_SANDBOX=true
```

Sem webhook, conectar e o botão "Sincronizar" já funcionam. Para atualizar sozinho, a Pluggy precisa de uma URL HTTPS pública (em local, um túnel como ngrok):

```bash
export PLUGGY_WEBHOOK_SECRET=$(openssl rand -hex 32)   # o mesmo valor na API
tbfernandes-backend/scripts/pluggy-register-webhook.sh https://seu-host/api/v1/webhooks/pluggy
```

## Testes e verificação

```bash
cd tbfernandes-backend && ./mvnw verify                # unidade, integração (Testcontainers) e ArchitectureTests
cd tbfernandes-frontend && npm run lint && npm run build
cd tbfernandes-frontend && npm run api:types            # com a API no ar: regenera os tipos TypeScript do OpenAPI
```

O CI (`.github/workflows/ci.yml`) roda os mesmos comandos a cada push na `main` e em cada PR.

## Problemas comuns

- **Testes do backend falham ao subir container**: o Docker não está rodando ou o WSL não tem integração com o Docker Desktop.
- **Sem JDK 25**: `./mvnw -Djava.version=21 verify` compila com JDK 21.
- **Banco de dev com textos em inglês**: foi semeado antes da tradução (o seed usa `ON CONFLICT DO NOTHING`). Recriar o banco apaga os dados reais do volume `api_tbf-pgdata`, então só faça isso em um volume de teste (`TBF_PGDATA_VOLUME`).
- **Tela não reflete a mudança**: reinicie o `npm run dev` depois de aplicar patches grandes.
