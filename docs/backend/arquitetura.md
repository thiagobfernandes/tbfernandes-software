# Arquitetura do backend

Versão 0.1 · 2026-10-26 · Complementa [decisoes-tecnicas.md](../decisoes-tecnicas.md)

## 1. Resumo

- **Um único deploy**: Spring Boot 4.1 com Java 25, em `api/`.
- **Monólito modular** com Spring Modulith: cada domínio é um módulo, e o teste `ArchitectureTests` falha se um módulo usar internals de outro.
- **Clean architecture dentro de cada módulo**: as regras de negócio ficam em classes Java puras; Spring, JPA e HTTP ficam nas bordas.
- **PostgreSQL 17**, um schema por módulo, migrações Flyway.
- **Integrações externas atrás de portas**: Pluggy (Open Finance) e o futuro provedor de IA.

## 2. Módulos

| Módulo | Pacote | Schema | Conteúdo | Telas |
|---|---|---|---|---|
| Shared kernel | `shared` | `public` | ids, erros base, dono da requisição, CORS, Problem Details | todas |
| Identity | `identity` | `identity` | usuário dono; login depois | Settings |
| Work | `work` | `work` | empresas, projetos, tarefas, checklist | Dashboard, Companies, Projects, Tasks |
| Knowledge | `knowledge` | `knowledge` | notas, snippets, vínculos, métodos | Knowledge, Snippets, Graph, Methods |
| Goals | `goals` | `goals` | metas, submetas, marcos, indicador | Goals |
| Learning | `learning` | `learning` | estudos, materiais, habilidades, certificações, formação | Learning, Certifications |
| Finance | `finance` | `finance` | lançamentos, metas de compra, porta Open Finance | Finance |
| Contacts | `contacts` | `contacts` | contatos e interações | Contacts |
| Assistant | `assistant` | — | perguntas sobre os dados (só leitura) | Assistant |

A lista de módulos agrupa `company`, `project` e `task` da proposta inicial em um único módulo **Work** (ADR-002).

## 3. Camadas dentro de um módulo

O módulo `work` é a referência; os outros seguem o mesmo desenho.

```
com.tbfernandes.api.work
├── package-info.java            @ApplicationModule: nome e documentação do módulo
├── TaskCompleted.java           API pública: eventos e consultas que outros módulos podem usar
├── domain/                      Java puro: entidades, value objects, regras, portas de repositório
│   ├── company/  Company, CompanyDetails, CompanyRepository (porta)
│   ├── project/  Project, ProjectDetails, ProjectRepository (porta)
│   └── task/     Task, ChecklistItem, TaskDetails, TaskRepository (porta)
├── application/                 casos de uso: orquestram domínio, transação e eventos
│   ├── company/CompanyService
│   ├── project/ProjectService
│   └── task/TaskService
└── adapter/
    ├── in/web/                  controllers REST e DTOs de request/response
    └── out/persistence/         entidades JPA, Spring Data, adaptadores que implementam as portas
```

### Regra de dependência

```
adapter.in.web ─▶ application ─▶ domain ◀─ adapter.out.persistence
```

| Camada | Pode depender de | Não pode depender de |
|---|---|---|
| `domain` | `shared.domain`, JDK | Spring, JPA, Hibernate, `application`, `adapter` |
| `application` | `domain`, `shared.application`, `@Transactional`, `ApplicationEventPublisher` | `adapter`, JPA, Spring Web |
| `adapter` | tudo acima, Spring, JPA, HTTP | adaptadores de outro módulo |

O `ArchitectureTests` verifica as duas primeiras linhas com ArchUnit.

### Por que este nível e não mais

Clean architecture "completa" teria uma interface de caso de uso por operação, objetos de entrada e saída por caso de uso e presenters. Para um time de uma pessoa, isso multiplica arquivos sem proteger mais as regras. A versão adotada mantém o que importa:

- **Regras no domínio**, testáveis sem Spring nem banco (`TaskTest` roda em milissegundos).
- **Portas de saída** como interfaces no domínio (repositórios) ou em `application.port.out` (integrações).
- **Um serviço de aplicação por agregado** em vez de uma classe por caso de uso. Se um serviço passar de ~300 linhas, ele se divide.
- **Mapeamento explícito** entre entidade JPA e domínio no adaptador de persistência. Custa algumas linhas, mas mantém o domínio sem anotações e deixa o schema evoluir sem mexer nas regras.

## 4. Comunicação entre módulos

