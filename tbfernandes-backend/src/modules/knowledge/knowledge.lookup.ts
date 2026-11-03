/** Lightweight copy of a note, safe to hold outside the module. */
export interface NoteView {
  id: string;
  title: string;
  body: string;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

/** Lightweight copy of a snippet, safe to hold outside the module. */
export interface SnippetView {
  id: string;
  title: string;
  explanation: string | null;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

/** Read access to notes and snippets for other modules (the assistant). */
export abstract class KnowledgeLookup {
  abstract notes(ownerId: string): Promise<NoteView[]>;
  abstract snippets(ownerId: string): Promise<SnippetView[]>;
}
