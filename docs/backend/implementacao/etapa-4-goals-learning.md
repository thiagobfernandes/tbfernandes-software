# Etapa 4 — Goals e Learning

Data: 2026-10-26 · Itens: GOL-01..05, LRN-01..06

## Objetivo

Metas (com submetas, marcos e indicador) e aprendizado (estudos, materiais, habilidades, certificações e formação) na API, e a ligação entre tarefas concluídas e o progresso das metas.

## O que foi feito

| Item | Mudança | Onde |
|---|---|---|
| GOL-01 | `/goals`: CRUD com indicador `{label, current, target, unit}`; `PATCH /goals/{id}/indicator` atualiza só o valor atual (RN-21). | `Goal`, `GoalService`, `GoalController` |
| GOL-02 | Submetas por `parentId`, sem ciclos: a meta não pode ser filha dela mesma nem de uma descendente (RN-19). | `GoalService.checkParent` |
| GOL-03 | `/milestones?goalId=`: CRUD de marcos; somem junto com a meta (RN-09). | `Milestone`, `GoalController` |
| GOL-04 | `GET /goals/{id}/links`: projetos, tarefas e estudos que apontam para a meta, lidos por `WorkLookup` e `LearningLookup`. Compras entram na etapa 5. | `GoalLinksService` |
| GOL-05 | Ouvinte de `TaskCompleted`: meta planejada vira ativa; indicador em `tasks` soma 1 (RN-22). | `TaskCompletedListener`, `Goal.linkedTaskCompleted` |
| LRN-01..05 | `/studies`, `/materials?studyId=`, `/skills`, `/certifications`, `/educations`. Habilidade de 1 a 5 (RN-13); certificação obtida exige data, validade depois dela (RN-14); referências a habilidades e estudos validadas. | `learning/domain/*`, `LearningService`, `LearningController` |
| LRN-06 | `GET /certifications?expiringWithinDays=60`: obtidas que vencem na janela. | `LearningService.listCertifications` |

## Mudança de banco (V9)

`goals.milestone` e `contacts.interaction` ganharam `owner_id`, preenchido a partir do pai. O frontend edita marcos e interações como coleções próprias, então a API também os expõe como recursos próprios, e todo recurso exposto filtra pelo dono.

## Decisões

- **`Aggregate<D>` no shared kernel**: os agregados novos guardam o estado editável num record imutável e passam toda mudança por `validate`. Isso tira a repetição de getters e garante que um estado inválido nunca é salvo. O módulo Work continua como foi escrito; os dois formatos convivem.
- **Corpo da requisição = record do domínio, resposta = `Resource<D>`**: nos módulos de cadastro simples, o `Details` do domínio é o próprio corpo JSON, e `Resource` devolve `{id, ...campos}`, o mesmo formato dos tipos do frontend. As regras ficam no domínio (400 para campo inválido, 422 para regra). No Work, que tem DTOs com Bean Validation, o padrão anterior continua.
- **Recursos planos, um por coleção do frontend** (`/milestones`, `/materials` e não `/goals/{id}/milestones`): o store do frontend trabalha por coleção e id, então a troca para a API fica uniforme.
- **Direção das dependências**: `goals → work, learning`. `work` e `learning` guardam `goalId` sem validar. Ver ADR-003 e o item PLT-07 para limpeza de órfãos.
- **Booleanos ausentes valem `false`** (`fail-on-null-for-primitives: false`), como o frontend envia hoje.

## Testes

`GoalsApiIntegrationTests` (4) e `LearningApiIntegrationTests` (3): formato do JSON, ciclo de submetas, exclusão em cascata, tarefa concluída movendo a meta (assíncrono), habilidades e materiais, regras RN-13/RN-14, certificações vencendo. Suíte: 26 testes passando.
