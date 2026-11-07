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
| `/api/` | Backend NestJS (`backend:8080`) | `tbfernandes-backend/` |
| — | Proxy nginx | `tbfernandes-nginx/` |
| — | PostgreSQL 17, só em `127.0.0.1:5434` | serviço `postgres` do `compose.yaml` |

O navegador chama `/api` na mesma origem, então não há CORS. Variáveis em [.env.example](../.env.example). `NEXT_PUBLIC_*` entram no código na hora do build: depois de mudá-las, rode `docker compose up -d --build`.

```bash
docker compose logs -f backend                          # logs de um serviço
docker compose exec postgres psql -U tbf -d tbfernandes # \dn lista schemas, \dt work.* tabelas
docker compose down                                     # para tudo e mantém os dados
```

**Os dados reais ficam no volume `api_tbf-pgdata`.** `docker compose down -v` apaga esse volume. Não use sem ter um backup.

### Backup do banco

O serviço `backup` sobe junto com o compose e faz um `pg_dump` a cada 10 minutos (`TBF_BACKUP_INTERVAL`, em segundos) em `./backups/` no host (`TBF_BACKUP_DIR`). A pasta fica fora dos volumes do Docker, então sobrevive ao `docker compose down -v`, e não vai para o git. Só o arquivo mais recente fica guardado: o anterior é apagado depois que o novo foi gerado e conferido com `pg_restore --list`.

Proteção contra banco vazio: se o dump novo tiver menos da metade do tamanho do anterior (`TBF_BACKUP_MIN_RATIO`, em %), o serviço entende que o banco foi recriado, mantém o backup antigo e avisa no log. Se você apagou muitos dados de propósito, rode um backup com `TBF_BACKUP_FORCE=true`, ou apague o arquivo antigo.

```bash
docker compose logs -f backup                                   # acompanhar os backups
docker compose exec backup sh /usr/local/bin/backup.sh now      # backup agora
```

Para restaurar depois de apagar o volume, suba só o banco e restaure antes de subir o backend:

```bash
docker compose down -v
docker compose up -d postgres backup
docker compose exec backup sh /usr/local/bin/backup.sh restore  # o mais recente; ou passe o nome do arquivo
docker compose up -d --build
```

A restauração usa `pg_restore --clean --if-exists` numa transação só e traz junto o `flyway_schema_history`, então o backend sobe sem reaplicar migrações. Enquanto ela roda, o serviço não faz backups.

Se a porta 80 estiver ocupada, use `TBF_HTTP_PORT=8090` no `.env`.

### Deploy

No servidor, no `.env`: `TBF_PROFILE=prod` (sem dados de exemplo e com login), `TBF_AUTH_MODE=session`, `TBF_DB_PASSWORD` forte, `TBF_SESSION_SECRET` (`openssl rand -hex 32`, para as sessões sobreviverem a um reinício) e `TBF_AUTH_BOOTSTRAP_*` para criar a conta. O perfil `prod` só aceita cookie seguro, então o acesso precisa ser por HTTPS: o nginx deste repositório escuta só na porta 80 e o certificado fica em um proxy à frente dele.

Um banco que já rodou no perfil `dev` tem o seed de exemplo registrado em `flyway_schema_history` e não sobe em `prod`. O deploy começa com um volume novo (`TBF_PGDATA_VOLUME`), e os dados entram por `pg_dump`/`pg_restore`.

## Desenvolvimento

### Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| Node.js | 22 (o mesmo do CI) | npm vem junto |
| Docker | Docker Desktop com integração WSL, ou Docker Engine no Ubuntu | O PostgreSQL de desenvolvimento é o serviço `postgres` do compose; os testes e2e usam Testcontainers |

## Backend

```bash
docker compose up -d postgres   # PostgreSQL 17 em localhost:5434
cd tbfernandes-backend
cp .env.example .env.local      # opcional: sem ele, valem os padrões
npm install
npm run dev                     # aplica as migrações e o seed de dev; recarrega ao salvar
```

- API: http://localhost:8080/api/v1/tasks
- Swagger UI: http://localhost:8080/swagger-ui (JSON em `/v3/api-docs`)
- Saúde: http://localhost:8080/actuator/health

O banco é o mesmo container e o mesmo volume do compose completo, na porta 5434. Pare o serviço `backend` do compose antes, se ele estiver no ar: `docker compose stop backend`.

Autenticação, variáveis de ambiente e perfis: [tbfernandes-backend/README.md](../tbfernandes-backend/README.md) e [.env.example](../tbfernandes-backend/.env.example).

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
docker compose up -d postgres && cd tbfernandes-backend && npm run dev
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
cd tbfernandes-backend && npm run dev

