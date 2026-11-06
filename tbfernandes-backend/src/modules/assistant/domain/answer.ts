import type { StructuredQuery } from './structured-query';

export interface Reference {
  kind: string;
  label: string;
  href: string;
  excerpt: string | null;
}

export type AnswerSource = 'rules' | 'query' | 'model' | 'rag' | 'search';

export interface Answer {
  text: string;
  references: Reference[];
  source: AnswerSource;
  query: StructuredQuery | null;
}

export function reference(
  kind: string,
  label: string,
  href: string,
  excerpt: string | null = null,
): Reference {
  return { kind, label, href, excerpt };
}

export function answerOf(
  text: string,
  references: Reference[],
  source: AnswerSource,
  query: StructuredQuery | null = null,
): Answer {
  return { text, references: [...references], source, query };
}
