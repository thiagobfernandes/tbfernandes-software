# Backlog do backend

Versão 0.1 · 2026-10-26

Cada item tem um id usado nos commits (`feat(work): ... [WRK-04]`) e nos PRs. Tamanho: **P** (até meio dia), **M** (1–2 dias), **G** (3–5 dias). Status: ✅ feito · 🔄 em andamento · ⬜ a fazer.

Ordem de trabalho: uma fatia vertical por vez (migração → domínio → caso de uso → API → tela ligada à API), sempre com testes.

## Definition of Ready

- Requisito (RF/RN) identificado em [requisitos.md](requisitos.md).
- Formato de request/response combinado com o tipo TypeScript da tela.
- Critérios de aceite escritos no item.

## Definition of Done

- Regras no domínio com teste unitário; caso de uso com teste de integração em PostgreSQL (Testcontainers).
- `ArchitectureTests` verde (fronteiras de módulo e regra de dependência).
- Migração Flyway nova (nunca editar uma já aplicada).
- Endpoint documentado no OpenAPI; erros em Problem Details.
- Tela do frontend lendo da API em vez do store simulado, quando o item tiver tela.
- `docs/backend` atualizado se mudou modelo, regra ou contrato.

---

## Épico PLT — Plataforma

| Id | Item | Tam. | Status |
|---|---|---|---|
| PLT-01 | Projeto Spring Boot 4.1 + Java 25 + Maven Wrapper | P | ✅ |
| PLT-02 | PostgreSQL local com `compose.yaml` e Docker Compose support | P | ✅ |
| PLT-03 | Migrações Flyway de todos os módulos + seed `dev` gerado do frontend | M | ✅ |
| PLT-04 | Shared kernel: UUIDv7, `OwnerContext`, Problem Details, CORS, enums em minúsculas | M | ✅ |
| PLT-05 | Testes de arquitetura (Spring Modulith + ArchUnit) e documentação dos módulos gerada | P | ✅ |
| PLT-06 | CI no GitHub Actions: `./mvnw verify` e `npm run build` em cada PR | P | ✅ |
| PLT-07 | Job de verificação de referências órfãs entre módulos (ADR-003) | M | ⬜ |
| PLT-08 | Gerar tipos TS a partir do OpenAPI (`openapi-typescript`) e usar em `web/src/lib/api` | M | ✅ etapa 9 |
| PLT-09 | Paginação padrão (`page`, `size`, `sort`) e resposta paginada | P | ✅ |
| PLT-10 | Tratamento de conflito de versão e de estado (409) | P | ✅ |
| PLT-11 | Logs JSON e perfil `prod` | P | ✅ |
| PLT-12 | Título, versão e descrição no OpenAPI | P | ✅ |

## Épico WRK — Work

| Id | Item | Tam. | Status |
|---|---|---|---|
| WRK-01 | Empresas: criar, editar, listar, detalhar (RF-WRK-01..03, RN-01) | M | ✅ |
| WRK-02 | Projetos: criar, editar, listar por empresa, detalhar (RF-WRK-04..06, RN-02, RN-03) | M | ✅ |
| WRK-03 | Tarefas: CRUD, filtro por projeto e status (RF-WRK-07, 08, 10, 11) | M | ✅ |
| WRK-04 | Mudança de status com `completedAt` e evento `TaskCompleted` (RF-WRK-09, RN-06, RN-07) | P | ✅ |
| WRK-05 | Checklist itemizado (RF-WRK-12, RN-08) | P | ✅ |
| WRK-06 | Filtro por prazo (`dueFrom`, `dueTo`, `overdue=true`) para linha do tempo e atrasadas | P | ✅ |
| WRK-07 | Resumo do painel: abertas, atrasadas, concluídas na semana, projetos ativos (RF-WRK-13) | M | ✅ |
| WRK-08 | `WorkLookup` público para outros módulos validarem empresa/projeto/tarefa | P | ✅ |
| WRK-09 | Evento `TaskDeleted` para limpar vínculos de conhecimento e follow-ups | P | ✅ |
| WRK-10 | Ligar telas Companies, Projects e Tasks à API (trocar `workActions` por `apiFetch`) | G | ✅ etapa 9 |
| WRK-11 | Excluir empresa sem projetos (com projetos: 409) e projeto, mantendo as tarefas sem projeto (RN-01) | P | ✅ |

