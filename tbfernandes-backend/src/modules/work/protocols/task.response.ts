export class ProgressResponse {
  done: number;
  total: number;
}

export class ChecklistItemResponse {
  id: string;
  title: string;
  done: boolean;
}

/** Same shape as the frontend's Task type (features/tasks/types/task.ts). */
export class TaskResponse {
  id: string;
  title: string;
  description: string | null;
  projectId: string | null;
  status: string;
  priority: string;
  tag: string | null;
  startDate: string | null;
  dueDate: string | null;
  doneCriteria: string | null;
  checklist: ProgressResponse | null;
  checklistItems: ChecklistItemResponse[];
  goalId: string | null;
  completedAt: string | null;
}
