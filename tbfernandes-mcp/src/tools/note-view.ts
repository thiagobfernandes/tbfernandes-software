const EXCERPT_LENGTH = 160;

export interface Note {
  id: string;
  title: string;
  body?: string | null;
  tags?: string[];
  updatedAt?: string;
}

export function withLink(note: Note, webUrl: string): Note & { link: string } {
  return { ...note, link: `${webUrl}/knowledge?note=${note.id}` };
}

export function toNoteSummary(note: Note) {
  return {
    id: note.id,
    title: note.title,
    tags: note.tags,
    updatedAt: note.updatedAt,
    excerpt: (note.body ?? '').replace(/\s+/g, ' ').slice(0, EXCERPT_LENGTH),
  };
}

export function appendToBody(
  note: Note,
  text: string,
  withDateHeading = false,
): string {
  const heading = withDateHeading ? `## ${todayIsoDate()}\n\n` : '';
  return `${(note.body ?? '').trimEnd()}\n\n${heading}${text}`.trimStart();
}

export function mergeTags(note: Note, extraTags: string[] = []): string[] {
  return [...new Set([...(note.tags ?? []), ...extraTags])];
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
