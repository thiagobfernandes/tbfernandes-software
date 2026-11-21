import type { Company, Project } from "@/features/projects/types/project";
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/types/task";
import { priorityText } from "@/components/shared/priority-badge";
import { daysBetween } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";

/**
 * View state of the tasks workspace, separate from the domain: what to show
 * and how. Rules (completing a task, deleting) stay in `workActions`.
 */
export type TaskLayout = "board" | "list" | "table";
export type TaskGroupBy =
  "status" | "project" | "company" | "priority" | "tag" | "due";
export type TaskSwimlane = "none" | "project" | "priority";
export type TaskSort = "manual" | "priority" | "due" | "title";
export type TaskDensity = "compact" | "comfortable" | "detailed";
export type TaskField =
  | "id"
  | "description"
  | "tag"
  | "project"
  | "priority"
  | "due"
  | "checklist"
  | "time"
  | "doneCriteria";
export type DoneFilter = "all" | "recent" | "none";

export type TasksView = {
  layout: TaskLayout;
  groupBy: TaskGroupBy;
  swimlane: TaskSwimlane;
  sort: TaskSort;
  density: TaskDensity;
  fields: TaskField[];
  done: DoneFilter;
  /** Column keys of the current grouping that are collapsed or hidden. */
  collapsed: string[];
  hidden: string[];
  /** Board column width in px. */
  columnWidth: number;
  /** Column keys in the user's order (dragged headers). */
  columnOrder: string[];
};

export type TaskFilters = {
  projectIds: string[];
  priorities: TaskPriority[];
  statuses: TaskStatus[];
  tags: string[];
  due: ("overdue" | "week" | "none")[];
};

export type SavedTaskView = {
  id: string;
  name: string;
  view: TasksView;
  filters: TaskFilters;
  query: string;
};

export const defaultTasksView: TasksView = {
  layout: "board",
  groupBy: "status",
  swimlane: "none",
  sort: "manual",
  density: "comfortable",
  fields: ["tag", "project", "priority", "due", "checklist"],
  done: "recent",
  collapsed: ["status:done"],
  hidden: [],
  columnWidth: 280,
  columnOrder: [],
};

export const emptyTaskFilters: TaskFilters = {
  projectIds: [],
  priorities: [],
  statuses: [],
  tags: [],
  due: [],
};

export const COLUMN_WIDTH = { min: 220, max: 420 } as const;
/** "Concluídas recentes": finished in the last two weeks. */
export const RECENT_DONE_DAYS = 14;

export const layoutLabels: Record<TaskLayout, string> = {
  board: "Quadro",
  list: "Lista",
  table: "Tabela",
};
export const groupByLabels: Record<TaskGroupBy, string> = {
  status: "Status",
  project: "Projeto",
  company: "Empresa",
  priority: "Prioridade",
  tag: "Categoria",
  due: "Prazo",
};
export const swimlaneLabels: Record<TaskSwimlane, string> = {
  none: "Nenhuma",
  project: "Projeto",
  priority: "Prioridade",
};
export const sortLabels: Record<TaskSort, string> = {
  manual: "Padrão",
  priority: "Prioridade",
  due: "Prazo",
  title: "Título",
};
export const densityLabels: Record<TaskDensity, string> = {
  compact: "Compacto",
  comfortable: "Confortável",
  detailed: "Detalhado",
};
export const fieldLabels: Record<TaskField, string> = {
  id: "Identificador",
  description: "Descrição",
  tag: "Categoria",
  project: "Projeto",
  priority: "Prioridade",
  due: "Prazo",
  checklist: "Subtarefas",
  time: "Tempo",
  doneCriteria: "Critério de pronto",
};
export const doneLabels: Record<DoneFilter, string> = {
  all: "Todas",
  recent: `Últimos ${RECENT_DONE_DAYS} dias`,
  none: "Ocultar",
};

