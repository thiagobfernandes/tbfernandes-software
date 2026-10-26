# Requisitos do backend — TBFernandes Software

Versão 0.1 · 2026-10-26 · Status: proposta para revisão

Este documento descreve o que a API Spring Boot precisa fazer para substituir o armazenamento simulado do frontend (`web/src/lib/sample-data/store.ts`). Os requisitos foram levantados a partir das telas e dos tipos do frontend (`web/src/features/*/types`). Cada requisito tem um identificador usado no código, nos testes e no [backlog](backlog.md).

Prioridade (MoSCoW): **M** = obrigatório no MVP, **S** = deveria ter, **C** = pode ter, **W** = fora do escopo agora.

## 1. Visão geral

Plataforma pessoal e profissional de gestão de um único usuário (por enquanto): empresas, projetos e tarefas; conhecimento (notas, snippets, métodos); metas; aprendizado; finanças; contatos; e um assistente que responde perguntas sobre esses dados.

### 1.1 Atores

| Ator | Descrição |
|---|---|
| Usuário (dono) | Thiago. Único usuário na v1; todas as tabelas já têm `owner_id` para permitir multiusuário. |
| Frontend web | Next.js em `web/`, cliente HTTP da API. |
| Provedor Open Finance | Pluggy (planejado). Fornece contas e transações bancárias. |
| Provedor de IA | Planejado para o assistente; atrás de uma porta de saída. |

### 1.2 Escopo da v1 (MVP)

Dentro: Work (empresas, projetos, tarefas), Knowledge, Goals, Learning, Finance com lançamentos manuais, Contacts, e o assistente baseado em regras (igual ao do frontend).
Fora: login multiusuário, integração Pluggy, assistente com IA, notificações, app mobile. Esses itens estão no backlog como épicos futuros.

## 2. Requisitos funcionais

### 2.1 Work — Empresas (`/companies`)

| ID | Requisito | Prio |
|---|---|---|
| RF-WRK-01 | Cadastrar empresa com nome, nome fantasia, relação (`contractor`, `client`, `partner`, `own`), status, descrição, data de início e contato principal. | M |
| RF-WRK-02 | Editar empresa, inclusive o status (`active`, `inactive`, `closed`). Excluir só empresa sem projetos (RN-01). | M |
| RF-WRK-03 | Listar empresas e ver o detalhe com seus projetos e o progresso das tarefas. | M |

### 2.2 Work — Projetos (`/projects`)

| ID | Requisito | Prio |
|---|---|---|
| RF-WRK-04 | Cadastrar projeto com nome, descrição, empresa (opcional), categoria, status, cor, datas de início e prazo, próxima entrega e meta vinculada. | M |
| RF-WRK-05 | Editar projeto e mudar o status (`planned`, `active`, `paused`, `completed`). Excluir projeto mantém as tarefas, sem projeto (RN-01). | M |
| RF-WRK-06 | Listar projetos, filtrando por empresa, e ver o detalhe com tarefas, notas e snippets vinculados. | M |

### 2.3 Work — Tarefas (`/tasks`)

| ID | Requisito | Prio |
|---|---|---|
| RF-WRK-07 | Criar tarefa com título, descrição, projeto, status, prioridade, tag, datas, critério de pronto, checklist e meta vinculada. | M |
| RF-WRK-08 | Editar tarefa. | M |
| RF-WRK-09 | Mudar o status de uma tarefa (quadro kanban com arrastar e soltar), registrando a conclusão (RN-06). | M |
| RF-WRK-10 | Excluir tarefa, com confirmação no frontend. | M |
| RF-WRK-11 | Listar tarefas filtrando por projeto, status e prazo (visões lista, quadro e linha do tempo). | M |
| RF-WRK-12 | Manter checklist itemizado da tarefa (adicionar, marcar, remover itens). | M |
| RF-WRK-13 | Painel (dashboard) com totais: tarefas abertas, atrasadas, concluídas na semana, projetos ativos. | S |

### 2.4 Knowledge (`/knowledge`, `/methods`)

