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
| 2 | Perfil `desktop` no backend: PostgreSQL embutido, porta livre, só `127.0.0.1`, single-user, filtro do token, CORS para a janela | A fazer |
| 3 | Projeto Tauri em `tbfernandes-desktop/`: inicia o backend, splash, espera o health, fecha tudo ao sair, instância única | A fazer |
| 4 | Instalador NSIS por usuário, ícones, pasta de dados, backup com `pg_dump` | A fazer |
| 5 | Atualização automática (GitHub Releases) e workflow de release em `windows-latest` | A fazer |

## Etapa 1: frontend

- `TBF_TARGET=desktop npm run build` (ou `npm run build:desktop`) gera `out/` com `output: "export"` e `trailingSlash`. Sem a variável, o build continua `standalone` para o Docker.
- `cacheComponents` e `partialPrefetching` ficam desligados no build desktop, porque precisam de um servidor Next.
- O build desktop sempre usa a API (`env.dataSource === "api"`).
- `lib/env.ts` lê `window.__TBF_DESKTOP__` (injetado pelo Tauri). `apiUrl` vem dali, com `NEXT_PUBLIC_API_URL` como reserva, e `apiFetch` manda o token no header `X-TBF-Desktop-Token`.
- Rotas de detalhe: `/projects/view?id=`, `/companies/view?id=`, `/goals/view?id=`, `/methods/view?id=`. O backend (assistente e grafo) gera os mesmos links.

## Contrato com o backend (etapa 2)

- O backend recebe porta e token pela linha de comando ou variáveis de ambiente e só aceita requisições com `X-TBF-Desktop-Token` igual ao token. Isso impede que um site aberto no navegador chame a API local.
- CORS precisa liberar a origem da janela (`http://tauri.localhost` no Windows) e o header `X-TBF-Desktop-Token`.
