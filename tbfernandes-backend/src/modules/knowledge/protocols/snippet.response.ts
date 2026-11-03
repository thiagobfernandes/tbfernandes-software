/** Same shape as the frontend's Snippet type. */
export class SnippetResponse {
  id: string;
  title: string;
  language: string;
  code: string;
  explanation: string | null;
  sourceUrl: string | null;
  tags: string[];
  projectIds: string[];
  taskIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}
