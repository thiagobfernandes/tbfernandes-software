import { InvalidArgumentError } from '../../../common/domain';

export const DEFAULT_MAX_LENGTH = 1200;

const isWhitespace = (character: string | undefined) =>
  character != null && /\s/.test(character);

function lastBreak(text: string, maxLength: number): number {
  for (let index = maxLength - 1; index > Math.floor(maxLength / 2); index--) {
    const character = text[index];
    if (
      (character === '.' ||
        character === '!' ||
        character === '?' ||
        character === '\n') &&
      isWhitespace(text[index + 1])
    )
      return index + 1;
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
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph !== '')
      .flatMap((paragraph) => cut(paragraph, maxLength));
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
