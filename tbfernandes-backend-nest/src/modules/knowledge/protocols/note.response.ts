/** Same shape as the frontend's Note type. */
export class NoteResponse {
  id: string;
  title: string;
  body: string;
  tags: string[];
  /** Sorted, so equal data gives equal JSON. */
  projectIds: string[];
  taskIds: string[];
  createdAt: string | null;
  updatedAt: string | null;
}
