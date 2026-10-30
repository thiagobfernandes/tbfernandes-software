@AGENTS.md

# Frontend (tbfernandes-frontend/) — regras para o Claude Code

Leia também: [arquitetura do frontend](../docs/frontend/arquitetura.md), [design](../docs/design/referencias.md) e [padrões de código](../docs/padroes-de-codigo.md#frontend).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estrito · Tailwind CSS 4 · shadcn/ui (Radix) · React Hook Form + Zod 4 · lucide-react · sonner (toasts) · next-themes · Prettier com `prettier-plugin-tailwindcss`.

O Next.js desta versão tem mudanças em relação ao que você conhece: o bloco do `AGENTS.md` acima manda consultar `node_modules/next/dist/docs/` antes de usar uma API do Next.

## Onde fica cada coisa

| Caminho | Conteúdo |
|---|---|
| `src/app/(dashboard)/<rota>/page.tsx` | Página fina: `metadata` + componente da feature |
| `src/features/<feature>/{components,schemas,types,lib,hooks}` | Código da feature |
| `src/components/layout` | Shell: sidebar, header, nav mobile, `DataGate` |
| `src/components/shared` | Peças reutilizáveis (`MetricCard`, `EntityFormDialog`, `ConfirmDelete`, `EmptyState`, `PageHeading`…) |
| `src/components/ui` | Primitivos shadcn (adicionar com `npx shadcn@latest add <componente>`) |
| `src/lib/sample-data/store.ts` | Store único das telas (`useAppData`, `dataActions`, `workActions`) |
| `src/lib/api/` | `apiFetch`, `remote-store.ts` (sincronização com a API), `schema.d.ts` (gerado) |
| `src/lib/constants/navigation.ts` | Sidebar: grupos por área com subitens |
| `src/lib/today.ts` | `useToday()` / `currentDay()`: data real no modo API, `SAMPLE_TODAY` no modo local |
| `src/app/globals.css` | Tokens de cor (claro e escuro) |

## Regras

- Textos de interface em **pt-BR**; identificadores em inglês. Datas e dinheiro com `Intl` em `pt-BR` (`lib/dates.ts`, `lib/money.ts`).
- Server Components por padrão; `"use client"` só onde há interação ou uso do store.
- Telas leem dados com `useAppData()` e gravam com `dataActions`/`workActions`. Não chame `apiFetch` direto de um componente: o store cuida do modo local e do modo API. A exceção é `features/finance/lib/connections-api.ts`: conexões bancárias só existem no servidor.
- Ids novos: `uuidv7()` de `lib/api/uuid.ts` (a API aceita via `X-Client-Id`, ADR-007).
- Formulários: schema Zod em `features/<f>/schemas/`, mensagens de validação em pt-BR; formulários simples usam `EntityFormDialog` com configuração de campos.
- Cores só por tokens (`bg-card`, `text-muted-foreground`, `text-success`…). Nada de hex solto em componente.
- Nova rota: página em `src/app/(dashboard)/…`, item em `navigation.ts` dentro do grupo da área, entrada na busca (`features/search/search-index.ts`) se fizer sentido.
- Toda tela precisa funcionar no celular (sidebar vira `mobile-nav`, quadro aceita arrastar por toque).
- Mudou um tipo que existe na API? Atualize o backend junto ou rode `npm run api:types` com a API no ar.

## Verificar

```bash
npm run lint
npm run build
npm run dev   # conferir a tela em claro/escuro e em ~390px de largura
```
