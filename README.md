# TBFernandes Software

Plataforma de gestão pessoal e profissional: empresas, projetos, tarefas, conhecimento, metas, aprendizado, finanças, contatos e um assistente.

| Pasta | Conteúdo |
|---|---|
| `web/` | Frontend Next.js 16 (App Router, TypeScript, Tailwind CSS 4, shadcn/ui) |
| `api/` | Backend Spring Boot 4.1 (Java 25, Spring Modulith, PostgreSQL 17, Flyway) |
| `docs/` | Requisitos, arquitetura, padrões de código, design e backlog ([índice](docs/README.md)) |

## Rodar

```bash
# backend (precisa do Docker)
cd api && ./mvnw spring-boot:run

# frontend
cd web && cp .env.example .env.local && npm install && npm run dev
```

Abra http://localhost:3000. Por padrão o frontend usa dados de exemplo no navegador; com `NEXT_PUBLIC_DATA_SOURCE=api` no `web/.env.local` ele lê e grava na API. Passo a passo em [docs/como-rodar.md](docs/como-rodar.md).

## Para quem programa (e para o Claude Code)

Comece pelo [CLAUDE.md](CLAUDE.md): regras do projeto e links para cada documento.
