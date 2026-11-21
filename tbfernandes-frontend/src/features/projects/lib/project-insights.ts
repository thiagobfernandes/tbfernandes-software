import type { Milestone } from "@/features/goals/types/goal";
import type { Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import { localDay } from "@/features/time-tracking/lib/time";
import { daysBetween } from "@/lib/dates";
import type { AppData } from "@/lib/sample-data/store";

/**
 * Read-only figures of one project, all derived from records that already
 * exist: its tasks, the milestones of its goal, time entries, notes and
 * snippets. Lifecycle status (planned, active…) is the user's choice; health
 * is computed and only applies while the project is planned or active.
 */

export type HealthLevel = "ok" | "attention" | "risk";

export type HealthReason = {
  key: string;
  level: Exclude<HealthLevel, "ok">;
  text: string;
};

export type ProjectInsights = {
  tasks: Task[];
  open: Task[];
  done: Task[];
  blocked: Task[];
  overdue: Task[];
  /** Done among non-canceled tasks (0..1); undefined without tasks. */
  taskProgress?: number;
  /** Milestones of the linked goal, the only milestones the model has. */
  milestones: Milestone[];
  milestonesDone: number;
  /** Share of the planned period gone by (0..1), when there is a due date. */
  elapsed?: number;
  daysLeft?: number;
  nextDue?: Task;
  lastActivity?: string;
  seconds: number;
  notes: number;
  snippets: number;
  health?: HealthLevel;
  reasons: HealthReason[];
};

/** Days without any activity before an active project needs attention. */
export const INACTIVE_DAYS = 14;

const isOpen = (task: Task) =>
  task.status !== "done" && task.status !== "canceled";

function entrySeconds(
  startedAt: string,
  endedAt: string | undefined,
  now: Date,
) {
  const end = endedAt ? new Date(endedAt) : now;
  return Math.max(
    0,
    Math.floor((end.getTime() - new Date(startedAt).getTime()) / 1000),
  );
}

export function projectInsights(
  project: Project,
  data: AppData,
  today: string,
  now: Date,
): ProjectInsights {
  const tasks = data.tasks.filter((task) => task.projectId === project.id);
  const open = tasks.filter(isOpen);
  const done = tasks.filter((task) => task.status === "done");
  const blocked = open.filter((task) => task.status === "blocked");
  const overdue = open.filter((task) => task.dueDate && task.dueDate < today);
  const countable = tasks.filter((task) => task.status !== "canceled");
  const nextDue = open
    .filter((task) => task.dueDate && task.dueDate >= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];

  const milestones = project.goalId
    ? data.milestones
        .filter((milestone) => milestone.goalId === project.goalId)
        .sort((a, b) => (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"))
    : [];
  const milestonesDone = milestones.filter(
    (milestone) => milestone.done,
  ).length;

  const entries = data.timeEntries.filter(
    (entry) => entry.projectId === project.id,
  );
  const seconds = entries.reduce(
    (sum, entry) => sum + entrySeconds(entry.startedAt, entry.endedAt, now),
    0,
  );
  const notes = data.notes.filter((note) =>
    note.projectIds.includes(project.id),
  );
  const snippets = data.snippets.filter((snippet) =>
    snippet.projectIds.includes(project.id),
  );

  // Latest dated thing that happened in the project.
  const activity = [
    ...done.map((task) => task.completedAt?.slice(0, 10)),
    ...entries.map((entry) => localDay(new Date(entry.startedAt))),
    ...notes.map((note) => note.updatedAt.slice(0, 10)),
    ...snippets.map((snippet) => snippet.updatedAt.slice(0, 10)),
  ].filter((day): day is string => Boolean(day));
  const lastActivity = activity.sort().at(-1);

  let elapsed: number | undefined;
  let daysLeft: number | undefined;
  if (project.dueDate) {
    const total = daysBetween(project.startDate, project.dueDate);
    daysLeft = daysBetween(today, project.dueDate);
    elapsed =
      total > 0
        ? Math.min(
            1,
            Math.max(0, daysBetween(project.startDate, today) / total),
          )
        : 1;
  }

  const reasons: HealthReason[] = [];
  const tracked = project.status === "active" || project.status === "planned";
  if (tracked) {
    if (project.dueDate && project.dueDate < today)
      reasons.push({
        key: "due",
        level: "risk",
        text: `Prazo do projeto vencido há ${-daysLeft!} ${-daysLeft! === 1 ? "dia" : "dias"}`,
      });
    if (overdue.length > 0)
      reasons.push({
        key: "overdue",
        level: overdue.length >= 3 ? "risk" : "attention",
        text: `${overdue.length} ${overdue.length === 1 ? "tarefa atrasada" : "tarefas atrasadas"}`,
      });
    if (blocked.length > 0)
      reasons.push({
        key: "blocked",
        level: "attention",
        text: `${blocked.length} ${blocked.length === 1 ? "tarefa bloqueada" : "tarefas bloqueadas"}`,
      });
    const lateMilestones = milestones.filter(
      (milestone) =>
        !milestone.done && milestone.dueDate && milestone.dueDate < today,
    );
    if (lateMilestones.length > 0)
      reasons.push({
        key: "milestones",
        level: "attention",
        text: `${lateMilestones.length} ${lateMilestones.length === 1 ? "marco vencido" : "marcos vencidos"} na meta`,
      });
    if (project.status === "active" && open.length === 0)
      reasons.push({
        key: "next",
        level: "attention",
        text: "Sem próxima ação: nenhuma tarefa aberta",
      });
    if (project.status === "active") {
      const quiet = lastActivity
        ? daysBetween(lastActivity, today)
        : daysBetween(project.startDate, today);
      if (quiet >= INACTIVE_DAYS)
        reasons.push({
          key: "inactive",
          level: "attention",
          text: lastActivity
            ? `Sem atividade há ${quiet} dias`
            : `Sem atividade registrada desde o início`,
        });
    }
  }

  return {
    tasks,
    open,
    done,
    blocked,
    overdue,
    taskProgress: countable.length ? done.length / countable.length : undefined,
    milestones,
    milestonesDone,
    elapsed,
    daysLeft,
    nextDue,
    lastActivity,
    seconds,
    notes: notes.length,
    snippets: snippets.length,
    health: tracked
      ? reasons.some((reason) => reason.level === "risk")
        ? "risk"
        : reasons.length > 0
          ? "attention"
          : "ok"
      : undefined,
    reasons,
  };
}

export const healthLabels: Record<HealthLevel, string> = {
  ok: "Em dia",
  attention: "Atenção",
  risk: "Em risco",
};

/** Semantic tokens for the health dot and text. */
export const healthTone: Record<HealthLevel, { dot: string; text: string }> = {
  ok: { dot: "bg-success", text: "text-success" },
  attention: { dot: "bg-warning", text: "text-warning" },
  risk: { dot: "bg-destructive", text: "text-destructive" },
};