1. **Eventos de domínio** (preferido): o módulo publica um record da sua API pública, como `work.TaskCompleted`; quem se interessa escuta com `@ApplicationModuleListener`. O Spring Modulith grava a publicação em `event_publication` na mesma transação e entrega depois do commit, com nova tentativa após reinício.
2. **Consulta síncrona**: quando um módulo precisa validar uma referência (ex.: `contacts` verificar se uma empresa existe), o módulo dono expõe uma interface no pacote raiz (ex.: `work.WorkLookup`). Nunca se acessa repositório de outro módulo.
3. **Sem FK entre schemas** (ADR-003): `task.goal_id` é só um `uuid`. A aplicação valida na escrita e os eventos de exclusão limpam vínculos.

## 5. Integrações externas

### Open Finance (Pluggy) — em aberto

- Porta: `finance.application.port.out.OpenFinanceGateway` (token de conexão, contas, transações).
- Adaptadores em `finance.adapter.out.pluggy`:
  - `DisabledOpenFinanceGateway`: padrão; responde com a regra RN-15.
  - `PluggyOpenFinanceGateway`: ativo com `tbf.pluggy.enabled=true`; hoje lança `UnsupportedOperationException`. A implementação é o épico **FIN-OF** do backlog.
- Credenciais por `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`.
- Tabelas `finance.bank_connection` e `finance.bank_account` entram junto com o épico; `finance.entry` já tem `source` e `external_id` para receber transações importadas sem duplicar (RN-16).

### IA do assistente

Mesmo padrão: porta `assistant.application.port.out.LanguageModel`, adaptador por provedor, desligado por padrão. Épico AST.

## 6. Convenções

| Tema | Convenção |
|---|---|
| Ids | UUID v7 gerado na aplicação (`shared.domain.Ids`): ordenado no tempo, bom para índice. |
| Dono | `OwnerContext.currentOwnerId()`; hoje vem de `tbf.owner.id`, depois do usuário logado. |
| Erros | `NotFound` → 404, `BusinessRuleViolation` → 422 com `rule`, validação → 400 com `errors`. |
| Enums | Maiúsculas no Java e no banco (CHECK); minúsculas no JSON e nos parâmetros de URL. |
| Datas | `LocalDate` para dias, `Instant` (UTC) para momentos. |
| Auditoria | `created_at`, `updated_at`, `version` em toda tabela de agregado. |
| Rotas | `/api/v1/<recurso-no-plural>`; mudança de status em `PATCH /{id}/status`. |
| Testes | `*Test` para unidade, `*Tests` com Spring; integração sempre com PostgreSQL do Testcontainers. |

## 7. Decisões de arquitetura (ADR)

### ADR-001 — Clean architecture leve dentro do monólito modular
**Contexto:** o usuário quer separar regras de negócio sem aumentar demais a complexidade.
**Decisão:** domínio puro, casos de uso por agregado, portas e adaptadores; Spring Modulith para as fronteiras entre módulos.
**Consequências:** regras testáveis sem infraestrutura; um pouco de código de mapeamento por agregado.

### ADR-002 — Work agrupa empresas, projetos e tarefas
**Contexto:** a proposta inicial tinha `company`, `project` e `task` como módulos separados, mas eles mudam juntos e têm FKs fortes (tarefa → projeto → empresa).
**Decisão:** um módulo `work` com três agregados.
**Consequências:** menos eventos artificiais; se um dia `task` precisar sair, as portas já estão separadas por agregado.

### ADR-003 — Um schema por módulo e nenhuma FK entre schemas
**Contexto:** FKs entre módulos acoplam a ordem de migração e impedem extrair um módulo.
**Decisão:** FKs só dentro do módulo; referências entre módulos são `uuid` validados pela aplicação.
**Consequências:** possível referência órfã se um evento falhar; mitigado pelo registro de eventos do Modulith e por um job de verificação (backlog PLT-07).

### ADR-004 — Enums como texto com CHECK, não tipos `enum` do PostgreSQL
**Decisão:** `text` + `CHECK (... IN (...))`.
**Consequências:** adicionar um valor é uma migração simples (`ALTER TABLE ... DROP/ADD CONSTRAINT`), sem `ALTER TYPE`.

### ADR-005 — Integrações externas desligadas por padrão
**Decisão:** toda integração tem um adaptador "desligado" que é o padrão; o real liga por propriedade.
**Consequências:** o ambiente local e os testes nunca chamam serviços externos sem querer.

### ADR-006 — Dados de exemplo iguais aos do frontend no perfil `dev`
**Decisão:** `db/dev/R__dev_seed.sql` é gerado a partir de `web/src/lib/sample-data`, com ids UUIDv5 dos ids do frontend.
**Consequências:** as telas mostram os mesmos registros com a API real; o seed nunca roda fora do perfil `dev`.

## 8. Ambiente local

```
WSL (Ubuntu)
├── web/  Next.js :3000  ──HTTP──▶  api/  Spring Boot :8080  ──JDBC──▶  PostgreSQL 17 :5432 (Docker, compose.yaml)
```

Veja [README do backend](../../api/README.md) para os comandos.
