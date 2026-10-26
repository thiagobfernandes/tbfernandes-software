# Diagramas UML

Versão 0.1 · 2026-10-26

Os diagramas estão em Mermaid, que o GitHub e o VS Code mostram direto no Markdown. O diagrama de componentes gerado a partir do código fica em `api/target/spring-modulith-docs/` depois de `./mvnw test` (PlantUML/C4), e serve para conferir se este documento continua fiel ao código.

O modelo de dados (diagrama entidade-relacionamento) está em [modelo-de-dados.md](modelo-de-dados.md).

## 1. Casos de uso

```mermaid
flowchart LR
    user((Usuário))
    pluggy((Pluggy))
    ai((Provedor de IA))

    subgraph Work
        uc1([Gerenciar empresas])
        uc2([Gerenciar projetos])
        uc3([Gerenciar tarefas])
        uc4([Mover tarefa no quadro])
        uc5([Ver painel])
    end
    subgraph Knowledge
        uc6([Escrever notas e snippets])
        uc7([Vincular conhecimento a projetos e tarefas])
        uc8([Explorar grafo])
        uc9([Manter métodos])
    end
    subgraph Growth
        uc10([Definir metas e marcos])
        uc11([Registrar estudos e materiais])
        uc12([Registrar habilidades e certificações])
    end
    subgraph Finance
        uc13([Lançar receitas e despesas])
        uc14([Planejar compras])
        uc15([Conectar banco e importar transações])
    end
    subgraph Network
        uc16([Gerenciar contatos e interações])
        uc17([Criar follow-up])
    end
    subgraph Assistant
        uc18([Perguntar ao assistente])
    end

    user --- uc1 & uc2 & uc3 & uc4 & uc5
    user --- uc6 & uc7 & uc8 & uc9
    user --- uc10 & uc11 & uc12
    user --- uc13 & uc14 & uc15
    user --- uc16 & uc17 & uc18
    uc15 -.-> pluggy
    uc18 -.-> ai
    uc17 -. inclui .-> uc3
```

Linhas tracejadas para atores externos indicam casos de uso planejados (fora do MVP).

## 2. Componentes (módulos)

```mermaid
flowchart TB
    web["web/ (Next.js)"]

    subgraph api["api/ (Spring Boot, monólito modular)"]
        direction TB
        shared["shared<br/>ids · erros · OwnerContext · CORS"]
        identity[identity]
        work[work]
        knowledge[knowledge]
        goals[goals]
        learning[learning]
        finance[finance]
        contacts[contacts]
        assistant[assistant]
    end

    db[("PostgreSQL 17<br/>um schema por módulo")]
    pluggy["Pluggy API"]

    web -- "REST /api/v1 (JSON)" --> api
    work -- "TaskCompleted, *Deleted (eventos)" --> goals & knowledge & contacts
    contacts -- "WorkLookup / FollowUpTasks" --> work
    knowledge -- "WorkLookup (validar vínculos)" --> work
    goals -- "WorkLookup, LearningLookup, FinanceLookup" --> work & learning & finance
    assistant -- "*Lookup (só leitura)" --> work & knowledge & goals & finance & contacts & learning
    assistant -- "LanguageModel (porta, desligada)" --> ai["Provedor de IA"]
    finance -- "OpenFinanceGateway (porta)" --> pluggy
    api --> db
```

Todos os módulos dependem de `shared`; essas setas foram omitidas.

## 3. Camadas (clean architecture) de um módulo

```mermaid
flowchart LR
    subgraph adapter_in["adapter.in.web"]
        ctrl[TaskController]
        dto[TaskRequest / TaskResponse]
    end
    subgraph application
        svc[TaskService]
    end
    subgraph domain
        task[Task]
        repo{{"TaskRepository (porta)"}}
    end
    subgraph adapter_out["adapter.out.persistence"]
        adp[TaskPersistenceAdapter]
        jpa[TaskJpaEntity + TaskJpaRepository]
    end

    ctrl --> svc
    ctrl --> dto
    svc --> task
    svc --> repo
    adp -. implementa .-> repo
    adp --> jpa
```

As setas apontam sempre para dentro: o domínio não conhece nenhuma outra camada.

## 4. Classes do domínio — Work

```mermaid
classDiagram
    direction LR
    class Company {
        +UUID id
        +UUID ownerId
        -String name
        -String tradeName
        -CompanyRelationship relationship
        -CompanyStatus status
        -LocalDate startDate
        +create(ownerId, details)$ Company
        +update(details)
    }
    class Project {
        +UUID id
        +UUID ownerId
        -ProjectDetails details
        +create(ownerId, details)$ Project
        +update(details)
    }
    class ProjectDetails {
        <<record>>
        name
        companyId
        category
        status
        color
        startDate
        dueDate
        goalId
    }
    class Task {
        +UUID id
        +UUID ownerId
        -TaskDetails details
        -TaskStatus status
        -Instant completedAt
        +create(ownerId, details, status, clock)$ Task
        +update(details)
        +changeStatus(next, clock) boolean
        +progress() Progress
    }
    class ChecklistItem {
        <<record>>
        UUID id
        String title
        boolean done
    }
    class TaskStatus {
        <<enumeration>>
        BACKLOG
        TODO
        IN_PROGRESS
        BLOCKED
        DONE
        CANCELED
    }
    class TaskCompleted {
        <<event>>
        ownerId
        taskId
        projectId
        goalId
        completedAt
    }
    class CompanyRepository {
        <<interface>>
    }
    class ProjectRepository {
        <<interface>>
    }
    class TaskRepository {
        <<interface>>
    }

    Company "0..1" <-- "*" Project : companyId
    Project "0..1" <-- "*" Task : projectId
    Project *-- ProjectDetails
    Task *-- "*" ChecklistItem
    Task --> TaskStatus
    Task ..> TaskCompleted : origina
    CompanyRepository ..> Company
    ProjectRepository ..> Project
    TaskRepository ..> Task
```

