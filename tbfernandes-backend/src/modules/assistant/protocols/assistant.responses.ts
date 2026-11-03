/** A link to a record, as the frontend's assistant shows it. */
export class ReferenceResponse {
  kind: string;
  label: string;
  href: string;
  excerpt: string | null;
}

/** The query a question was turned into (AST-03); enums in lower case. */
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

/** Same shape as the frontend's AssistantAnswer type. */
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

/** Nodes and edges of the knowledge graph screen (KNW-05). */
export class GraphResponse {
  nodes: GraphNodeResponse[];
  edges: GraphEdgeResponse[];
}
