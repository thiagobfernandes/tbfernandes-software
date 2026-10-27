# Decisões técnicas — TBFernandes Software

Status: proposta inicial (2026-10-23), revisada em 2026-10-27. Cada decisão pode ser revista quando um problema real justificar.

> **Atualizações desde a proposta:** os módulos do backend ficaram `shared`, `identity`, `work` (empresas, projetos e tarefas, ADR-002), `knowledge`, `goals`, `learning`, `finance`, `contacts` e `assistant`; as camadas de cada módulo são `domain`, `application`, `adapter/in/web` e `adapter/out/persistence` (veja [backend/arquitetura.md](backend/arquitetura.md)). Desde 2026-10-27 os **textos de interface são em português (pt-BR)**; código continua em inglês.

## 1. Arquitetura: monólito modular

- **Um único backend implantável** (Spring Boot), dividido em módulos de domínio: `identity`, `company`, `project`, `task`, `goal`, `learning`, `finance`, `contact`, `knowledge`, `assistant`.
- **Frontend separado** (Next.js) consumindo a API HTTP do backend.
- **Um único banco** PostgreSQL, com um schema lógico por módulo quando fizer sentido; migrations com Flyway. pgvector entra na fase do assistente.
- **Monorepo**: `web/` (frontend), `api/` (backend) e `docs/` no mesmo repositório, para versionar contrato e telas juntos.
- Sem microserviços, mensageria externa ou cache distribuído até existir necessidade medida.

Por quê: um usuário, um time de uma pessoa e domínio ainda em descoberta. O monólito modular dá fronteiras claras entre domínios sem o custo operacional de vários serviços, e permite extrair um módulo depois (por exemplo, o orquestrador de IA) se for preciso.

## 2. Padrões

### Backend
- **Package by feature**: cada módulo contém `api` (controllers e DTOs), `application` (casos de uso), `domain` (entidades e regras) e `infrastructure` (repositórios, integrações).
- **Spring Modulith** para verificar fronteiras entre módulos em teste e publicar **eventos de domínio** entre módulos (ex.: `TaskCompleted` alimenta histórico e dashboard) em vez de chamadas diretas a internals.
- Módulos se comunicam só por interfaces públicas (`<module>.api`) ou eventos. Nenhum módulo acessa repositório de outro.
- **DTOs na borda**: entidades JPA nunca saem do módulo.
- **Erros no formato Problem Details (RFC 9457)**, já tratado pelo cliente do frontend (`web/src/lib/api/client.ts`).
- **Contrato OpenAPI** gerado pelo springdoc; tipos TypeScript do frontend gerados a partir dele (openapi-typescript).
- Validação com Bean Validation no backend, sempre (o frontend valida só para UX).
- Auditoria simples: `created_at`, `updated_at` e tabela de eventos para mudanças relevantes.
- Testes: JUnit 5, Testcontainers com PostgreSQL real, teste de arquitetura do Modulith.

### Frontend
- Next.js App Router, **Server Components por padrão**, Client Components só onde há interação.
- Código organizado por feature em `src/features/<feature>`; páginas em `src/app` são finas.
- shadcn/ui como base; cores só via tokens em `globals.css`.
- Formulários: React Hook Form + Zod. TanStack Query só quando houver mutações frequentes que justifiquem.
- Código e rotas em inglês; textos de interface em pt-BR (mudança de 2026-10-27). Detalhes em [frontend/arquitetura.md](frontend/arquitetura.md).

### Processo
- Entregas pequenas por funcionalidade, de ponta a ponta (migration → API → tela).
- Conventional Commits; PRs pequenos.

## 3. Linguagens e stack

| Camada | Escolha |
|---|---|
| Backend | Java 25 (LTS) + Spring Boot 4, Maven Wrapper |
| Banco | PostgreSQL 17 + Flyway (pgvector depois) |
| Frontend | TypeScript + Next.js 16 + React 19 + Tailwind CSS 4 + shadcn/ui |
| Testes | JUnit 5, Testcontainers; no frontend, Vitest + Playwright quando houver fluxo real |
| Ambiente local | Docker Compose para o PostgreSQL |

## 4. Suposições assumidas (confirmar)

- O sistema começa **pessoal (um usuário)**, mas todas as tabelas já têm `owner_id` para não bloquear multiusuário.
- O chatbot terá **acesso somente leitura** na primeira versão.
- Finanças começam com registros manuais.
