export class ReferenceResponse {
  kind: string;
  label: string;
  href: string;
  excerpt: string | null;
}

export class QueryResponse {
  subject: string;
  aggregate: string;
  text: string;
  statuses: string[];
  priorities: string[];
  openOnly: boolean;
  project: string;
  company: string;
  dueFrom: string | null;
  dueTo: string | null;
  month: string | null;
  sort: string;
  limit: number;
}

export class AnswerResponse {
  text: string;
  references: ReferenceResponse[];
  /** rules, query, model, rag or search. */
  source: string;
  query: QueryResponse | null;
}

export class GraphNodeResponse {
  id: string;
  kind: string;
  label: string;
  href: string;
}

export class GraphEdgeResponse {
  source: string;
  target: string;
}

export class GraphResponse {
  nodes: GraphNodeResponse[];
  edges: GraphEdgeResponse[];
}
