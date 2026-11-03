import type { StructuredQuery } from './structured-query';

/**
 * A link to a record on a frontend screen. excerpt is the passage of the record the answer
 * used, or null when the answer does not come from a passage.
 */
export interface Reference {
  kind: string;
  label: string;
  href: string;
  excerpt: string | null;
}

/**
 * Who wrote the text: "rules" (rule-based assistant), "query" (a StructuredQuery run over the
 * data), "model" (a language model rewrote it), "rag" (the model answered from passages of
 * notes and snippets) or "search" (the passages themselves, without a model).
 */
export type AnswerSource = 'rules' | 'query' | 'model' | 'rag' | 'search';

/** An answer in Markdown and the records it was built from (RF-AST-01). */
export interface Answer {
  text: string;
  references: Reference[];
  source: AnswerSource;
  /** The query used, or null when it did not come from one. */
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
