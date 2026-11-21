import { projectInsights } from "@/features/projects/lib/project-insights";
import { addDays, daysBetween, formatShort } from "@/lib/dates";
import { projectHref } from "@/lib/routes";
import type { AppData } from "@/lib/sample-data/store";

export type AttentionKind =
  | "overdue"
  | "blocked"
  | "dueSoon"
  | "project"
  | "appointment"
  | "finance"
  | "approval";

export type AttentionItem = {
  key: string;
  kind: AttentionKind;
  /** 0 = most urgent. */
  rank: number;
  title: string;
  /** Why it needs attention, in plain words. */
  reason: string;
  href?: string;
  taskId?: string;
};

export const attentionLabels: Record<AttentionKind, string> = {
  overdue: "Atrasada",
  blocked: "Bloqueada",
  dueSoon: "Vence logo",
  project: "Projeto",
  appointment: "Compromisso",
  finance: "Despesa",
  approval: "Aprovação",
};

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Everything that needs a decision soon, from every module, each with its
 * reason. Rest days and unplanned routines are never listed: missing a day
 * that was not planned is not a problem.
 */
export function attentionItems(
  data: AppData,
  today: string,
  now: Date,
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const projectName = (id?: string) =>
    data.projects.find((project) => project.id === id)?.name;
  const open = data.tasks.filter(
    (task) => task.status !== "done" && task.status !== "canceled",
  );

  for (const task of open) {
    const where = projectName(task.projectId);
    if (task.dueDate && task.dueDate < today) {
      const days = daysBetween(task.dueDate, today);
      items.push({
        key: `o:${task.id}`,
        kind: "overdue",
        rank: 0,
        title: task.title,
        reason: `Prazo venceu há ${days} ${days === 1 ? "dia" : "dias"}${where ? ` · ${where}` : ""}`,
        taskId: task.id,
      });
    } else if (task.status === "blocked") {
      items.push({
        key: `b:${task.id}`,
        kind: "blocked",
        rank: 1,
        title: task.title,
        reason: `Bloqueada${where ? ` · ${where}` : ""}`,
        taskId: task.id,
      });
    } else if (task.dueDate && task.dueDate <= addDays(today, 1)) {
      items.push({
        key: `d:${task.id}`,
        kind: "dueSoon",
        rank: 2,
        title: task.title,
        reason: `${task.dueDate === today ? "Vence hoje" : "Vence amanhã"}${where ? ` · ${where}` : ""}`,
        taskId: task.id,
      });
    }
  }

  for (const project of data.projects) {
    const insights = projectInsights(project, data, today, now);
    // Overdue and blocked tasks are already listed one by one.
    const reasons = insights.reasons.filter(
      (reason) => reason.key !== "overdue" && reason.key !== "blocked",
    );
    if (reasons.length === 0) continue;
    items.push({
      key: `p:${project.id}`,
      kind: "project",
      rank: reasons.some((reason) => reason.level === "risk") ? 0 : 2,
      title: project.name,
      reason: reasons.map((reason) => reason.text).join(" · "),
      href: projectHref(project.id),
    });
  }

  for (const appointment of data.appointments) {
    if (appointment.date !== today && appointment.date !== addDays(today, 1))
      continue;
    items.push({
      key: `a:${appointment.id}`,
      kind: "appointment",
      rank: 3,
      title: appointment.title,
      reason: `${appointment.date === today ? "Hoje" : "Amanhã"} às ${appointment.startTime.slice(0, 5)}`,
      href: "/calendar",
    });
  }

  for (const entry of data.financeEntries) {
    if (entry.kind !== "expense") continue;
    if (entry.date < today || entry.date > addDays(today, 7)) continue;
    items.push({
      key: `f:${entry.id}`,
      kind: "finance",
      rank: 3,
      title: entry.description,
      reason: `${money.format(entry.amount)} em ${formatShort(entry.date)}`,
      href: "/finance",
    });
  }

  const pending = data.sendRequests.filter(
    (request) => request.status === "pending",
  );
  if (pending.length > 0)
    items.push({
      key: "approval",
      kind: "approval",
      rank: 2,
      title: `${pending.length} ${pending.length === 1 ? "mensagem esperando" : "mensagens esperando"} aprovação`,
      reason: "Sem aprovação, sai sozinha uma hora depois do pedido",
      href: "/prospecting",
    });

  return items.sort(
    (a, b) => a.rank - b.rank || a.title.localeCompare(b.title, "pt-BR"),
  );
}
