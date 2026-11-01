// Illustrative notes and snippets until the Knowledge API exists.

import type { Note, Snippet } from "@/features/knowledge/types/knowledge";

export const sampleNotes: Note[] = [
  {
    id: "n1",
    title: "Ingestão de telemetria: de onde vêm os alertas",
    body: `## Contexto

O alerta de ingestão dispara quando o **lag** do consumer group \`telemetry-events\` passa de 5 minutos.

## O que verificar primeiro

1. Lag do consumer por partição no Grafana
2. Deploys recentes do serviço de ingestão
3. Saturação do pool de conexões do banco

> A maioria dos incidentes até agora foi uma query lenta na busca de dispositivos.

O tratamento de erro da API segue o [[Handler de exceções com Problem Details]].

- [x] Documentar os links dos dashboards
- [ ] Pedir acesso de leitura aos logs de produção`,
    tags: ["telemetry", "incident", "kafka"],
    projectIds: ["p1"],
    taskIds: ["t1"],
    createdAt: "2026-10-14",
    updatedAt: "2026-10-22",
  },
  {
    id: "n2",
    title: "Fronteiras do monólito modular",
    body: `Cada módulo é dono das suas tabelas e expõe uma API pequena para os outros.

| Módulo | Dono de |
| --- | --- |
| work | empresas, projetos, tarefas |
| knowledge | notas, snippets, vínculos |
| finance | lançamentos, metas de compra |

Leituras entre módulos passam por **serviços de aplicação**, nunca pelos repositórios de outro módulo.

Os alertas de [[Ingestão de telemetria: de onde vêm os alertas|telemetria]] mostram por que cada módulo precisa de métricas próprias. Antes de abrir um PR, siga o [[Método de commit]].`,
    tags: ["architecture", "spring"],
    projectIds: ["p2"],
    taskIds: ["t2"],
    createdAt: "2026-10-20",
    updatedAt: "2026-10-21",
  },
  {
    id: "n3",
    title: "Raft: anotações sobre eleição de líder",
    body: `O timeout de eleição precisa ser aleatório (150–300 ms) para evitar votos divididos.

Um nó vira **candidato** depois do timeout, vota em si mesmo e envia \`RequestVote\` para os pares.`,
    tags: ["distributed-systems", "raft"],
    projectIds: ["p3"],
    taskIds: ["t7"],
    createdAt: "2026-10-19",
    updatedAt: "2026-10-19",
  },
];

export const sampleSnippets: Snippet[] = [
  {
    id: "s1",
    title: "Handler de exceções com Problem Details",
    language: "java",
    code: `@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    ProblemDetail handleNotFound(EntityNotFoundException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource not found");
        return problem;
    }
}`,
    explanation:
      "Retorna Problem Details (RFC 9457) para o frontend mostrar o mesmo formato de erro em todo lugar.",
    tags: ["spring", "errors"],
    projectIds: ["p2"],
    taskIds: ["t9"],
    createdAt: "2026-10-21",
    updatedAt: "2026-10-21",
  },
  {
    id: "s2",
    title: "Lag do consumer por partição",
    language: "bash",
    code: `kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --describe --group telemetry-events`,
    explanation: "Primeira verificação quando o alerta de ingestão dispara.",
    sourceUrl: "https://kafka.apache.org/documentation/",
    tags: ["kafka", "telemetry"],
    projectIds: ["p1"],
    taskIds: ["t1"],
    createdAt: "2026-10-15",
    updatedAt: "2026-10-15",
  },
  {
    id: "s3",
    title: "Tarefas atrasadas por projeto",
    language: "sql",
    code: `select p.name, count(*) as overdue
from task t
join project p on p.id = t.project_id
where t.status not in ('DONE', 'CANCELED')
  and t.due_date < current_date
group by p.name
order by overdue desc;`,
    tags: ["postgres", "reports"],
    projectIds: ["p2"],
    taskIds: [],
    createdAt: "2026-10-22",
    updatedAt: "2026-10-22",
  },
];
