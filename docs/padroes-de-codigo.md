# Padrões de código

Regras para qualquer mudança no repositório, por pessoa ou pelo Claude Code. Quando um padrão aqui conflitar com o código existente, siga o código existente e corrija este documento.

## Idioma

| O quê | Idioma |
|---|---|
| Textos de interface, toasts, validações, mensagens de erro da API para o usuário, respostas do assistente | português (pt-BR) |
| Documentação em `docs/`, `README`s, `CLAUDE.md` | português |
| Nomes no código: classes, funções, variáveis, rotas, tabelas, colunas, enums, chaves JSON | inglês |
| Comentários de código (só quando necessários, ver [Clean code](#clean-code)) | inglês (como o código atual) |
| Mensagens de commit | inglês, Conventional Commits |

Datas e dinheiro sempre formatados com `Intl` em `pt-BR` (dinheiro em BRL).

## Geral

- Código claro antes de esperto. Funções pequenas, nomes que dizem o que a coisa é.
- Sem código morto, `console.log` ou `System.out` esquecido.
- Não adicionar dependência sem motivo concreto; preferir o que a stack já tem.
- Segredos só por variável de ambiente. Variáveis `NEXT_PUBLIC_*` só com valores que podem ir para o navegador.

## Clean code

Valem para o backend e são verificadas pelo ESLint (`tbfernandes-backend/eslint.config.mjs`); o CI falha se alguma for quebrada.

| Regra | Na prática | ESLint |
|---|---|---|
| **Nomes descritivos** | Nada de variável de uma letra: `task`, `details`, `entity`, `index`, `left`/`right` num `sort`. Só `_` para parâmetro ignorado. Função diz o que devolve (`taskRows`, `toReferenceResponse`), não só o assunto. | `id-length` (mín. 2) |
| **Sem sombreamento** | Um nome interno não reaproveita o de fora (`projects.find((candidate) => …)` em vez de `(project)` dentro de `const project = …`). | `@typescript-eslint/no-shadow` |
| **Funções pequenas** | Até 50 linhas (testes ficam de fora). Passou disso, extraia passos com nome: `fromHttp`, `embed`, `termStatistics`. | `max-lines-per-function` |
| **Fluxo plano** | Complexidade ciclomática até 10, no máximo 3 níveis de bloco e 3 callbacks aninhados. Cadeia de `if` que escolhe uma fonte vira funções pequenas encadeadas com `??` (ver `GoalProgresses.of`); `switch` que só mapeia valores vira tabela (ver `LISTINGS` no `QueryEngine`). | `complexity`, `max-depth`, `max-nested-callbacks` |
| **Sem ternário aninhado** | Use `if` com retorno antecipado ou uma função auxiliar. | `no-nested-ternary` |
| **Constantes com nome** | Valor solto com significado vira constante (`DONE_TASK_STATUS`, `LENGTH_NORMALIZATION`). | — |
| **Comentário só quando necessário** | O código diz *o quê*; comentário só explica *por quê*: uma decisão que não é óbvia, um contrato externo, um limite, um risco. Não repita o nome da função ou do tipo ("Implemented in infrastructure", "JSON ↔ Note", "The editable fields of…"). Diretivas do ESLint ficam. | — |

## Backend

Base: [arquitetura do backend](backend/arquitetura.md) e [tbfernandes-backend/CLAUDE.md](../tbfernandes-backend/CLAUDE.md).

- **Pasta por módulo** (`src/modules/<modulo>`) e, dentro dela, camadas `domain`, `application`, `infrastructure` (quando precisa), `protocols` e `web`. API pública só no `index.ts`. Sem `adapter/in`, `adapter/out` nem `port/out`.
- **SOLID**: casos de uso dependem de classes abstratas (`TaskRepository`, `OwnerContext`, `Clock`), ligadas no módulo com `{ provide: Abstração, useClass: Implementação }`.
- **Domínio puro**: TypeScript sem decorators nem pacotes npm (só `node:*`). Invariantes no construtor ou em métodos de comportamento (`task.changeStatus(next, today)`), nunca em propriedades soltas.
- **Um serviço de aplicação por agregado** (`TaskService`). Passou de ~300 linhas, divida.
- **Abstrações**: repositórios no domínio; integrações externas em `application`. A implementação fica em `infrastructure` (`TypeOrm<Agregado>Repository`, `PluggyOpenFinanceGateway`).
- **DTOs em `protocols`**: `*.request.ts` (classe + schema Joi) e `*.response.ts`; entidade TypeORM nunca sai de `infrastructure/persistence`; mappers explícitos linha ⇄ domínio e domínio ⇄ JSON.
- **Validação**: Joi nos DTOs de entrada; regras de negócio no domínio lançando `BusinessRuleViolationError` com o id da regra (`RN-07`).
- **Erros**: Problem Details (RFC 9457) pelo `ProblemDetailsFilter`. Nunca expor stack trace ou SQL.
- **Entre módulos**: só `*Lookup` exportado no `index.ts` ou eventos (`@OnEvent`), na direção de `ALLOWED_MODULE_DEPENDENCIES`. Nada de FK entre schemas.
- **Banco**: migração SQL nova em `db/migration` por mudança, `snake_case`, enums como `text` + `CHECK`, `numeric(14,2)` para dinheiro, `owner_id` e colunas de auditoria em toda raiz de agregado.
- **Datas**: texto `YYYY-MM-DD` (`IsoDate`) para dias, `Date` (UTC) para momentos.
- **Testes**: `*.spec.ts` ao lado do código (unidade, sem Nest quando for domínio); `test/*.e2e-spec.ts` com PostgreSQL real (Testcontainers).

## Frontend

Base: [arquitetura do frontend](frontend/arquitetura.md) e [tbfernandes-frontend/CLAUDE.md](../tbfernandes-frontend/CLAUDE.md).

- **TypeScript estrito**, sem `any`. Tipos de domínio em `features/<f>/types`.
- **Arquivos** em `kebab-case.tsx`; componentes em `PascalCase`; hooks começam com `use`.
- **Importações** com alias `@/`, agrupadas: bibliotecas, depois `@/components`, `@/features`, `@/lib`.
- **Páginas finas** em `src/app`; lógica e UI em `src/features/<feature>/components`.
- **Server Components por padrão**; `"use client"` só onde há estado, efeitos ou o store.
- **Dados**: sempre pelo store (`useAppData`, `dataActions`, `workActions`); ele decide entre modo local e API.
- **Formulários**: React Hook Form + Zod, schema em `features/<f>/schemas/<entidade>-schema.ts`, mensagens em pt-BR.
- **Estilo**: Tailwind com tokens do tema (`bg-card`, `text-muted-foreground`, `border-border`); nenhuma cor hex em componente; `cn()` para classes condicionais. Prettier ordena as classes.
- **Componentes**: reutilize `components/shared` e `components/ui` antes de criar outro. Primitivo novo do shadcn com `npx shadcn@latest add`.
- **Acessibilidade**: botões com texto ou `aria-label`, foco visível, contraste nos dois temas.
- **Responsivo**: toda tela funciona em ~390px.

## Testes

| Camada | O que testar | Ferramenta |
|---|---|---|
| Domínio (backend) | Cada regra RN-xx | Jest, sem Nest |
| Módulo (backend) | HTTP → caso de uso → banco | `test/*.e2e-spec.ts`, supertest, Testcontainers |
| Arquitetura | Fronteiras de módulo e regra de dependência | `src/architecture.spec.ts` e ESLint |
| Frontend | Lint, tipos e build; fluxos críticos com Playwright quando fizer sentido | ESLint, `next build`, Playwright |

Nunca desligar ou pular um teste para o CI passar.

## Commits e entregas

- **Conventional Commits** com escopo do módulo: `feat(work): ...`, `fix(web): ...`, `docs: ...`, `feat(web,api): ...`. Cite o item do backlog: `feat(goals): milestones [GOL-03]`.
- **Fatia vertical**: migração → domínio → caso de uso → API → tela, no mesmo PR quando couber.
- **PRs pequenos**, com descrição do que mudou e como verificar.
- **Docs junto com o código**: regra, modelo, contrato ou tela mudou → `docs/` atualizado no mesmo commit. Etapas grandes ganham uma página em `docs/backend/implementacao/`.

## Definition of Done

- Requisito (RF/RN) identificado em [requisitos](backend/requisitos.md) e atendido.
- Regras no domínio com teste unitário; integração do módulo com PostgreSQL real.
- No backend, `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:e2e` verdes.
- `npm run lint` e `npm run build` sem erros; tela conferida em claro, escuro e celular.
- Endpoint no OpenAPI; erros em Problem Details; textos em pt-BR.
- Migração SQL nova em `db/migration` (nunca editar uma aplicada).
- Docs e backlog atualizados.