Critérios de aceite principais:
- WRK-04: mover para `done` preenche `completedAt`; sair de `done` limpa; `blocked → done` retorna 422 com `rule: "RN-07"`.
- WRK-02: projeto `active` em empresa `closed` retorna 422 com `rule: "RN-03"`.

## Épico KNW — Knowledge

| Id | Item | Tam. | Status |
|---|---|---|---|
| KNW-01 | Notas: CRUD com tags (RF-KNW-01) | M | ✅ |
| KNW-02 | Snippets: CRUD (RF-KNW-02, RN-11) | M | ✅ |
| KNW-03 | Vínculos com projetos e tarefas (RF-KNW-03) | P | ✅ |
| KNW-04 | Busca por texto (`tsvector`) e por tag (RF-KNW-04) | M | ✅ |
| KNW-05 | Endpoint do grafo: nós e arestas (RF-KNW-05). Movido para o módulo assistant, que já lê todos os módulos | M | ✅ etapa 8 |
| KNW-06 | Ouvir `TaskDeleted` e remover vínculos | P | ✅ |
| KNW-07 | Métodos: CRUD com passos e exemplos (RF-KNW-06) | M | ✅ |
| KNW-08 | Ligar telas Knowledge, Snippets, Graph e Methods à API | G | ✅ etapa 9 |

## Épico GOL — Goals

| Id | Item | Tam. | Status |
|---|---|---|---|
| GOL-01 | Metas: CRUD com indicador (RF-GOL-01, RF-GOL-04) | M | ✅ |
| GOL-02 | Submetas sem ciclos (RF-GOL-02, RN-19) | P | ✅ |
| GOL-03 | Marcos (RF-GOL-03, RN-09) | P | ✅ |
| GOL-04 | Itens vinculados à meta, via consultas públicas dos outros módulos (RF-GOL-05) | M | ✅ |
| GOL-05 | Ouvir `TaskCompleted` e registrar progresso (RF-GOL-06) | P | ✅ |
| GOL-06 | Ligar telas Goals e Goal detail à API | M | ✅ etapa 9 |

## Épico LRN — Learning

| Id | Item | Tam. | Status |
|---|---|---|---|
| LRN-01 | Estudos com habilidades (RF-LRN-01) | M | ✅ |
| LRN-02 | Materiais (RF-LRN-02) | P | ✅ |
| LRN-03 | Habilidades (RF-LRN-03, RN-13) | P | ✅ |
| LRN-04 | Certificações (RF-LRN-04, RN-14) | P | ✅ |
| LRN-05 | Formação (RF-LRN-05) | P | ✅ |
| LRN-06 | Aviso de certificações vencendo (RF-LRN-06) | P | ✅ |
| LRN-07 | Ligar telas Learning e Certifications à API | M | ✅ etapa 9 |

## Épico FIN — Finance (manual)

| Id | Item | Tam. | Status |
|---|---|---|---|
| FIN-01 | Lançamentos: CRUD com escopo (RF-FIN-01, RN-12) | M | ✅ |
| FIN-02 | Fluxo de caixa mensal por escopo (RF-FIN-02) | M | ✅ |
| FIN-03 | Metas de compra (RF-FIN-03, RN-17, RN-18) | M | ✅ |
| FIN-04 | Projeção de data da meta de compra (RF-FIN-04) | P | ✅ |
| FIN-05 | Ligar telas Cash flow e Purchases à API | M | ✅ etapa 9 |

## Épico FIN-OF — Open Finance com Pluggy (em aberto)

Já existe: a porta `OpenFinanceGateway`, o adaptador desligado (padrão) e o esqueleto `PluggyOpenFinanceGateway`, além das colunas `source` e `external_id` em `finance.entry`.

