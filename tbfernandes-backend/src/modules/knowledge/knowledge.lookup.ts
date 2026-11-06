export interface NoteView {
  id: string;
  title: string;
  body: string;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

export interface SnippetView {
  id: string;
  title: string;
  explanation: string | null;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
}

export abstract class KnowledgeLookup {
  abstract notes(ownerId: string): Promise<NoteView[]>;
  abstract snippets(ownerId: string): Promise<SnippetView[]>;
}
