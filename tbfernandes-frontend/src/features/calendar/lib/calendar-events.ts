import { isOpenTask } from "@/lib/sample-data/work";
import type { AppData } from "@/lib/sample-data/store";

export const eventKinds = [
  "task",
  "project",
  "milestone",
  "goal",
  "study",
  "follow-up",
  "certification",
  "purchase",
] as const;

export type EventKind = (typeof eventKinds)[number];

export const eventKindLabels: Record<EventKind, string> = {
  task: "Tarefas",
  project: "Prazos de projetos",
  milestone: "Marcos",
  goal: "Prazos de metas",
  study: "Estudos",
  "follow-up": "Follow-ups",
  certification: "Vencimento de certificações",
  purchase: "Compras planejadas",
};

export type CalendarEvent = {
  id: string;
  day: string;
  kind: EventKind;
  title: string;
  /** Page that holds the record; tasks open in the detail sheet instead. */
  href?: string;
  taskId?: string;
  done: boolean;
};

/** Every dated record in the store, as one list for the calendar. */
export function buildCalendarEvents(data: AppData): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const add = (event: CalendarEvent | false | undefined) => {
    if (event) events.push(event);
  };

  for (const task of data.tasks) {
    if (task.status === "canceled") continue;
    add(
      task.dueDate !== undefined && {
        id: `task:${task.id}`,
        day: task.dueDate,
        kind: "task",
        title: task.title,
        taskId: task.id,
        done: !isOpenTask(task),
      },
    );
  }
  for (const project of data.projects) {
    add(
      project.dueDate !== undefined && {
        id: `project:${project.id}`,
        day: project.dueDate,
        kind: "project",
        title: project.name,
        href: `/projects/${project.id}`,
        done: project.status === "completed",
      },
    );
  }
  for (const milestone of data.milestones) {
    add(
      milestone.dueDate !== undefined && {
        id: `milestone:${milestone.id}`,
        day: milestone.dueDate,
        kind: "milestone",
        title: milestone.title,
        href: `/goals/${milestone.goalId}`,
        done: milestone.done,
      },
    );
  }
  for (const goal of data.goals) {
    add(
      goal.dueDate !== undefined && {
        id: `goal:${goal.id}`,
        day: goal.dueDate,
        kind: "goal",
        title: goal.name,
        href: `/goals/${goal.id}`,
        done: goal.status === "completed",
      },
    );
  }
  for (const study of data.studies) {
    add(
      study.dueDate !== undefined && {
        id: `study:${study.id}`,
        day: study.dueDate,
        kind: "study",
        title: study.name,
        href: "/learning",
        done: study.status === "completed",
      },
    );
  }
  for (const contact of data.contacts) {
    add(
      contact.nextContact !== undefined && {
        id: `follow-up:${contact.id}`,
        day: contact.nextContact,
        kind: "follow-up",
        title: `Falar com ${contact.name}`,
        href: `/contacts?contact=${contact.id}`,
        done: false,
      },
    );
  }
  for (const certification of data.certifications) {
    add(
      certification.expiresAt !== undefined && {
        id: `certification:${certification.id}`,
        day: certification.expiresAt,
        kind: "certification",
        title: `${certification.name} vence`,
        href: "/certifications",
        done: false,
      },
    );
  }
  for (const purchase of data.purchases) {
    add(
      purchase.desiredDate !== undefined && {
        id: `purchase:${purchase.id}`,
        day: purchase.desiredDate,
        kind: "purchase",
        title: purchase.name,
        href: "/finance/purchases",
        done: purchase.status === "bought",
      },
    );
  }

  return events.sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      eventKinds.indexOf(a.kind) - eventKinds.indexOf(b.kind),
  );
}

/** Events grouped by ISO day. */
export function eventsByDay(events: CalendarEvent[]) {
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    byDay.set(event.day, [...(byDay.get(event.day) ?? []), event]);
  }
  return byDay;
}
