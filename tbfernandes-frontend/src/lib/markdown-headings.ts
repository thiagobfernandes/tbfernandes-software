/**
 * Heading anchors shared by the Markdown renderer and the table of contents:
 * both slug the same text in the same order, so ids always match.
 */
export type Heading = { id: string; text: string; level: 1 | 2 | 3 };

export function headingSlug(text: string) {
  return (
    text
      .toLocaleLowerCase("pt-BR")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 64) || "secao"
  );
}

/** Gives repeated slugs a numeric suffix, in document order. */
export function slugCounter() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = headingSlug(text);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };
}

/** Plain text of inline Markdown (links, emphasis, code) for a heading line. */
function inlineText(source: string) {
  return source
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, a) => a ?? t)
    .replace(/[*_`~]/g, "")
    .replace(/\s+#+\s*$/, "")
    .trim();
}

/** `#`, `##` and `###` headings outside fenced code blocks. */
export function extractHeadings(markdown: string): Heading[] {
  const next = slugCounter();
  const headings: Heading[] = [];
  let fenced = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (!match) continue;
    const text = inlineText(match[2]);
    if (!text) continue;
    headings.push({
      id: next(text),
      text,
      level: match[1].length as 1 | 2 | 3,
    });
  }
  return headings;
}
