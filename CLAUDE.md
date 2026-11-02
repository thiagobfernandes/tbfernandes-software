# TBFernandes Software — guia para o Claude Code

Plataforma pessoal e profissional do Thiago: trabalho (empresas, projetos, tarefas), conhecimento (notas, snippets, grafo, métodos), crescimento (metas, aprendizado, certificações), finanças, contatos e um assistente.

Este arquivo é o ponto de entrada. Ele é curto de propósito: leia o documento ligado antes de mexer na área correspondente.

## Repositório

| Pasta | Conteúdo | Regras locais |
|---|---|---|
| `tbfernandes-frontend/` | Frontend Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui | [tbfernandes-frontend/CLAUDE.md](tbfernandes-frontend/CLAUDE.md) |
| `tbfernandes-backend/` | Backend Spring Boot 4.1, Java 25, Spring Modulith, PostgreSQL 17, Flyway | [tbfernandes-backend/CLAUDE.md](tbfernandes-backend/CLAUDE.md) |
| `tbfernandes-nginx/` | Proxy reverso: `/` para o frontend, `/api` para o backend | — |
| `tbfernandes-desktop/` | App Windows (Tauri 2): janela, backend e PostgreSQL embutidos, instalador NSIS | [docs/desktop.md](docs/desktop.md) |
| `compose.yaml` | Sobe tudo (banco, backend, frontend, nginx) para uso local e deploy | [docs/como-rodar.md](docs/como-rodar.md) |
| `docs/` | Toda a documentação (índice em [docs/README.md](docs/README.md)) | — |
| `.github/workflows/ci.yml` | CI: `./mvnw verify` no backend; `npm ci && npm run lint && npm run build` no frontend | — |

## Onde está cada regra

| Preciso de… | Documento |
|---|---|
| Rodar o projeto (WSL, Docker, front e back) | [docs/como-rodar.md](docs/como-rodar.md) |
| Padrões de código, idioma, commits, Definition of Done | [docs/padroes-de-codigo.md](docs/padroes-de-codigo.md) |
| Requisitos funcionais, não funcionais e regras de negócio (RF/RNF/RN) | [docs/backend/requisitos.md](docs/backend/requisitos.md) |
| Arquitetura do backend, clean architecture, ADRs | [docs/backend/arquitetura.md](docs/backend/arquitetura.md) |
| Arquitetura do frontend (rotas, features, store, modo API) | [docs/frontend/arquitetura.md](docs/frontend/arquitetura.md) |
| Design: referências visuais, tokens, padrões de tela | [docs/design/referencias.md](docs/design/referencias.md) |
| Modelo de dados e contrato REST | [docs/backend/modelo-de-dados.md](docs/backend/modelo-de-dados.md), [docs/backend/api.md](docs/backend/api.md) |
| Diagramas UML | [docs/backend/diagramas.md](docs/backend/diagramas.md) |
| Backlog, épicos e o que falta | [docs/backend/backlog.md](docs/backend/backlog.md), [docs/estado-atual.md](docs/estado-atual.md) |
| Decisões gerais de stack | [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md) |
| O que foi feito em cada etapa | [docs/backend/implementacao/](docs/backend/implementacao/README.md) |

## Regras que valem sempre

1. **Idioma.** Textos de interface, toasts, mensagens de erro para o usuário, respostas do assistente e documentação: **português (pt-BR)**. Código (nomes de classes, funções, variáveis, rotas, colunas, enums): **inglês**. Comentários de código seguem o idioma do arquivo em volta (hoje inglês no código).
2. **Monólito modular.** Um backend (`tbfernandes-backend/`), um frontend (`tbfernandes-frontend/`), um banco. Sem microserviços, filas ou cache distribuído sem necessidade medida.
3. **Fronteiras de módulo.** No backend, um módulo só usa a API pública de outro (`*Lookup` no pacote raiz) ou eventos. Nunca o repositório nem as classes internas de outro módulo. `ArchitectureTests` verifica.
4. **Clean architecture leve.** `domain` em Java puro → `application` (casos de uso) → `infrastructure` (persistência, integrações), `protocols` (DTOs) e `web` (controllers). Sem pacotes `adapter/in`, `adapter/out` ou `port`. Regras de negócio sempre no domínio, com teste unitário.
5. **Banco só por Flyway.** Nova migração `V<n>__<descricao>.sql`; nunca editar uma já aplicada. Um schema por módulo, sem FK entre schemas.
6. **Frontend por feature.** Páginas finas em `tbfernandes-frontend/src/app`, código em `tbfernandes-frontend/src/features/<feature>`. Toda tela lê e grava pelo store (`tbfernandes-frontend/src/lib/sample-data/store.ts`), que funciona em modo local (simulado) ou API.
7. **Design.** Toda tela nova segue as referências e a linguagem visual aprovada (paleta navy escura, cards de métrica estilo Luma, timeline estilo Cindr, quadro estilo AturnDeck/Ronas). Antes de inventar um layout, procure uma tela existente parecida e reutilize os componentes de `components/shared`. Detalhes em [docs/design/referencias.md](docs/design/referencias.md).
8. **Fatias verticais.** Entregas pequenas de ponta a ponta: migração → domínio → caso de uso → API → tela, com testes e docs atualizados no mesmo commit.
9. **Documentar junto.** Mudou regra, modelo, contrato ou tela? Atualize o documento correspondente em `docs/` no mesmo commit. Itens do backlog citados no commit (`[WRK-04]`).
10. **Segredos** só em variáveis de ambiente (`.env.local`, que não vai para o git). Nada de credenciais no repositório.

## Comandos rápidos

```bash
# Backend (precisa de Docker rodando; sobe o PostgreSQL do compose automaticamente)
cd tbfernandes-backend && ./mvnw spring-boot:run      # http://localhost:8080, Swagger em /swagger-ui.html
cd tbfernandes-backend && ./mvnw verify               # testes (Testcontainers + ArchitectureTests)

# Frontend
cd tbfernandes-frontend && npm install && npm run dev  # http://localhost:3000
cd tbfernandes-frontend && npm run lint && npm run build
cd tbfernandes-frontend && npm run api:types           # regenera src/lib/api/schema.d.ts a partir da API rodando
```

`NEXT_PUBLIC_DATA_SOURCE=local` (padrão) usa dados simulados no navegador; `api` lê e grava na API. Veja [docs/como-rodar.md](docs/como-rodar.md).

## Antes de terminar uma tarefa

- Backend: `./mvnw verify` verde (inclui `ArchitectureTests`).
- Frontend: `npm run lint` e `npm run build` sem erros; conferir a tela em claro e escuro e em largura de celular.
- Docs atualizados e commit no padrão Conventional Commits (ver [padrões](docs/padroes-de-codigo.md#commits-e-entregas)).