| ID | Requisito | Prio |
|---|---|---|
| RF-KNW-01 | CRUD de notas em Markdown com tags. | M |
| RF-KNW-02 | CRUD de snippets de código com linguagem, explicação, URL de origem e tags. | M |
| RF-KNW-03 | Vincular notas e snippets a projetos e tarefas (muitos para muitos). | M |
| RF-KNW-04 | Buscar notas e snippets por texto e por tag. | S |
| RF-KNW-05 | Grafo de conhecimento: nós (notas, snippets, projetos, tarefas, tags) e arestas, para a tela de grafo. | S |
| RF-KNW-06 | CRUD de métodos de trabalho com categoria, passos ordenados, exemplos e data da última revisão. | M |

### 2.5 Goals (`/goals`)

| ID | Requisito | Prio |
|---|---|---|
| RF-GOL-01 | CRUD de metas com área, status, prioridade, estado atual, resultado desejado, critério de pronto, prazo e indicador mensurável. | M |
| RF-GOL-02 | Submetas (meta com meta-pai). | M |
| RF-GOL-03 | CRUD de marcos (milestones) de uma meta, marcando como feitos. | M |
| RF-GOL-04 | Atualizar o valor atual do indicador. | M |
| RF-GOL-05 | Mostrar o que está vinculado a uma meta: projetos, tarefas, estudos e compras. | S |
| RF-GOL-06 | Atualizar o progresso da meta quando uma tarefa vinculada é concluída (evento `TaskCompleted`, RN-22). | C |

### 2.6 Learning (`/learning`, `/certifications`)

| ID | Requisito | Prio |
|---|---|---|
| RF-LRN-01 | CRUD de estudos com status, meta, habilidades, datas e próxima atividade. | M |
| RF-LRN-02 | CRUD de materiais (vídeo, artigo, livro etc.) com status de consumo, opcionalmente ligados a um estudo. | M |
| RF-LRN-03 | CRUD de habilidades com nível autodeclarado de 1 a 5 e evidência. | M |
| RF-LRN-04 | CRUD de certificações com emissor, status, datas e URL de validação, ligadas a estudos. | M |
| RF-LRN-05 | CRUD de formação acadêmica. | M |
| RF-LRN-06 | Avisar certificações que vencem nos próximos 60 dias. | C |

### 2.7 Finance (`/finance`)

| ID | Requisito | Prio |
|---|---|---|
| RF-FIN-01 | CRUD de lançamentos (receita ou despesa), com escopo pessoal ou empresa, categoria, valor em BRL, data e recorrência. | M |
| RF-FIN-02 | Fluxo de caixa por mês: entradas, saídas e saldo, separados por escopo. | M |
| RF-FIN-03 | CRUD de metas de compra com valor estimado, reservado, economia mensal, prioridade, data desejada e status. | M |
| RF-FIN-04 | Projeção de quando a meta de compra será atingida com a economia mensal. | S |
| RF-FIN-05 | Conectar contas bancárias via Open Finance (Pluggy) e importar transações. | W (épico FIN-OF) |

### 2.8 Contacts (`/contacts`)

| ID | Requisito | Prio |
|---|---|---|
| RF-CTC-01 | CRUD de contatos com empresa (cadastrada ou só o nome), cargo, e-mail, telefone, perfil, especialidades, contexto e próximo contato. | M |
| RF-CTC-02 | Registrar interações (reunião, ligação, mensagem, evento, indicação). | M |
| RF-CTC-03 | Criar uma tarefa de follow-up a partir de uma interação. | S |
| RF-CTC-04 | Listar contatos com próximo contato vencido ou próximo. | S |

### 2.9 Assistant (`/assistant`)

| ID | Requisito | Prio |
|---|---|---|
| RF-AST-01 | Responder perguntas sobre os dados (projetos, tarefas atrasadas, metas, finanças) com links para os registros usados, igual à versão por regras do frontend. | S |
| RF-AST-02 | Responder com um modelo de IA, usando só leitura (RN-20). | W |

### 2.10 Transversais

| ID | Requisito | Prio |
|---|---|---|
| RF-GEN-01 | Exportar todos os dados do usuário em JSON. | S |
| RF-GEN-02 | Importar os dados salvos no navegador (localStorage `tbf-sample-data-v2`) para a API, para migrar o que já foi usado no modo simulado. | S |
| RF-GEN-03 | Configurações do usuário: nome, fuso horário, idioma. | C |

