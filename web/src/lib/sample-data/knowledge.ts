// Illustrative notes and snippets until the Knowledge API exists.

import type { Note, Snippet } from "@/features/knowledge/types/knowledge";

export const sampleNotes: Note[] = [
  {
    id: "n1",
    title: "Telemetry ingestion: where alerts come from",
    body: `## Context

The ingestion alert fires when the **lag** of the \`telemetry-events\` consumer group passes 5 minutes.

## What to check first

1. Consumer lag per partition in Grafana
2. Recent deploys of the ingestion service
3. Database connection pool saturation

> Most incidents so far were a slow query in the device lookup.

- [x] Document the dashboard links
- [ ] Ask for read access to the production logs`,
    tags: ["telemetry", "incident", "kafka"],
    projectIds: ["p1"],
    taskIds: ["t1"],
    createdAt: "2026-10-14",
    updatedAt: "2026-10-22",
  },
  {
    id: "n2",
    title: "Modular monolith boundaries",
    body: `Each module owns its tables and exposes a small API to the others.

| Module | Owns |
| --- | --- |
| work | companies, projects, tasks |
| knowledge | notes, snippets, links |
| finance | entries, purchase goals |

Cross-module reads go through **application services**, never through repositories of another module.`,
    tags: ["architecture", "spring"],
    projectIds: ["p2"],
    taskIds: ["t2"],
    createdAt: "2026-10-20",
    updatedAt: "2026-10-21",
  },
  {
    id: "n3",
    title: "Raft: leader election notes",
    body: `Election timeout must be randomized (150–300 ms) to avoid split votes.

A node becomes **candidate** after the timeout, votes for itself and sends \`RequestVote\` to its peers.`,
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
    title: "Problem Details exception handler",
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
      "Returns RFC 9457 Problem Details so the frontend can show the same error shape everywhere.",
    tags: ["spring", "errors"],
    projectIds: ["p2"],
    taskIds: ["t9"],
    createdAt: "2026-10-21",
    updatedAt: "2026-10-21",
  },
  {
    id: "s2",
    title: "Consumer lag per partition",
    language: "bash",
    code: `kafka-consumer-groups.sh \\
  --bootstrap-server localhost:9092 \\
  --describe --group telemetry-events`,
    explanation: "First check when the ingestion alert fires.",
    sourceUrl: "https://kafka.apache.org/documentation/",
    tags: ["kafka", "telemetry"],
    projectIds: ["p1"],
    taskIds: ["t1"],
    createdAt: "2026-10-15",
    updatedAt: "2026-10-15",
  },
  {
    id: "s3",
    title: "Tasks overdue per project",
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
