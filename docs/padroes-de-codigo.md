# Padrões de código

Regras para qualquer mudança no repositório, por pessoa ou pelo Claude Code. Quando um padrão aqui conflitar com o código existente, siga o código existente e corrija este documento.

## Idioma

| O quê | Idioma |
|---|---|
| Textos de interface, toasts, validações, mensagens de erro da API para o usuário, respostas do assistente | português (pt-BR) |
| Documentação em `docs/`, `README`s, `CLAUDE.md` | português |
| Nomes no código: classes, funções, variáveis, rotas, tabelas, colunas, enums, chaves JSON | inglês |
| Comentários de código | inglês (como o código atual) |
| Mensagens de commit | inglês, Conventional Commits |

Datas e dinheiro sempre formatados com `Intl` em `pt-BR` (dinheiro em BRL).

## Geral

- Código claro antes de esperto. Funções pequenas, nomes que dizem o que a coisa é.
- Sem código morto, `console.log` ou `System.out` esquecido.
- Não adicionar dependência sem motivo concreto; preferir o que a stack já tem.
- Segredos só por variável de ambiente. Variáveis `NEXT_PUBLIC_*` só com valores que podem ir para o navegador.

## Backend

Base: [arquitetura do backend](backend/arquitetura.md) e [tbfernandes-backend/CLAUDE.md](../tbfernandes-backend/CLAUDE.md).

- **Pacote por módulo** (`com.tbfernandes.api.<modulo>`) e, dentro dele, camadas `domain`, `application`, `infrastructure` (quando precisa), `protocols` e `web`. Sem `adapter/in`, `adapter/out` nem `port/out`.
- **Domínio puro**: entidades e value objects sem anotações de Spring/JPA. Invariantes no construtor ou em métodos de comportamento (`task.changeStatus(next, clock)`), nunca em setters soltos.
- **Um serviço de aplicação por agregado** (`TaskService`). Passou de ~300 linhas, divida.
- **Interfaces**: repositórios no domínio; integrações externas em `application`. A implementação fica em `infrastructure` (`<Agregado>RepositoryImpl`, `PluggyOpenFinanceGateway`).
- **DTOs em `protocols`** como `record` público, um por arquivo; entidade JPA nunca sai de `infrastructure.persistence`; mapeamento explícito JPA ⇄ domínio.
- **Validação**: Bean Validation nos DTOs de entrada; regras de negócio no domínio lançando `BusinessRuleViolation` com o id da regra (`RN-07`).
- **Erros**: Problem Details (RFC 9457) pelo `ApiExceptionHandler`. Nunca expor stack trace ou SQL.
- **Entre módulos**: só `*Lookup` público ou eventos (`@ApplicationModuleListener`). Nada de FK entre schemas.
- **Banco**: Flyway, uma migração nova por mudança, `snake_case`, enums como `text` + `CHECK`, `numeric(14,2)` para dinheiro, `owner_id` e colunas de auditoria em toda raiz de agregado.
- **Datas**: `LocalDate` para dias, `Instant` (UTC) para momentos.
- **Nomes de teste**: `*Test` (unidade, sem Spring), `*Tests` (com Spring). Integração sempre com PostgreSQL real (Testcontainers).

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
| Domínio (backend) | Cada regra RN-xx | JUnit 5, sem Spring |
| Módulo (backend) | HTTP → caso de uso → banco | `*ApiIntegrationTests`, Testcontainers |
| Arquitetura | Fronteiras de módulo e regra de dependência | `ArchitectureTests` (Modulith + ArchUnit) |
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
- `./mvnw verify` verde (inclui `ArchitectureTests`).
- `npm run lint` e `npm run build` sem erros; tela conferida em claro, escuro e celular.
- Endpoint no OpenAPI; erros em Problem Details; textos em pt-BR.
- Migração Flyway nova (nunca editar uma aplicada).
- Docs e backlog atualizados.
