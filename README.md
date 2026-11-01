# TBFernandes Software

Plataforma de gestão pessoal e profissional: empresas, projetos, tarefas, conhecimento, metas, aprendizado, finanças, contatos e um assistente.

| Pasta | Conteúdo |
|---|---|
| `tbfernandes-frontend/` | Frontend Next.js 16 (App Router, TypeScript, Tailwind CSS 4, shadcn/ui) |
| `tbfernandes-backend/` | Backend Spring Boot 4.1 (Java 25, Spring Modulith, PostgreSQL 17, Flyway) |
| `tbfernandes-nginx/` | Proxy reverso: `/` para o frontend, `/api` para o backend |
| `tbfernandes-desktop/` | App para Windows (Tauri 2) com backend e PostgreSQL embutidos ([docs/desktop.md](docs/desktop.md)) |
| `docs/` | Requisitos, arquitetura, padrões de código, design e backlog ([índice](docs/README.md)) |

## Rodar

```bash
# backend (precisa do Docker)
cd tbfernandes-backend && ./mvnw spring-boot:run

# frontend
cd tbfernandes-frontend && cp .env.example .env.local && npm install && npm run dev
```

Abra http://localhost:3000. Por padrão o frontend usa dados de exemplo no navegador; com `NEXT_PUBLIC_DATA_SOURCE=api` no `tbfernandes-frontend/.env.local` ele lê e grava na API. Passo a passo em [docs/como-rodar.md](docs/como-rodar.md).

## Para quem programa (e para o Claude Code)

Comece pelo [CLAUDE.md](CLAUDE.md): regras do projeto e links para cada documento.
