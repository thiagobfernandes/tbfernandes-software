# Arquitetura do frontend

Versão 0.1 · 2026-10-27 · Complementa [decisoes-tecnicas.md](../decisoes-tecnicas.md)

## 1. Resumo

- **Next.js 16 (App Router)**, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, em `tbfernandes-frontend/`.
- **Organização por feature**: páginas finas em `src/app`, código em `src/features/<feature>`.
- **Um store no cliente** (`src/lib/sample-data/store.ts`) é a fonte de dados de todas as telas. Ele funciona em dois modos:
  - `local` (padrão): simula a API com dados de exemplo salvos no localStorage;
  - `api`: carrega as 17 coleções da API Spring Boot e envia cada mudança para ela.
- **Interface em pt-BR**, código em inglês.

## 2. Pastas

```
tbfernandes-frontend/src
├── app/
│   ├── layout.tsx              raiz: fontes, ThemeProvider, Toaster
│   └── (dashboard)/            shell com sidebar e DataGate; uma pasta por rota
├── components/
│   ├── layout/                 app-sidebar, app-header, mobile-nav, nav-links, breadcrumbs, data-gate, theme-toggle
│   ├── shared/                 peças reutilizáveis entre features
│   └── ui/                     primitivos shadcn/ui
├── features/<feature>/
│   ├── components/             telas e componentes da feature (<feature>-page.tsx é a tela)
│   ├── schemas/                schemas Zod dos formulários
│   ├── types/                  tipos de domínio (espelham o JSON da API)
│   ├── lib/                    funções puras da feature (cálculos, agrupamentos)
│   └── hooks/                  hooks da feature
├── hooks/                      hooks genéricos
└── lib/
    ├── tbfernandes-backend/                    client.ts (apiFetch + Problem Details), remote-store.ts, transfer.ts, uuid.ts, schema.d.ts
    ├── constants/navigation.ts sidebar
    ├── sample-data/            store.ts e dados de exemplo por área
    ├── dates.ts, money.ts      formatação pt-BR
    ├── today.ts                "hoje" (real no modo API, SAMPLE_TODAY no local)
    └── env.ts                  variáveis NEXT_PUBLIC_*
```

## 3. Rotas e navegação

A sidebar tem grupos recolhíveis por área, cada um com subitens (`lib/constants/navigation.ts`):

| Área | Rotas | Feature |
|---|---|---|
| — | `/` Visão geral, `/calendar` Calendário, `/assistant` Assistente | dashboard, calendar, assistant |
| Trabalho | `/companies`, `/companies/[id]`, `/projects`, `/projects/[id]`, `/tasks` | companies, projects, tasks |
| Conhecimento | `/knowledge` Notas, `/knowledge/snippets`, `/knowledge/graph`, `/methods`, `/methods/[id]` | knowledge, methods |
| Crescimento | `/goals`, `/goals/[id]`, `/learning`, `/certifications` | goals, learning |
| Finanças | `/finance` Fluxo de caixa, `/finance/purchases` Compras planejadas | finance |
| Rede | `/contacts` | contacts |
| — | `/settings` Configurações (aparência, dados, exportar/importar) | settings |

Busca global: `Ctrl/⌘ K` (`features/search`), cobrindo todos os módulos. Ao criar uma rota nova, adicione-a em `navigation.ts` e, se tiver registros, em `search-index.ts`.

## 4. Dados

```
tela ──useAppData()──▶ store ──(modo api)──▶ remote-store ──apiFetch──▶ /api/v1/<coleção>
     ◀──────────────── (modo local) localStorage "tbf-sample-data-v2"
```

- **Leitura**: `useAppData()` devolve `AppData` (todas as coleções) via `useSyncExternalStore`.
- **Escrita**: `dataActions.create/update/remove(coleção, …)` ou atalhos de domínio como `workActions.setTaskStatus`. A mudança aparece na hora (otimista).
- **Modo API**: cada mudança vai para a API uma de cada vez, em ordem; a resposta substitui o registro local. Se a API recusar (ex.: RN-07), aparece um toast com o motivo e o store recarrega tudo.
- **Ids**: gerados no navegador com `uuidv7()` e aceitos pela API com `X-Client-Id` (ADR-007).
- **DataGate** (`components/layout/data-gate.tsx`): carregamento, "API fora do ar" e login no modo `session`.
- **Tipos da API**: `npm run api:types` gera `lib/api/schema.d.ts` do OpenAPI.
- **Exportar/importar** (`lib/api/transfer.ts`): JSON no formato `AppData`, importação idempotente.

Telas nunca chamam `apiFetch` diretamente para coleções; o store é o único caminho. Exceção: o assistente faz `POST /assistant/questions` no modo API.

## 5. Componentes compartilhados

| Componente | Uso |
|---|---|
| `PageContainer`, `PageHeading` | Moldura e título de cada tela |
| `MetricCard`, `metric-visuals` | Cards de número grande no estilo Luma |
| `EntityFormDialog`, `FormField` | Formulários de criar/editar descritos por configuração + Zod |
| `ConfirmDelete` | Confirmação de exclusão |
| `EmptyState`, `MissingRecord`, `PageSkeleton`, `DetailSkeleton` | Estados vazio, não encontrado e carregando |
| `PriorityBadge`, `ProgressBar`, `TagInput`, `MultiSelectList` | Peças de formulário e listas |
| `RelationTree` | Árvore de vínculos estilo grafo |
| `Markdown`, `CodeBlock` | Notas e snippets |
| `SampleDataBadge` | Selo "dados de exemplo" (some no modo API) |

## 6. Padrões de tela

- Lista com filtros + alternância Lista/Quadro quando o recurso tem status (tarefas); datas no `/calendar`; timeline nos projetos.
- Quadro kanban com arrastar e soltar, inclusive por toque (`features/tasks/hooks/use-touch-drag.ts`).
- Detalhe em página própria (`/projects/[id]`) ou em `Sheet` lateral (tarefa).
- Criar/editar em `Dialog`; excluir sempre com confirmação; feedback por toast (sonner).
- Visual: veja [design/referencias.md](../design/referencias.md).
