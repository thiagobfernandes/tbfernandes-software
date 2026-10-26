# Etapa 9 — Frontend usando a API

Data: 2026-10-26 · Itens: PLT-08, IDN-04, IDN-05 e a troca das telas para a API

## Objetivo

Fazer as telas do frontend lerem e gravarem na API real sem reescrevê-las, mantendo o modo simulado como padrão até a API estar no ar.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| — | `NEXT_PUBLIC_DATA_SOURCE=api\|local`. Em `api`, o store começa vazio, carrega as 17 coleções e envia cada criação, edição e exclusão para o endpoint da coleção. As telas não mudaram: continuam usando `useAppData`, `dataActions` e `workActions`. | `web/src/lib/sample-data/store.ts`, `web/src/lib/api/remote-store.ts` |
| — | Mudanças enviadas uma de cada vez, em ordem. A resposta da API substitui o registro local, trazendo campos calculados como `completedAt` e os ids do checklist. Se a API recusa (por exemplo RN-07, tarefa bloqueada concluída), aparece um aviso com o motivo e os dados são recarregados. | `remote-store.ts` |
| — | Ids gerados no navegador (UUIDv7) e aceitos pela API pelo cabeçalho `X-Client-Id`. O registro tem o mesmo id antes e depois de salvo (ADR-007). | `web/src/lib/api/uuid.ts`, `shared/domain/ClientIds`, `ClientIdFilter` |
| — | Tela de carregamento, tela "a API não responde" e login no modo `session`. O cliente envia o cabeçalho `X-XSRF-TOKEN` a partir do cookie. | `web/src/components/layout/data-gate.tsx`, `web/src/lib/api/client.ts` |
| — | O assistente usa `POST /assistant/questions` no modo `api`. O selo "Sample data" some nesse modo. | `assistant-page.tsx`, `sample-data-badge.tsx` |
| IDN-04 | Configurações → Data → **Export JSON**: baixa todas as coleções no formato `AppData`. Funciona nos dois modos. | `web/src/lib/api/transfer.ts`, `data-settings.tsx` |
| IDN-05 | **Import data saved in this browser** e **Import JSON file**: enviam tudo para a API na ordem das dependências (empresas, metas, projetos, tarefas…). Os ids curtos do modo simulado viram o mesmo UUIDv5 do seed de `dev`. Assim, registros que já existem respondem 409 e são pulados, e importar duas vezes não duplica nada. | `transfer.ts` |
| PLT-08 | `npm run api:types` gera `web/src/lib/api/schema.d.ts` a partir do OpenAPI (`openapi-typescript`, sem entrar no `package-lock.json`). Login e pergunta ao assistente já usam esses tipos. | `web/package.json`, `schema.d.ts` |
| — | API: CORS expõe `X-Total-Count`, `X-Page`, `X-Page-Size` e `Location`. Campos desconhecidos no corpo são ignorados. `DataIntegrityViolationException` vira 409. | `WebConfig`, `application.yaml`, `ApiExceptionHandler` |

## Como usar

```bash
# terminal 1
cd api && ./mvnw spring-boot:run
# terminal 2
cd web && echo "NEXT_PUBLIC_DATA_SOURCE=api" >> .env.local && npm run dev
```

Para testar o login, suba a API com `TBF_AUTH_MODE=session` e as variáveis `TBF_AUTH_BOOTSTRAP_*` ([api/README.md](../../../api/README.md#modos-de-autenticação)). Com o e-mail `owner@tbfernandes.local`, a senha vai para o dono dos dados de exemplo.

## Decisões

- **O store continua sendo a fonte das telas**: trocar cada tela por chamadas `fetch` mexeria em dezenas de componentes. Com a sincronização dentro do store, o modo simulado e o modo API usam o mesmo código de tela, e voltar para `local` é só trocar a variável.
- **Otimista com recarga no erro**: a tela responde na hora, como no modo simulado. Quando a API recusa, recarregar tudo é mais simples e mais seguro que desfazer cada mudança.
- **Carregar tudo no início**: com o volume de uma pessoa (centenas de registros), 17 GETs em paralelo são rápidos, e as telas continuam calculando painéis e grafos no navegador. A paginação da API fica para quando alguma coleção crescer.
- **"Hoje" ainda vem de `SAMPLE_TODAY` no navegador** para o que o frontend calcula sozinho (painel, prazos). A API usa a data real. Trocar `SAMPLE_TODAY` pela data real é um passo do frontend, junto com datas de exemplo relativas.

## Verificação

- Backend: 49 testes passando (`ClientIdIntegrationTests` cobre id do cliente, recusa de id já usado sem sobrescrever e cabeçalho inválido).
- Frontend: `npm run lint` e `npm run build` sem erros, nos dois modos.
- Ponta a ponta (Playwright, API real com PostgreSQL e seed, `next start` em modo `api`):
  - **sem login**: as tarefas do seed aparecem; uma tarefa criada na tela continua lá depois de recarregar e existe na API; o assistente responde pela API; as configurações mostram a conexão;
  - **com login**: a tela de login aparece; senha errada é recusada; o login carrega os dados; uma criação com CSRF é salva; sair volta para o login;
  - **importação**: 3 registros novos são criados e o que já existia no seed é pulado; uma segunda importação não cria nada.