## 3. Regras de negócio

| ID | Regra | Onde |
|---|---|---|
| RN-01 | Empresa com projetos não é excluída (409); deve ser encerrada. Excluir um projeto mantém suas tarefas, sem projeto, e remove os vínculos de notas e snippets. Excluir uma empresa desvincula os contatos. Igual ao comportamento do frontend. | Work |
| RN-02 | Uma data de fim (prazo, término, validade) nunca é anterior à data de início. | Todos (`Require.dateOrder`) |
| RN-03 | A empresa do projeto precisa existir; empresa encerrada não recebe projeto ativo. | `ProjectService` |
| RN-04 | Todo dado pertence a um dono; uma requisição nunca lê nem altera dado de outro dono (retorna 404). | Todos |
| RN-05 | Referências entre módulos (ex.: `task.goal_id`) são validadas pela aplicação, não por FK. | Todos |
| RN-06 | Ao mudar para `done`, a tarefa registra `completedAt`; ao sair de `done`, o campo é limpo. | `Task` |
| RN-07 | Tarefa bloqueada não vai direto para `done`; precisa ser desbloqueada antes. | `Task` |
| RN-08 | Progresso do checklist: `0 <= done <= total`. Com itens, o progresso vem dos itens. | `Task` |
| RN-09 | Excluir uma meta exclui suas submetas e marcos. | Goals |
| RN-10 | Excluir um contato exclui suas interações. | Contacts |
| RN-11 | Código de snippet é guardado exatamente como digitado e nunca é executado. | Knowledge |
| RN-12 | Receita da empresa não é renda pessoal: o fluxo de caixa separa os escopos `personal` e `business`. | Finance |
| RN-13 | Nível de habilidade é autodeclarado (1 a 5); não é medida objetiva. | Learning |
| RN-14 | Certificação `obtained` exige data de obtenção; validade, se houver, é posterior. | Learning |
| RN-15 | Com Open Finance desligado, os lançamentos manuais funcionam normalmente. | Finance |
| RN-16 | Transação importada não é duplicada: `(owner_id, external_id)` é único. | Finance |
| RN-17 | Meta de compra `bought` exige o valor pago. | Finance |
| RN-18 | Valor reservado pode passar do estimado (sinaliza folga), mas nunca é negativo. | Finance |
| RN-19 | Uma meta não pode ser submeta dela mesma nem de uma descendente (sem ciclos). | Goals |
| RN-20 | O assistente só lê dados; nunca cria, altera ou exclui. | Assistant |
| RN-21 | Só uma meta com indicador aceita atualização de progresso. | Goals |
| RN-23 | Um contato aponta para uma empresa cadastrada ou só para o nome de uma organização, nunca os dois. | Contacts |
| RN-24 | Uma interação gera no máximo uma tarefa de follow-up. | Contacts |
| RN-25 | Senha entre 12 e 128 caracteres, sem regras de composição; trocar a senha exige a atual. Login errado responde igual para e-mail desconhecido e senha errada. | Identity |
| RN-22 | Concluir uma tarefa vinculada a uma meta ativa a meta se ela estiver planejada; se o indicador da meta é contado em `tasks`, ele soma 1. | Goals (`Goal.linkedTaskCompleted`) |

## 4. Requisitos não funcionais

### 4.1 Arquitetura e manutenibilidade

| ID | Requisito |
|---|---|
| RNF-ARQ-01 | Monólito modular com Spring Modulith: um módulo por domínio; módulos só usam a API pública (pacote raiz) ou eventos uns dos outros. Verificado por teste (`ArchitectureTests`). |
| RNF-ARQ-02 | Clean architecture dentro de cada módulo: `domain` em Java puro, `application` com casos de uso e portas, `adapter` com web e persistência. Regra de dependência verificada com ArchUnit. |
| RNF-ARQ-03 | Integrações externas (Pluggy, IA) sempre atrás de uma porta de saída, com um adaptador desligável por configuração. |
| RNF-ARQ-04 | Esquema do banco versionado só por Flyway; Hibernate apenas valida (`ddl-auto=validate`). |
| RNF-ARQ-05 | Contrato da API em OpenAPI (springdoc), usado para gerar os tipos TypeScript do frontend. |

