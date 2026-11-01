# App desktop para Windows

Plano completo e comparação de opções: [TBFernandes como app desktop Windows](https://claude.ai/artifact/KfnPGDaVWVAJkHgm2QQ8f3). Decisão de 2026-11-01: **Tauri 2 + PostgreSQL embutido**.

## Arquitetura

```
TBFernandes.exe (Tauri, WebView2)
 ├─ carrega o frontend exportado (tbfernandes-frontend/out)
 ├─ inicia o backend em segundo plano (java -jar, perfil desktop, porta livre em 127.0.0.1)
 │   └─ o backend inicia o PostgreSQL embutido (%LOCALAPPDATA%\TBFernandes\data)
 └─ injeta window.__TBF_DESKTOP__ = { apiUrl, token } antes da página carregar
```

## Etapas

| Etapa | O que entra | Estado |
|---|---|---|
| 1 | Frontend exportável como estático (`npm run build:desktop`), rotas de detalhe com `?id=`, URL da API e token em tempo de execução | Feito |
| 2 | Perfil `desktop` no backend: PostgreSQL embutido, só `127.0.0.1`, single-user, filtro do token, CORS para a janela, desligamento limpo | Feito |
| 3 | Projeto Tauri em `tbfernandes-desktop/`: inicia o backend, splash, espera o health, fecha tudo ao sair, instância única | A fazer |
| 4 | Instalador NSIS por usuário, ícones, pasta de dados, backup com `pg_dump` | A fazer |
| 5 | Atualização automática (GitHub Releases) e workflow de release em `windows-latest` | A fazer |

## Etapa 1: frontend

- `TBF_TARGET=desktop npm run build` (ou `npm run build:desktop`) gera `out/` com `output: "export"` e `trailingSlash`. Sem a variável, o build continua `standalone` para o Docker.
- `cacheComponents` e `partialPrefetching` ficam desligados no build desktop, porque precisam de um servidor Next.
- O build desktop sempre usa a API (`env.dataSource === "api"`).
- `lib/env.ts` lê `window.__TBF_DESKTOP__` (injetado pelo Tauri). `apiUrl` vem dali, com `NEXT_PUBLIC_API_URL` como reserva, e `apiFetch` manda o token no header `X-TBF-Desktop-Token`.
- Rotas de detalhe: `/projects/view?id=`, `/companies/view?id=`, `/goals/view?id=`, `/methods/view?id=`. O backend (assistente e grafo) gera os mesmos links.

## Etapa 2: backend (perfil `desktop`)

Código em `tbfernandes-backend/src/main/java/com/tbfernandes/api/shared/infrastructure/desktop/` e `application-desktop.yaml`.

### Variáveis que o app passa ao backend

| Variável | Para quê |
|---|---|
| `TBF_PORT` | Porta livre que o app escolheu. O backend escuta só em `127.0.0.1` |
| `TBF_DATA_DIR` | Pasta de dados (`%LOCALAPPDATA%\TBFernandes`): banco em `pg/`, senha em `db-password`, logs em `logs/` |
| `TBF_PG_BIN` | Pasta `bin` do PostgreSQL que vai no instalador (`initdb`, `pg_ctl`) |
| `TBF_DESKTOP_TOKEN` | Segredo criado a cada abertura, com 32 caracteres ou mais. Toda requisição precisa mandar `X-TBF-Desktop-Token` com ele, senão recebe 401 |
| `TBF_PARENT_PID` | Processo do app. Se ele sumir, o backend desliga sozinho em até 2 s e para o PostgreSQL |

E `--spring.profiles.active=desktop`.

### O que acontece na abertura

1. `EmbeddedPostgres`: na primeira vez roda `initdb` (usuário `tbf`, senha aleatória, `scram-sha-256`, locale `C`, só TCP em `127.0.0.1`). Se um PostgreSQL ficou rodando de uma abertura que travou, ele é parado antes. Depois sobe numa porta livre e cria o banco `tbfernandes`.
2. O `DataSource` (Hikari) aponta para esse banco e o Flyway roda `db/migration` + `db/desktop` (cria a conta única, sem dados de exemplo).
3. `DesktopTokenFilter` barra quem não manda o token. Preflights de CORS passam. A origem `http://tauri.localhost` é liberada no CORS.
4. Para fechar: `POST /api/v1/desktop/shutdown` (com o token) responde 202, fecha o Spring e para o PostgreSQL (`pg_ctl stop -m fast`).

Abertura medida no Linux: ~11 s na primeira vez (com `initdb` e migrations), ~11 s depois (o Spring é a maior parte).

### Rodar o perfil desktop na mão (WSL/Linux)

O `initdb` não roda como root. Com um PostgreSQL instalado (ex.: `/usr/lib/postgresql/16/bin`):

```bash
cd tbfernandes-backend && ./mvnw -DskipTests package
TBF_PORT=18080 TBF_DATA_DIR=$HOME/.tbf-desktop TBF_PG_BIN=/usr/lib/postgresql/16/bin \
TBF_DESKTOP_TOKEN=$(openssl rand -hex 16) \
java -jar target/tbfernandes-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=desktop
```

O `EmbeddedPostgresTest` usa o PostgreSQL da máquina (`TBF_TEST_PG_BIN` ou o mais novo em `/usr/lib/postgresql`) e é pulado quando não há um ou quando roda como root.