| Id | Item | Tam. | Status |
|---|---|---|---|
| FIN-OF-01 | Decidir escopo: quais contas, quanto histórico, categorização própria ou da Pluggy | P | ⬜ |
| FIN-OF-02 | Autenticação na Pluggy (`/auth`) com cache da API key | P | ⬜ |
| FIN-OF-03 | Connect token e tela "Conectar banco" com o widget Pluggy Connect | M | ⬜ |
| FIN-OF-04 | Tabelas `bank_connection` e `bank_account`; salvar conexão (`itemId`) | M | ⬜ |
| FIN-OF-05 | Importar transações paginadas para `finance.entry` sem duplicar (RN-16) | G | ⬜ |
| FIN-OF-06 | Webhook `item/updated` para sincronização incremental, com verificação de origem | M | ⬜ |
| FIN-OF-07 | Teste de contrato do adaptador com WireMock (sem chamar a Pluggy no CI) | M | ⬜ |
| FIN-OF-08 | Tela de contas conectadas: status, última sincronização, desconectar | M | ⬜ |

## Épico CTC — Contacts

| Id | Item | Tam. | Status |
|---|---|---|---|
| CTC-01 | Contatos: CRUD (RF-CTC-01) | M | ✅ |
| CTC-02 | Interações (RF-CTC-02, RN-10) | P | ✅ |
| CTC-03 | Follow-up: cria tarefa pelo `work` e guarda o id (RF-CTC-03) | M | ✅ |
| CTC-04 | Próximos contatos e vencidos (RF-CTC-04) | P | ✅ |
| CTC-05 | Ligar tela Contacts à API | M | ✅ etapa 9 |

## Épico AST — Assistant

| Id | Item | Tam. | Status |
|---|---|---|---|
| AST-01 | Portar o assistente por regras (`web/src/features/assistant/lib/answer.ts`) para a API (RF-AST-01) | M | ✅ etapa 8 |
| AST-02 | Porta `LanguageModel` e adaptador desligado | P | ✅ etapa 8 |
| AST-03 | Respostas com IA, só leitura, citando os registros usados (RF-AST-02, RN-20) | G | ⬜ |
| AST-04 | pgvector e embeddings de notas e snippets | G | ⬜ |

## Épico IDN — Identity e segurança

| Id | Item | Tam. | Status |
|---|---|---|---|
| IDN-01 | Login com Spring Security, sessão em cookie HttpOnly (RNF-SEG-01) | G | ✅ |
| IDN-02 | `OwnerContext` a partir do usuário logado | P | ✅ |
| IDN-03 | Configurações do usuário (RF-GEN-03) | P | ✅ |
| IDN-06 | Limitar tentativas de login por IP/e-mail | P | ⬜ |
| IDN-04 | Exportar todos os dados em JSON (RF-GEN-01). Feito no frontend, que já tem o formato `AppData`, lendo da API | M | ✅ etapa 9 |
| IDN-05 | Importar dados do localStorage do modo simulado (RF-GEN-02). Feito no frontend, gravando pela API | M | ✅ etapa 9 |

---

## Sequência sugerida

| Etapa | Itens | Resultado |
|---|---|---|
| 1 (esta entrega) | PLT-01..05, WRK-01..05 | estrutura, banco local, documentação e Work na API |
| 2 | PLT-06, PLT-08, PLT-12, WRK-06..10 | telas de Work usando a API real |
| 3 | KNW-01..08 | Knowledge completo |
| 4 | GOL-01..06, LRN-01..07 | Growth completo |
| 5 | FIN-01..05, CTC-01..05 | Finance manual e Contacts |
| 6 | IDN-01..05, PLT-09..11 | login e pronto para deploy |
| 7 | FIN-OF-01..08 | Open Finance com Pluggy |
| 8 | AST-01, AST-02, KNW-05 | assistente por regras e grafo na API; IA (AST-03, AST-04) em aberto |
| 9 | PLT-08, IDN-04, IDN-05 | todas as telas lendo e gravando pela API (`NEXT_PUBLIC_DATA_SOURCE=api`), login, exportar e importar |
