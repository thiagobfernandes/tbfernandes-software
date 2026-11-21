import type { Task } from "@/features/tasks/types/task";
import { startOfWeek } from "@/features/time-tracking/lib/time";
import { addDays, daysBetween } from "@/lib/dates";
import type { AppData } from "@/lib/sample-data/store";

/**
 * Plain functions behind the overview's "what now" widgets. They only read
 * tasks as they are: status, priority, due date and completion date.
 */

const isOpen = (task: Task) =>
  task.status !== "done" && task.status !== "canceled";

const priorityRank: Record<Task["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export type NextStep = {
  task: Task;
  /** Facts that put this task first, in plain words. */
  reasons: string[];
  /** How many other tasks are also candidates. */
  others: number;
};

/**
 * The task to work on now. Order: already in progress, then overdue, then due
 * today, then by priority and the nearest due date. Blocked tasks are left
 * out, since they cannot move. The reasons only restate those facts.
 */
export function nextStep(data: AppData, today: string): NextStep | undefined {
  const candidates = data.tasks.filter(
    (task) => isOpen(task) && task.status !== "blocked",
  );
  const urgency = (task: Task) => {
    if (task.status === "in_progress") return 0;
    if (task.dueDate && task.dueDate < today) return 1;
    if (task.dueDate === today) return 2;
    return 3;
  };
  const [task] = [...candidates].sort(
    (a, b) =>
      urgency(a) - urgency(b) ||
      priorityRank[a.priority] - priorityRank[b.priority] ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      a.title.localeCompare(b.title, "pt-BR"),
  );
  if (!task) return undefined;

  const reasons: string[] = [];
  if (task.status === "in_progress") reasons.push("Já está em andamento");
  if (task.dueDate && task.dueDate < today) {
    const days = daysBetween(task.dueDate, today);
    reasons.push(`Atrasada há ${days} ${days === 1 ? "dia" : "dias"}`);
  } else if (task.dueDate === today) reasons.push("Vence hoje");
  else if (task.dueDate && daysBetween(today, task.dueDate) <= 3)
    reasons.push(`Vence em ${daysBetween(today, task.dueDate)} dias`);
  if (task.priority === "urgent") reasons.push("Prioridade urgente");
  else if (task.priority === "high") reasons.push("Prioridade alta");
  if (reasons.length === 0) reasons.push("A próxima da fila pelo prazo");

  return { task, reasons, others: candidates.length - 1 };
}

/** Tasks due today (open or finished today), plus open overdue ones. */
export function todayTasks(data: AppData, today: string) {
  const due = data.tasks.filter(
    (task) => task.dueDate === today && task.status !== "canceled",
  );
  const overdue = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate && task.dueDate < today,
  );
  const done = due.filter((task) => task.status === "done").length;
  return {
    due: [...due].sort(
      (a, b) =>
        Number(a.status === "done") - Number(b.status === "done") ||
        priorityRank[a.priority] - priorityRank[b.priority],
    ),
    overdue,
    done,
    total: due.length,
  };
}

export type ProgressPeriod = "week" | "month";

export function periodRange(today: string, period: ProgressPeriod) {
  if (period === "week") {
    const from = startOfWeek(today);
    return { from, to: addDays(from, 6) };
  }
  const from = `${today.slice(0, 7)}-01`;
  const next = new Date(`${from}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { from, to: addDays(next.toISOString().slice(0, 10), -1) };
}

/**
 * Tasks with a due date in the period (canceled ones left out): how many are
 * done, in progress and still pending. The rate is done / all of them, so it
 * answers "how much of what was due this week is finished".
 */
export function periodProgress(
  data: AppData,
  today: string,
  period: ProgressPeriod,
) {
  const { from, to } = periodRange(today, period);
  const inPeriod = data.tasks.filter(
    (task) =>
      task.status !== "canceled" &&
      task.dueDate &&
      task.dueDate >= from &&
      task.dueDate <= to,
  );
  const done = inPeriod.filter((task) => task.status === "done").length;
  const inProgress = inPeriod.filter(
    (task) => task.status === "in_progress",
  ).length;
  const blocked = inPeriod.filter((task) => task.status === "blocked").length;
  const pending = inPeriod.length - done - inProgress;
  const finishedInPeriod = data.tasks.filter(
    (task) =>
      task.status === "done" &&
      task.completedAt &&
      task.completedAt.slice(0, 10) >= from &&
      task.completedAt.slice(0, 10) <= to,
  ).length;
  return {
    from,
    to,
    total: inPeriod.length,
    done,
    inProgress,
    pending,
    blocked,
    finishedInPeriod,
    rate: inPeriod.length ? done / inPeriod.length : undefined,
  };
}

/** "Bom dia" / "Boa tarde" / "Boa noite" by the local hour. */
export function greetingFor(now: Date) {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