# Bancos de teste no widget, em tbfernandes-frontend/.env.local
NEXT_PUBLIC_PLUGGY_SANDBOX=true
```

Sem webhook, conectar e o botão "Sincronizar" já funcionam. Para atualizar sozinho, a Pluggy precisa de uma URL HTTPS pública (em local, um túnel como ngrok):

```bash
export PLUGGY_WEBHOOK_SECRET=$(openssl rand -hex 32)   # o mesmo valor na API
tbfernandes-backend/scripts/pluggy-register-webhook.sh https://seu-host/api/v1/webhooks/pluggy
```

## Assistente com IA

Desligado por padrão: o assistente responde por regras. Para ligar, configure no `.env` da raiz (compose) ou no `tbfernandes-backend/.env.local` (`npm run dev`).

### Configuração gratuita: Groq + Ollama

O modelo de linguagem roda na Groq, que tem plano gratuito sem cartão (com limite de requisições por minuto e por dia). Os embeddings rodam no Ollama, na sua máquina.

```bash
COMPOSE_PROFILES=ai                       # sobe o ollama e baixa o modelo de embedding
TBF_ASSISTANT_MODEL=openai-compatible
TBF_ASSISTANT_MODEL_API_KEY=gsk_...       # https://console.groq.com/keys
# TBF_ASSISTANT_MODEL_NAME=openai/gpt-oss-120b
# TBF_ASSISTANT_MODEL_BASE_URL=https://api.groq.com/openai/v1
TBF_ASSISTANT_EMBEDDING=ollama
# TBF_ASSISTANT_EMBEDDING_NAME=bge-m3
```

`docker compose up -d --build` sobe também o serviço `ollama` (porta `127.0.0.1:11434`, mude com `TBF_OLLAMA_PORT` se o Ollama já estiver instalado no host), e o `ollama-models` baixa o `bge-m3` uma vez para o volume `tbf-ollama`. Com `npm run dev`, suba só o Ollama com `docker compose --profile ai up -d ollama ollama-models`; o backend usa `OLLAMA_BASE_URL=http://localhost:11434`. Para ver os modelos que a Groq oferece hoje: `curl -H "Authorization: Bearer $KEY" https://api.groq.com/openai/v1/models`.

`openai-compatible` serve para qualquer API no formato da OpenAI, trocando a URL: xAI (`https://api.x.ai/v1`, pago) ou o próprio Ollama (`http://ollama:11434/v1` no compose, para rodar tudo offline com, por exemplo, `qwen3:8b`).

### Anthropic e Voyage (pagos)

```bash
TBF_ASSISTANT_MODEL=anthropic
ANTHROPIC_API_KEY=...          # https://console.anthropic.com
# TBF_ASSISTANT_MODEL_NAME=claude-opus-5-5
TBF_ASSISTANT_EMBEDDING=voyage
VOYAGE_API_KEY=...             # https://dash.voyageai.com
# TBF_ASSISTANT_EMBEDDING_NAME=voyage-3.5-lite
```

### Traces na Langfuse

Cada pergunta vira um trace na Langfuse com os passos `plan-query`, `run-query` ou `answer-by-rules`, `retrieve-passages`, `embed-query`/`embed-documents`, `rewrite-answer` e `answer-from-passages`. Cada chamada ao modelo aparece como generation, com modelo, tokens e o raciocínio do modelo.

```bash
TBF_ASSISTANT_TRACING=langfuse
LANGFUSE_PUBLIC_KEY=pk-lf-...             # projeto na Langfuse, Settings > API Keys
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com   # EU: https://cloud.langfuse.com
```

O ambiente do trace é o `TBF_PROFILE` (`dev`, `prod`, `desktop`). E-mails e CPFs são mascarados antes do envio. Com o tracing ligado, a pergunta, os prompts, os trechos de notas usados no RAG e as respostas vão para a Langfuse.

### O que sai da aplicação

Com um modelo ligado, a pergunta e o texto da resposta, com os nomes e valores dos registros encontrados, vão para o provedor (a Groq na configuração gratuita). Com embeddings no Ollama, o texto das notas e snippets não sai da máquina; com a Voyage, ele vai para lá na primeira pergunta e depois só o que mudar. Perguntas abertas buscam nas notas por palavras mesmo sem embeddings. No app desktop, defina as mesmas variáveis como variáveis de usuário do Windows (o Ollama é instalado à parte). Como funciona: [etapa 10](backend/implementacao/etapa-10-assistente-ia.md) e [etapa 11](backend/implementacao/etapa-11-rag.md).

## Testes e verificação

```bash
cd tbfernandes-backend && npm run lint && npm run typecheck && npm test   # unidade e regras de arquitetura
cd tbfernandes-backend && npm run test:e2e             # HTTP até o PostgreSQL real (Testcontainers)
cd tbfernandes-frontend && npm run lint && npm run build
cd tbfernandes-frontend && npm run api:types            # com a API no ar: regenera os tipos TypeScript do OpenAPI
```

O CI (`.github/workflows/ci.yml`) roda os mesmos comandos a cada push na `main` e em cada PR. O job `images` também constrói as imagens do `compose.yaml`, sobe tudo e chama `/api/v1/tasks` e `/` pelo nginx.

## Problemas comuns

- **Testes e2e falham ao subir container**: o Docker não está rodando ou o WSL não tem integração com o Docker Desktop. Sem Docker, use um PostgreSQL já no ar: `TBF_TEST_DB_HOST=localhost TBF_TEST_DB_PORT=5434 npm run test:e2e`.
- **Banco de dev com textos em inglês**: foi semeado antes da tradução (o seed usa `ON CONFLICT DO NOTHING`). Recriar o banco apaga os dados reais do volume `api_tbf-pgdata`, então só faça isso em um volume de teste (`TBF_PGDATA_VOLUME`).
- **Tela não reflete a mudança**: reinicie o `npm run dev` depois de aplicar patches grandes.
