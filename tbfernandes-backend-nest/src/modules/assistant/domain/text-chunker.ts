import { InvalidArgumentError } from '../../../common/domain';

export const DEFAULT_MAX_LENGTH = 1200;

const isWhitespace = (c: string | undefined) => c != null && /\s/.test(c);

/** Where to cut: after the last sentence end, else at the last space, else at the limit. */
function lastBreak(text: string, maxLength: number): number {
  for (let i = maxLength - 1; i > Math.floor(maxLength / 2); i--) {
    const c = text[i];
    if (
      (c === '.' || c === '!' || c === '?' || c === '\n') &&
      isWhitespace(text[i + 1])
    )
      return i + 1;
  }
  const space = text.lastIndexOf(' ', maxLength);
  return space > Math.floor(maxLength / 2) ? space : maxLength;
}

function cut(paragraph: string, maxLength: number): string[] {
  const parts: string[] = [];
  let rest = paragraph;
  while (rest.length > maxLength) {
    const end = lastBreak(rest, maxLength);
    parts.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest !== '') parts.push(rest);
  return parts;
}

/**
 * Splits a document's text into passages of at most maxLength characters (AST-04).
 * Paragraphs stay whole when they fit; a longer paragraph is cut at the end of a sentence, or
 * at a space when a sentence is too long. Short paragraphs are joined, so a passage has context.
 */
export const TextChunker = {
  split(text: string, maxLength = DEFAULT_MAX_LENGTH): string[] {
    if (maxLength < 50)
      throw new InvalidArgumentError('maxLength must be at least 50');
    const pieces = text
      .trim()
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p !== '')
      .flatMap((p) => cut(p, maxLength));
    const chunks: string[] = [];
    let current = '';
    for (const piece of pieces) {
      if (current.length > 0 && current.length + 2 + piece.length > maxLength) {
        chunks.push(current);
        current = '';
      }
      current = current.length > 0 ? `${current}\n\n${piece}` : piece;
    }
    if (current.length > 0) chunks.push(current);
    return chunks;
  },
};
