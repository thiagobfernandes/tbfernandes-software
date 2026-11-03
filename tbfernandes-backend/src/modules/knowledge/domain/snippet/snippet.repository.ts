import { Snippet } from './snippet';

export interface SnippetSearch {
  /** Matches title, explanation and code. */
  text: string | null;
  /** Exact, lower case. */
  language: string | null;
  /** Exact. */
  tag: string | null;
}

/** Implemented in infrastructure/persistence. */
export abstract class SnippetRepository {
  abstract create(snippet: Snippet): Promise<Snippet>;
  abstract save(snippet: Snippet): Promise<Snippet>;
  abstract findById(ownerId: string, id: string): Promise<Snippet | null>;
  abstract search(ownerId: string, search: SnippetSearch): Promise<Snippet[]>;
  abstract linkedTo(ownerId: string, workItemId: string): Promise<Snippet[]>;
  abstract delete(snippet: Snippet): Promise<void>;
}
