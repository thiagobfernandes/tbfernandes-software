export const taskStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "done",
] as const;

export type TaskStatus = (typeof taskStatuses)[number] | "canceled";

export type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

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
  /** How to know the task is finished. */
  doneCriteria?: string;
  /** Aggregate progress for tasks without itemized checklists. */
  checklist?: { done: number; total: number };
  checklistItems?: ChecklistItem[];
  goalId?: string;
  /** Set when the task moves to "done" (business rule 6.6.5). */
  completedAt?: string;
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "A fazer",
  in_progress: "Em andamento",
  blocked: "Bloqueada",
  done: "Concluída",
  canceled: "Cancelada",
};

/** Checklist progress from itemized items when present, else the aggregate. */
export function checklistProgress(task: Task) {
  if (task.checklistItems?.length) {
    return {
      done: task.checklistItems.filter((item) => item.done).length,
      total: task.checklistItems.length,
    };
  }
  return task.checklist;
}

/** Lowercase, for use inside sentences ("prioridade alta"). */
export const priorityLabels: Record<TaskPriority, string> = {
  low: "baixa",
  normal: "normal",
  high: "alta",
  urgent: "urgente",
};
