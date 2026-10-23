# TBFernandes Software

Personal and professional management platform: companies, projects, tasks, knowledge, and (later) goals, learning, finance, contacts, and an AI assistant.

| Folder | Contents |
|---|---|
| `web/` | Next.js frontend (App Router, TypeScript, Tailwind CSS, shadcn/ui) |
| `api/` | Spring Boot backend (not created yet) |
| `docs/` | Product and technical decisions |

## Frontend

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. The dashboard shows sample data, marked as such, until the API exists.

See [docs/decisoes-tecnicas.md](docs/decisoes-tecnicas.md) for the architecture, patterns, and stack.
