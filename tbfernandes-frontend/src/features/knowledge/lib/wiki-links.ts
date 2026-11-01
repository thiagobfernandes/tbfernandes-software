/**
 * Obsidian-style wiki links inside note bodies: `[[Title]]`, `[[Title|alias]]`
 * and `[[Title#section]]`. They are resolved by title (case-insensitive), so
 * renaming a note breaks the link, the same as in Obsidian without auto-update.
 */

const wikiLink = /\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|([^\]\n]+))?\]\]/g;
const fence = /(```[\s\S]*?```)/g;

export type WikiTarget = { id: string; title: string; href: string };

export const normalizeTitle = (title: string) =>
  title.trim().toLocaleLowerCase("pt-BR");

/** Titles referenced by `[[…]]` in a Markdown body, ignoring code fences. */
export function parseWikiLinks(body: string): string[] {
  const titles: string[] = [];
  body.split(fence).forEach((part, i) => {
    if (i % 2 === 1) return;
    for (const match of part.matchAll(wikiLink)) titles.push(match[1].trim());
  });
  return titles;
}

/**
 * Rewrites `[[…]]` into Markdown links to the target record. Links whose title
 * matches nothing stay as plain text, so a draft link reads naturally.
 */
export function resolveWikiLinks(
  body: string,
  targets: Map<string, WikiTarget>,
): string {
  return body
    .split(fence)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(wikiLink, (_, title: string, alias?: string) => {
            const label = (alias ?? title).trim().replace(/[[\]]/g, "");
            const target = targets.get(normalizeTitle(title));
            return target ? `[${label}](${target.href})` : label;
          }),
    )
    .join("");
}