const priorityRank: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};
export const priorityOrder: TaskPriority[] = [
  "urgent",
  "high",
  "normal",
  "low",
];

/** Short, stable label from the real id, for references in conversation. */
export const taskRef = (task: Task) => task.id.slice(-4).toUpperCase();

export function activeFilterCount(filters: TaskFilters) {
  return (
    filters.projectIds.length +
    filters.priorities.length +
    filters.statuses.length +
    filters.tags.length +
    filters.due.length
  );
}

type DueBucket = "overdue" | "week" | "later" | "none";

function dueBucket(task: Task, today: string): DueBucket {
  if (!task.dueDate) return "none";
  const days = daysBetween(today, task.dueDate);
  if (days < 0) return "overdue";
  if (days <= 7) return "week";
  return "later";
}

export function filterTasks(
  tasks: Task[],
  {
    query,
    filters,
    done,
    today,
  }: { query: string; filters: TaskFilters; done: DoneFilter; today: string },
) {
  const needle = query.trim().toLocaleLowerCase("pt-BR");
  return tasks.filter((task) => {
    if (task.status === "canceled" && !filters.statuses.includes("canceled"))
      return false;
    if (task.status === "done") {
      if (done === "none") return false;
      if (
        done === "recent" &&
        task.completedAt &&
        daysBetween(task.completedAt, today) > RECENT_DONE_DAYS
      )
        return false;
    }
    if (
      needle &&
      !task.title.toLocaleLowerCase("pt-BR").includes(needle) &&
      !task.description?.toLocaleLowerCase("pt-BR").includes(needle) &&
      !task.tag?.toLocaleLowerCase("pt-BR").includes(needle)
    )
      return false;
    if (
      filters.projectIds.length &&
      !filters.projectIds.includes(task.projectId ?? "none")
    )
      return false;
    if (
      filters.priorities.length &&
      !filters.priorities.includes(task.priority)
    )
      return false;
    if (filters.statuses.length && !filters.statuses.includes(task.status))
      return false;
    if (filters.tags.length && !filters.tags.includes(task.tag ?? ""))
      return false;
    if (filters.due.length) {
      const bucket = dueBucket(task, today);
      const wanted = filters.due.some((value) =>
        value === "week" ? bucket === "week" : value === bucket,
      );
      if (!wanted) return false;
    }
    return true;
  });
}

export function sortTasks(tasks: Task[], sort: TaskSort) {
  if (sort === "manual") return tasks;
  const list = [...tasks];
  if (sort === "title")
    return list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  if (sort === "priority")
    return list.sort(
      (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
    );
  return list.sort((a, b) =>
    a.dueDate && b.dueDate
      ? a.dueDate.localeCompare(b.dueDate)
      : a.dueDate
        ? -1
        : b.dueDate
          ? 1
          : 0,
  );
}

export type TaskColumn = {
  /** `<groupBy>:<value>`, unique across groupings so preferences don't clash. */
  key: string;
  label: string;
  /** Token class for the column's dot. */
  dotClass: string;
  tasks: Task[];
  /** What moving a card into this column changes; undefined = no drop. */
  patch?: Partial<Task>;
  /** Defaults for a task created from this column's "+". */
  defaults?: Partial<Task>;
};

const statusDot: Record<TaskStatus, string> = {
  backlog: "bg-muted-foreground/50",
  todo: "bg-sky-400",
  in_progress: "bg-warning",
  blocked: "bg-destructive",
  done: "bg-success",
  canceled: "bg-muted-foreground/30",
};
const priorityDot: Record<TaskPriority, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  normal: "bg-muted-foreground/60",
  low: "bg-muted-foreground/30",
};

type GroupContext = {
  projects: Project[];
  companies: Company[];
  today: string;
};

