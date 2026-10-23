/** Links shared by notes and snippets: a knowledge item can relate to many work items. */
export type KnowledgeLinks = {
  projectIds: string[];
  taskIds: string[];
};

export type Note = KnowledgeLinks & {
  id: string;
  title: string;
  /** Markdown. */
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type Snippet = KnowledgeLinks & {
  id: string;
  title: string;
  language: string;
  /** Stored exactly as entered; never executed. */
  code: string;
  explanation?: string;
  sourceUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export const snippetLanguages = [
  "java",
  "typescript",
  "javascript",
  "sql",
  "bash",
  "yaml",
  "json",
  "python",
  "go",
  "xml",
  "css",
  "plaintext",
] as const;
