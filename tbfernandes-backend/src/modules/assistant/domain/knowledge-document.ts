import { createHash } from 'node:crypto';
import { NoteRecord, SnippetRecord, Workspace } from './workspace';

export type DocumentKind = 'NOTE' | 'SNIPPET';

export const DocumentKinds = {
  label(kind: DocumentKind): string {
    return kind === 'NOTE' ? 'Nota' : 'Snippet';
  },
  href(kind: DocumentKind, id: string): string {
    return kind === 'NOTE' ? `/knowledge?note=${id}` : '/knowledge/snippets';
  },
};

export interface DocumentKey {
  kind: DocumentKind;
  id: string;
}

export const keyOf = (key: DocumentKey) => `${key.kind}:${key.id}`;

export interface KnowledgeDocument {
  key: DocumentKey;
  title: string;
  text: string;
}

const withTags = (body: string | null, tags: string[]) => {
  const text = (body ?? '').trim();
  return tags.length ? `${text}\n\nTags: ${tags.join(', ')}` : text;
};

export const KnowledgeDocuments = {
  of(notes: NoteRecord[], snippets: SnippetRecord[]): KnowledgeDocument[] {
    return [
      ...notes.map((note) => ({
        key: { kind: 'NOTE' as const, id: note.id },
        title: note.title,
        text: withTags(note.body, note.tags),
      })),
      ...snippets.map((snippet) => ({
        key: { kind: 'SNIPPET' as const, id: snippet.id },
        title: snippet.title,
        text: withTags(snippet.explanation, snippet.tags),
      })),
    ];
  },

  ofWorkspace(workspace: Workspace): KnowledgeDocument[] {
    return KnowledgeDocuments.of(workspace.notes, workspace.snippets);
  },

  /**
   * Changes when the title, the text or the embedding model changes, so the index knows which
   * documents to split and embed again. Same digest as before, so an existing index is kept.
   */
  fingerprint(document: KnowledgeDocument, embeddingModel: string): string {
    const hash = createHash('sha256');
    for (const part of [document.title, document.text, embeddingModel]) {
      hash.update(part, 'utf8');
      hash.update(Buffer.from([0]));
    }
    return hash.digest('hex');
  },
};

/**
 * One passage of a document in the retrieval index (AST-04). vector is its embedding, or null
 * when no embedding model is configured or it could not be reached; such passages are still
 * found by their words.
 */
export interface IndexedChunk {
  source: DocumentKey;
  position: number;
  title: string;
  text: string;
  vector: number[] | null;
}

export interface Passage {
  source: DocumentKey;
  title: string;
  text: string;
  score: number;
}

export const passageHref = (passage: Passage) =>
  DocumentKinds.href(passage.source.kind, passage.source.id);