/** Columns (or list sections) for a grouping, in a stable meaningful order. */
export function groupTasks(
  tasks: Task[],
  groupBy: TaskGroupBy,
  { projects, companies, today }: GroupContext,
): TaskColumn[] {
  const by = <K extends string>(keyOf: (task: Task) => K) => {
    const map = new Map<K, Task[]>();
    for (const task of tasks) {
      const key = keyOf(task);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  };

  switch (groupBy) {
    case "status": {
      const map = by((task) => task.status);
      const statuses: TaskStatus[] = [...taskStatuses];
      if (map.has("canceled")) statuses.push("canceled");
      return statuses.map((status) => ({
        key: `status:${status}`,
        label: taskStatusLabels[status],
        dotClass: statusDot[status],
        tasks: map.get(status) ?? [],
        patch: { status },
        defaults: { status },
      }));
    }
    case "priority": {
      const map = by((task) => task.priority);
      return priorityOrder.map((priority) => ({
        key: `priority:${priority}`,
        label: priorityText[priority],
        dotClass: priorityDot[priority],
        tasks: map.get(priority) ?? [],
        patch: { priority },
        defaults: { priority },
      }));
    }
    case "project": {
      const map = by((task) => task.projectId ?? "none");
      const shown = projects.filter(
        (project) => project.status === "active" || map.has(project.id),
      );
      return [
        ...shown.map((project) => ({
          key: `project:${project.id}`,
          label: project.name,
          dotClass: projectColorClasses[project.color].bg,
          tasks: map.get(project.id) ?? [],
          patch: { projectId: project.id },
          defaults: { projectId: project.id },
        })),
        {
          key: "project:none",
          label: "Sem projeto",
          dotClass: "bg-muted-foreground/40",
          tasks: map.get("none") ?? [],
          patch: { projectId: undefined },
        },
      ];
    }
    case "company": {
      const companyOf = new Map(projects.map((p) => [p.id, p.companyId]));
      const map = by(
        (task) => (task.projectId && companyOf.get(task.projectId)) || "none",
      );
      return [
        ...companies
          .filter((company) => map.has(company.id))
          .map((company) => ({
            key: `company:${company.id}`,
            label: company.tradeName || company.name,
            dotClass: "bg-sky-400",
            tasks: map.get(company.id) ?? [],
          })),
        {
          key: "company:none",
          label: "Sem empresa",
          dotClass: "bg-muted-foreground/40",
          tasks: map.get("none") ?? [],
        },
      ];
    }
    case "tag": {
      const map = by((task) => task.tag?.trim() || "none");
      const tags = [...map.keys()]
        .filter((tag) => tag !== "none")
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
      return [
        ...tags.map((tag) => ({
          key: `tag:${tag}`,
          label: tag,
          dotClass: "bg-primary/60",
          tasks: map.get(tag) ?? [],
          patch: { tag },
          defaults: { tag },
        })),
        {
          key: "tag:none",
          label: "Sem categoria",
          dotClass: "bg-muted-foreground/40",
          tasks: map.get("none") ?? [],
          patch: { tag: undefined },
        },
      ];
    }
    case "due": {
      const map = by((task) => dueBucket(task, today));
      const buckets: [DueBucket, string, string][] = [
        ["overdue", "Atrasadas", "bg-destructive"],
        ["week", "Próximos 7 dias", "bg-warning"],
        ["later", "Depois", "bg-sky-400"],
        ["none", "Sem prazo", "bg-muted-foreground/40"],
      ];
      return buckets.map(([key, label, dotClass]) => ({
        key: `due:${key}`,
        label,
        dotClass,
        tasks: map.get(key) ?? [],
      }));
    }
  }
}

/** Seconds logged in time entries per task (the time-tracking module is the source). */
export function timeByTask(
  entries: { taskId?: string; startedAt: string; endedAt?: string }[],
) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.taskId || !entry.endedAt) continue;
    const seconds =
      (Date.parse(entry.endedAt) - Date.parse(entry.startedAt)) / 1000;
    if (seconds > 0)
      totals.set(entry.taskId, (totals.get(entry.taskId) ?? 0) + seconds);
  }
  return totals;
}