## 5. Classes do domínio — demais módulos

```mermaid
classDiagram
    direction TB
    class Note {
        title
        body (Markdown)
        tags
    }
    class Snippet {
        title
        language
        code
        explanation
        sourceUrl
        tags
    }
    class KnowledgeLink {
        <<value>>
        targetType: PROJECT|TASK
        targetId
    }
    class Method {
        title
        summary
        category
        lastReviewed
    }
    class MethodStep {
        title
        detail
    }
    Note *-- "*" KnowledgeLink
    Snippet *-- "*" KnowledgeLink
    Method *-- "*" MethodStep

    class Goal {
        name
        area
        status
        desiredResult
        dueDate
    }
    class Indicator {
        <<value>>
        label
        current
        target
        unit
    }
    class Milestone {
        title
        dueDate
        done
    }
    Goal "0..1" o-- "*" Goal : submetas
    Goal *-- "0..1" Indicator
    Goal *-- "*" Milestone

    class Study {
        name
        status
        goalId
    }
    class LearningMaterial {
        title
        type
        status
    }
    class Skill {
        name
        level 1..5
    }
    class Certification {
        name
        issuer
        status
        obtainedAt
        expiresAt
    }
    class Education {
        institution
        course
        degree
    }
    Study "0..1" <-- "*" LearningMaterial
    Study "*" -- "*" Skill
    Certification "*" -- "*" Study

    class FinanceEntry {
        kind: INCOME|EXPENSE
        scope: PERSONAL|BUSINESS
        category
        amount (BRL)
        date
        source: MANUAL|OPEN_FINANCE
    }
    class PurchaseGoal {
        name
        estimated
        reserved
        monthlySaving
        status
    }
    class OpenFinanceGateway {
        <<interface>>
        createConnectToken(clientUserId)
        listAccounts(connectionId)
        listTransactions(accountId, from, to)
    }

    class Contact {
        name
        companyId | companyName
        role
        specialties
        nextContact
    }
    class Interaction {
        date
        kind
        summary
        followUpTaskId
    }
    Contact *-- "*" Interaction
```

## 6. Estados da tarefa

```mermaid
stateDiagram-v2
    [*] --> backlog
    backlog --> todo
    todo --> in_progress
    in_progress --> blocked
    blocked --> in_progress : desbloquear
    in_progress --> done : registra completedAt (RN-06)
    todo --> done
    backlog --> done
    done --> in_progress : reabrir, limpa completedAt
    backlog --> canceled
    todo --> canceled
    in_progress --> canceled
    blocked --> canceled
    canceled --> todo : reabrir
    note right of blocked
        blocked → done é proibido (RN-07)
    end note
```

## 7. Sequência — concluir tarefa no quadro

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant W as web (Board)
    participant C as TaskController
    participant S as TaskService
    participant T as Task (domínio)
    participant R as TaskRepository
    participant DB as PostgreSQL
    participant E as Modulith events
    participant G as goals (listener)

    U->>W: arrasta o cartão para "Done"
    W->>C: PATCH /api/v1/tasks/{id}/status {"status":"done"}
    C->>S: changeStatus(id, DONE)
    S->>R: findById(ownerId, id)
    R->>DB: SELECT ... WHERE owner_id = ? AND id = ?
    S->>T: changeStatus(DONE, clock)
    T-->>S: true (concluída agora)
    S->>R: save(task)
    R->>DB: UPDATE work.task
    S->>E: publish TaskCompleted
    E->>DB: INSERT event_publication (mesma transação)
    C-->>W: 200 TaskResponse (completedAt)
    Note over E,G: depois do commit
    E-)G: TaskCompleted
    G->>DB: atualiza progresso da meta (GOL-05)
```

## 8. Sequência — sincronizar banco via Pluggy (planejada, épico FIN-OF)

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant W as web (Finance)
    participant A as finance API
    participant P as OpenFinanceGateway
    participant PL as Pluggy
    participant DB as PostgreSQL

    U->>W: "Conectar banco"
    W->>A: POST /api/v1/finance/connections/token
    A->>P: createConnectToken(ownerId)
    P->>PL: POST /auth, POST /connect_token
    PL-->>W: widget Pluggy Connect (via token)
    U->>PL: autoriza o banco no widget
    W->>A: POST /api/v1/finance/connections {itemId}
    A->>DB: INSERT finance.bank_connection
    PL-)A: webhook item/updated
    A->>P: listAccounts(itemId), listTransactions(accountId, from, to)
    P->>PL: GET /accounts, GET /transactions (paginado)
    A->>DB: UPSERT finance.entry (source=OPEN_FINANCE, external_id) (RN-16)
```

## 9. Implantação local

```mermaid
flowchart LR
    subgraph pc["Windows + WSL (Ubuntu)"]
        subgraph wsl["~/projects/tbfernandes-software"]
            next["web/ · npm run dev<br/>:3000"]
            boot["api/ · ./mvnw spring-boot:run<br/>:8080"]
        end
        subgraph docker["Docker (compose.yaml)"]
            pg[("postgres:17-alpine<br/>:5432 · volume tbf-pgdata")]
        end
    end
    browser["Navegador"] --> next
    next -- "fetch /api/v1" --> boot
    boot -- JDBC --> pg
```
