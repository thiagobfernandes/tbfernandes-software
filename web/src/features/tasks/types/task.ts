export const taskStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;

export type TaskStatus = (typeof taskStatuses)[number] | "canceled";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type Task = {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Free classification, e.g. "Backend" or "Design". */
  tag?: string;
  startDate?: string;
  dueDate?: string;
  checklist?: { done: number; total: number };
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  canceled: "Canceled",
};
