import { Answer, answerOf, Reference, reference } from './answer';
import {
  DocumentKinds,
  keyOf,
  Passage,
  passageHref,
} from './knowledge-document';

export const EXCERPT_LENGTH = 280;
const CITATION = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

const distinct = (passages: Passage[]) => {
  const first = new Map<string, Passage>();
  for (const p of passages)
    if (!first.has(keyOf(p.source))) first.set(keyOf(p.source), p);
  return [...first.values()];
};

const references = (passages: Passage[]): Reference[] =>
  passages.map((p) =>
    reference(
      DocumentKinds.label(p.source.kind),
      p.title,
      passageHref(p),
      GroundedAnswer.excerpt(p.text),
    ),
  );

/**
 * Answers built from retrieved passages (AST-04, RN-20): every reference is a record a passage
 * came from, so the links always point to real notes and snippets.
 */
export const GroundedAnswer = {
  /**
   * The model's text, whose citations [n] name passages by their position from 1. Citations
   * are renumbered to the order of the references, which are the cited records, each once;
   * citations of passages that do not exist are removed. When the model cites nothing, every
   * passage's record is listed, since they were all the answer could have come from.
   */
  fromModel(text: string, passages: Passage[]): Answer {
    const order = new Map<string, number>();
    const firstPassage = new Map<string, Passage>();
    const renumbered = text.replace(CITATION, (_match, group: string) => {
      const numbers: number[] = [];
      for (const part of group.split(',')) {
        const index = Number.parseInt(part.trim(), 10) - 1;
        if (index < 0 || index >= passages.length) continue;
        const passage = passages[index];
        const key = keyOf(passage.source);
        if (!firstPassage.has(key)) firstPassage.set(key, passage);
        if (!order.has(key)) order.set(key, order.size + 1);
        const number = order.get(key)!;
        if (!numbers.includes(number)) numbers.push(number);
      }
      return numbers.map((n) => `[${n}]`).join('');
    });
    if (order.size === 0)
      return answerOf(text.trim(), references(distinct(passages)), 'rag');
    const clean = renumbered.replace(/[ \t]+([.,;:!?])/g, '$1').trim();
    return answerOf(clean, references([...firstPassage.values()]), 'rag');
  },

  /** Without a model: the records whose passages were found, each with its excerpt. */
  excerpts(passages: Passage[]): Answer {
    const sources = distinct(passages);
    const text =
      sources.length === 1
        ? 'Encontrei um trecho nas suas notas e snippets que pode responder. Veja abaixo.'
        : `Encontrei ${sources.length} trechos nas suas notas e snippets que podem responder. Veja abaixo.`;
    return answerOf(text, references(sources), 'search');
  },

  /** The start of a passage as plain text, without Markdown marks, cut at a word and on one line. */
  excerpt(text: string): string {
    const line = text
      .replace(/^[^\S\n]{0,3}(#{1,6}|>|[-*+])[^\S\n]+/gm, '')
      .replace(/\*\*|__|`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (line.length <= EXCERPT_LENGTH) return line;
    const space = line.lastIndexOf(' ', EXCERPT_LENGTH);
    return `${line.slice(0, space > EXCERPT_LENGTH / 2 ? space : EXCERPT_LENGTH)}…`;
  },
};
