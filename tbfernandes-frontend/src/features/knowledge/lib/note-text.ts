import { normalizeTitle } from "@/features/knowledge/lib/wiki-links";

/**
 * Drops a leading `# Heading` that repeats the note title. The page already
 * shows the title, so rendering it again reads as a duplicate.
 */
export function withoutTitleHeading(body: string, title: string): string {
  const match = /^\s*#{1,2}\s+(.+?)\s*#*\s*(?:\r?\n|$)/.exec(body);
  if (match && normalizeTitle(match[1]) === normalizeTitle(title)) {
    return body.slice(match[0].length).replace(/^\s+/, "");
  }
  return body;
}

/** Plain-text preview of a Markdown body for list rows. */
export function noteExcerpt(body: string, title: string): string {
  return withoutTitleHeading(body, title)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) =>
      String(alias ?? target),
    )
    .replace(/[#>*_`|\[\]-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
