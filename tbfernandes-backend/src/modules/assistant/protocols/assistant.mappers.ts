import type {
  Answer,
  KnowledgeGraph,
  Reference,
  StructuredQuery,
} from '../domain';
import type {
  AnswerResponse,
  GraphResponse,
  QueryResponse,
  ReferenceResponse,
} from './assistant.responses';

const reference = (r: Reference): ReferenceResponse => ({
  kind: r.kind,
  label: r.label,
  href: r.href,
  excerpt: r.excerpt,
});

const query = (q: StructuredQuery): QueryResponse => ({
  // Enums in lower case, as everywhere else in the API.
  subject: q.subject.toLowerCase(),
  aggregate: q.aggregate.toLowerCase(),
  text: q.text,
  statuses: [...q.statuses],
  priorities: [...q.priorities],
  openOnly: q.openOnly,
  project: q.project,
  company: q.company,
  dueFrom: q.dueFrom,
  dueTo: q.dueTo,
  month: q.month,
  sort: q.sort.toLowerCase(),
  limit: q.limit,
});

export const AnswerMapper = {
  toResponse(answer: Answer): AnswerResponse {
    return {
      text: answer.text,
      references: answer.references.map(reference),
      source: answer.source,
      query: answer.query ? query(answer.query) : null,
    };
  },
};

export const GraphMapper = {
  toResponse(graph: KnowledgeGraph): GraphResponse {
    return {
      nodes: graph.nodes.map((n) => ({
        id: n.id,
        kind: n.kind,
        label: n.label,
        href: n.href,
      })),
      edges: graph.edges.map((e) => ({ source: e.source, target: e.target })),
    };
  },
};
