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

const toReferenceResponse = (reference: Reference): ReferenceResponse => ({
  kind: reference.kind,
  label: reference.label,
  href: reference.href,
  excerpt: reference.excerpt,
});

const toQueryResponse = (query: StructuredQuery): QueryResponse => ({
  subject: query.subject.toLowerCase(),
  aggregate: query.aggregate.toLowerCase(),
  text: query.text,
  statuses: [...query.statuses],
  priorities: [...query.priorities],
  openOnly: query.openOnly,
  project: query.project,
  company: query.company,
  dueFrom: query.dueFrom,
  dueTo: query.dueTo,
  month: query.month,
  sort: query.sort.toLowerCase(),
  limit: query.limit,
});

export const AnswerMapper = {
  toResponse(answer: Answer): AnswerResponse {
    return {
      text: answer.text,
      references: answer.references.map(toReferenceResponse),
      source: answer.source,
      query: answer.query ? toQueryResponse(answer.query) : null,
    };
  },
};

export const GraphMapper = {
  toResponse(graph: KnowledgeGraph): GraphResponse {
    return {
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        kind: node.kind,
        label: node.label,
        href: node.href,
      })),
      edges: graph.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };
  },
};
