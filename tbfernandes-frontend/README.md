# web

Frontend Next.js da TBFernandes Software.

- `npm run dev`: servidor de desenvolvimento em http://localhost:3000
- `npm run build`: build de produção
- `npm run lint`: ESLint
- `npm run api:types`: gera `src/lib/api/schema.d.ts` a partir do OpenAPI da API rodando

`NEXT_PUBLIC_DATA_SOURCE=local` (padrão) usa dados de exemplo salvos no navegador; `api` lê e grava na API Spring Boot.

Regras e estrutura: [CLAUDE.md](CLAUDE.md), [docs/frontend/arquitetura.md](../docs/frontend/arquitetura.md) e [docs/design/referencias.md](../docs/design/referencias.md).