### 4.2 Segurança

| ID | Requisito |
|---|---|
| RNF-SEG-01 | Autenticação obrigatória antes de qualquer deploy fora da máquina local (épico IDN). Sessão por cookie HttpOnly, SameSite=Lax, porque o frontend já envia `credentials: "include"`. |
| RNF-SEG-02 | CORS liberado só para a origem do frontend (`tbf.cors.allowed-origins`). |
| RNF-SEG-03 | Toda tabela de raiz de agregado tem `owner_id`; toda consulta filtra por ele. |
| RNF-SEG-04 | Validação de entrada com Bean Validation na borda e invariantes no domínio. |
| RNF-SEG-05 | Segredos (credenciais Pluggy, banco de produção) só por variáveis de ambiente; nunca no repositório. |
| RNF-SEG-06 | Erros não expõem stack trace nem SQL; formato Problem Details. |

### 4.3 Desempenho e confiabilidade

| ID | Requisito |
|---|---|
| RNF-DES-01 | p95 abaixo de 300 ms nas listagens com até 5 000 registros por coleção, medido localmente. |
| RNF-DES-02 | Listagens com mais de 100 itens possíveis são paginadas (`page`, `size`). |
| RNF-CONF-01 | Concorrência otimista com coluna `version`; conflito retorna 409. |
| RNF-CONF-02 | Eventos entre módulos persistidos no registro do Spring Modulith (`event_publication`) e republicados após reinício. |
| RNF-CONF-03 | Backup diário do PostgreSQL quando houver ambiente fora da máquina local. |

### 4.4 Qualidade e operação

| ID | Requisito |
|---|---|
| RNF-QLD-01 | Testes unitários para toda regra de negócio (RN-xx) no domínio. |
| RNF-QLD-02 | Testes de integração com PostgreSQL real via Testcontainers; nada de H2. |
| RNF-QLD-03 | Build e testes no CI (GitHub Actions) a cada PR. |
| RNF-OPS-01 | Health check em `/actuator/health`; mapa dos módulos em `/actuator/modulith`. |
| RNF-OPS-02 | Logs estruturados (JSON) fora do perfil `dev`. |
| RNF-OPS-03 | Ambiente local sobe com um comando (`./mvnw spring-boot:run`, que inicia o `compose.yaml`). |

### 4.5 Interoperabilidade e usabilidade da API

| ID | Requisito |
|---|---|
| RNF-API-01 | REST JSON versionado em `/api/v1`. Campos em camelCase e enums em minúsculas, no mesmo formato dos tipos do frontend. |
| RNF-API-02 | Datas em ISO 8601: `date` para dias (`2026-10-23`), `instant` em UTC para momentos. |
| RNF-API-03 | Valores monetários em BRL com duas casas decimais (`numeric(14,2)`). |
| RNF-API-04 | Erros em RFC 9457 Problem Details: `errors` com erros por campo (400) e `rule` com a regra violada (422). |

## 5. Rastreabilidade

| Tela do frontend | Requisitos | Módulo |
|---|---|---|
| Dashboard | RF-WRK-13, RF-FIN-02, RF-GOL-01 | work, finance, goals |
| Companies / Company detail | RF-WRK-01..03 | work |
| Projects / Project detail | RF-WRK-04..06, RF-KNW-03 | work, knowledge |
| Tasks (lista, quadro, linha do tempo) | RF-WRK-07..12 | work |
| Knowledge, Snippets, Graph | RF-KNW-01..05 | knowledge |
| Methods | RF-KNW-06 | knowledge |
| Goals / Goal detail | RF-GOL-01..05 | goals |
| Learning, Certifications | RF-LRN-01..06 | learning |
| Finance (cash flow, purchases) | RF-FIN-01..04 | finance |
| Contacts | RF-CTC-01..04 | contacts |
| Assistant | RF-AST-01 | assistant |
| Settings | RF-GEN-01..03 | identity |
