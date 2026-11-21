"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Markdown } from "@/components/shared/markdown";
import { PriorityIcon } from "@/components/shared/priority-badge";
import { RelationTree } from "@/components/shared/relation-tree";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Checkbox } from "@/components/ui/checkbox";
import type { Answer } from "@/features/assistant/lib/answer";
import { askAssistant } from "@/features/assistant/lib/ask";
import { RhythmSection } from "@/features/dashboard/components/rhythm-section";
import {
  attentionItems,
  attentionLabels,
} from "@/features/dashboard/lib/attention";
import type { WidgetType } from "@/features/dashboard/lib/widgets";
import { buildContextTree, noteHref } from "@/features/knowledge/lib/graph";
import { HealthBadge } from "@/features/projects/components/project-bits";
import { projectInsights } from "@/features/projects/lib/project-insights";
import { RoutineHeatmap } from "@/features/routines/components/routine-heatmap";
import { routineActions } from "@/features/routines/lib/routine-actions";
import { checkIndex, dayTally } from "@/features/routines/lib/routine-stats";
import {
  checkOn,
  isDueOn,
  routinesDueOn,
  shortTime,
} from "@/features/routines/lib/routines";
import type { Task } from "@/features/tasks/types/task";
import {
  entrySeconds,
  formatDuration,
  localDay,
  startOfWeek,
} from "@/features/time-tracking/lib/time";
import { addDays, daysBetween, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { goalHref, projectHref } from "@/lib/routes";
import { type AppData, workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

export type WidgetProps = {
  data: AppData;
  /** Planning day (sample day in local mode). */
  today: string;
  now: Date;
  config: Record<string, string>;
  setConfig: (patch: Record<string, string>) => void;
  onOpenTask: (id: string) => void;
  /** Maximized widgets show more rows. */
  expanded: boolean;
};

type WidgetComponent = (props: WidgetProps) => React.ReactNode;

const isOpen = (task: Task) =>
  task.status !== "done" && task.status !== "canceled";
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const longDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Quiet line for a widget with nothing to show. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>
  );
}

function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-1 self-start text-xs text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex min-w-24 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-semibold tabular-nums", tone)}>
        {value}
      </dd>
    </div>
  );
}

function TaskRows({
  tasks,
  data,
  today,
  onOpenTask,
  limit,
}: {
  tasks: Task[];
  data: AppData;
  today: string;
  onOpenTask: (id: string) => void;
  limit: number;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {tasks.slice(0, limit).map((task) => {
        const project = data.projects.find(
          (item) => item.id === task.projectId,
        );
        return (
          <li key={task.id} className="group flex items-center gap-2.5 py-1.5">
            <button
              type="button"
              aria-label={`Concluir "${task.title}"`}
              title="Concluir"
              onClick={() => {
                workActions.updateTask(task.id, { status: "done" });
                toast.success("Tarefa concluída", {
                  action: {
                    label: "Desfazer",
                    onClick: () =>
                      workActions.updateTask(task.id, { status: task.status }),
                  },
                });
              }}
              className="flex size-4 shrink-0 items-center justify-center rounded-full border border-input outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Check className="size-2.5 text-primary opacity-0 group-hover:opacity-60" />
            </button>
            <PriorityIcon priority={task.priority} />
            <button
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="min-w-0 flex-1 truncate text-left text-sm outline-none hover:text-primary focus-visible:text-primary"
            >
              {task.title}
            </button>
            {project && (
              <span className="hidden max-w-32 items-center gap-1 truncate text-xs text-muted-foreground sm:flex">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    projectColorClasses[project.color].bg,
                  )}
                />
                <span className="truncate">{project.name}</span>
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  task.dueDate < today
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {formatShort(task.dueDate)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const DayWidget: WidgetComponent = ({ data, today, now }) => {
  const routineDay = localDay(now);
  const routines = routinesDueOn(data.routines, routineDay);
  const doneRoutines = routines.filter((routine) =>
    checkOn(data.routineChecks, routine.id, routineDay),
  ).length;
  const appointments = data.appointments
    .filter((item) => item.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const dueToday = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate === today,
  );
  const seconds = data.timeEntries
    .filter((entry) => localDay(new Date(entry.startedAt)) === routineDay)
    .reduce((sum, entry) => sum + entrySeconds(entry, now), 0);
  const next =
    appointments.find(
      (item) =>
        item.endTime.slice(0, 5) >=
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    ) ?? appointments[0];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold first-letter:uppercase">
          {longDay.format(new Date(`${today}T00:00:00Z`))}
        </p>
        <p className="text-sm text-muted-foreground">
          {next
            ? `Próximo compromisso: ${next.title} às ${next.startTime.slice(0, 5)}`
            : "Nenhum compromisso marcado para hoje."}
        </p>
      </div>
      <dl className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="Compromissos" value={appointments.length} />
        <Stat label="Vencem hoje" value={dueToday.length} />
        <Stat
          label="Rotinas"
          value={routines.length ? `${doneRoutines}/${routines.length}` : "—"}
          tone={
            routines.length && doneRoutines === routines.length
              ? "text-primary"
              : undefined
          }
        />
        <Stat
          label="Apontado hoje"
          value={seconds ? formatDuration(seconds) : "—"}
        />
      </dl>
    </div>
  );
};

const AttentionWidget: WidgetComponent = ({
  data,
  today,
  now,
  onOpenTask,
  expanded,
}) => {
  const items = attentionItems(data, today, now);
  if (items.length === 0) return <Empty>Nada pedindo atenção agora.</Empty>;
  const limit = expanded ? items.length : 7;
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-border/60">
        {items.slice(0, limit).map((item) => {
          const label = (
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{item.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                {item.reason}
              </span>
            </span>
          );
          return (
            <li key={item.key} className="flex items-center gap-3 py-1.5">
              <span
                className={cn(
                  "w-20 shrink-0 text-[11px] font-medium",
                  item.kind === "overdue" ||
                    (item.kind === "project" && item.rank === 0)
                    ? "text-destructive"
                    : item.kind === "blocked" || item.kind === "project"
                      ? "text-warning"
                      : "text-muted-foreground",
                )}
              >
                {attentionLabels[item.kind]}
              </span>
              {item.taskId ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(item.taskId!)}
                  className="min-w-0 flex-1 text-left outline-none hover:text-primary focus-visible:text-primary"
                >
                  {label}
                </button>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="min-w-0 flex-1 outline-none hover:text-primary focus-visible:text-primary"
                >
                  {label}
                </Link>
              ) : (
                <span className="min-w-0 flex-1">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <p className="pt-1 text-xs text-muted-foreground">
          +{items.length - limit} itens (maximize para ver todos)
        </p>
      )}
    </div>
  );
};

const IndicatorsWidget: WidgetComponent = ({ data, today, now }) => {
  const open = data.tasks.filter(isOpen);
  const overdue = open.filter((task) => task.dueDate && task.dueDate < today);
  const done7 = data.tasks.filter(
    (task) =>
      task.status === "done" &&
      task.completedAt &&
      daysBetween(task.completedAt.slice(0, 10), today) < 7 &&
      task.completedAt.slice(0, 10) <= today,
  );
  const weekStart = startOfWeek(localDay(now));
  const weekSeconds = data.timeEntries
    .filter((entry) => localDay(new Date(entry.startedAt)) >= weekStart)
    .reduce((sum, entry) => sum + entrySeconds(entry, now), 0);
  const active = data.projects.filter((project) => project.status === "active");
  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-3">
      <Stat label="Tarefas abertas" value={open.length} />
      <Stat
        label="Atrasadas"
        value={overdue.length}
        tone={overdue.length ? "text-destructive" : undefined}
      />
      <Stat label="Concluídas em 7 dias" value={done7.length} />
      <Stat
        label="Horas na semana"
        value={weekSeconds ? formatDuration(weekSeconds) : "—"}
      />
      <Stat label="Projetos ativos" value={active.length} />
    </dl>
  );
};

const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 } as const;

const PriorityTasksWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
  expanded,
}) => {
  const tasks = data.tasks
    .filter(
      (task) =>
        isOpen(task) &&
        task.status !== "blocked" &&
        (task.priority === "urgent" || task.priority === "high"),
    )
    .sort(
      (a, b) =>
        priorityRank[a.priority] - priorityRank[b.priority] ||
        (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"),
    );
  if (tasks.length === 0)
    return <Empty>Nenhuma tarefa urgente ou de prioridade alta aberta.</Empty>;
  return (
    <div className="flex flex-col">
      <TaskRows
        tasks={tasks}
        data={data}
        today={today}
        onOpenTask={onOpenTask}
        limit={expanded ? 50 : 6}
      />
      <More href="/tasks">Todas as tarefas</More>
    </div>
  );
};

const OverdueWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
  expanded,
}) => {
  const tasks = data.tasks
    .filter((task) => isOpen(task) && task.dueDate && task.dueDate < today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  if (tasks.length === 0) return <Empty>Nada atrasado.</Empty>;
  return (
    <TaskRows
      tasks={tasks}
      data={data}
      today={today}
      onOpenTask={onOpenTask}
      limit={expanded ? 50 : 5}
    />
  );
};

const BlockedWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
  expanded,
}) => {
  const tasks = data.tasks.filter((task) => task.status === "blocked");
  if (tasks.length === 0) return <Empty>Nada bloqueado.</Empty>;
  return (
    <TaskRows
      tasks={tasks}
      data={data}
      today={today}
      onOpenTask={onOpenTask}
      limit={expanded ? 50 : 5}
    />
  );
};

const ActiveProjectsWidget: WidgetComponent = ({ data, today, now }) => {
  const rows = data.projects
    .filter((project) => project.status === "active")
    .map((project) => ({
      project,
      insights: projectInsights(project, data, today, now),
    }));
  if (rows.length === 0) return <Empty>Nenhum projeto ativo.</Empty>;
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(({ project, insights }) => {
        const pct = Math.round((insights.taskProgress ?? 0) * 100);
        return (
          <li key={project.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Link
                href={projectHref(project.id)}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary"
              >
                {project.name}
              </Link>
              <HealthBadge insights={insights} />
              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                {insights.taskProgress === undefined ? "—" : `${pct}%`}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  projectColorClasses[project.color].bg,
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            {insights.reasons.length > 0 && (
              <span className="truncate text-xs text-muted-foreground">
                {insights.reasons.map((reason) => reason.text).join(" · ")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const DeliveriesWidget: WidgetComponent = ({ data, today, onOpenTask }) => {
  const limit = addDays(today, 14);
  const items = [
    ...data.projects
      .filter(
        (project) =>
          project.status !== "completed" &&
          project.dueDate &&
          project.dueDate >= today &&
          project.dueDate <= limit,
      )
      .map((project) => ({
        key: `p:${project.id}`,
        day: project.dueDate!,
        title: `Prazo do projeto ${project.name}`,
        href: projectHref(project.id) as string | undefined,
        taskId: undefined as string | undefined,
      })),
    ...data.tasks
      .filter(
        (task) =>
          isOpen(task) &&
          task.dueDate &&
          task.dueDate >= today &&
          task.dueDate <= limit,
      )
      .map((task) => ({
        key: `t:${task.id}`,
        day: task.dueDate!,
        title: task.title,
        href: undefined,
        taskId: task.id,
      })),
  ].sort((a, b) => a.day.localeCompare(b.day));
  const nextDeliveries = data.projects.filter(
    (project) => project.status === "active" && project.nextDelivery,
  );
  if (items.length === 0 && nextDeliveries.length === 0)
    return <Empty>Nada vence nos próximos 14 dias.</Empty>;
  return (
    <div className="flex flex-col gap-3">
      {nextDeliveries.length > 0 && (
        <ul className="flex flex-col gap-1">
          {nextDeliveries.map((project) => (
            <li key={project.id} className="flex items-baseline gap-2 text-sm">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 translate-y-[-1px] rounded-full",
                  projectColorClasses[project.color].bg,
                )}
              />
              <Link
                href={projectHref(project.id)}
                className="min-w-0 truncate hover:text-primary"
              >
                <span className="font-medium">{project.nextDelivery}</span>
                <span className="text-muted-foreground"> · {project.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ol className="flex flex-col divide-y divide-border/60">
        {items.slice(0, 8).map((item) => (
          <li
            key={item.key}
            className="flex items-baseline gap-3 py-1.5 text-sm"
          >
            <span className="w-14 shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {formatShort(item.day)}
            </span>
            {item.taskId ? (
              <button
                type="button"
                onClick={() => onOpenTask(item.taskId!)}
                className="min-w-0 flex-1 truncate text-left hover:text-primary"
              >
                {item.title}
              </button>
            ) : (
              <Link
                href={item.href!}
                className="min-w-0 flex-1 truncate hover:text-primary"
              >
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};

const AgendaWidget: WidgetComponent = ({
  data,
  today,
  now,
  config,
  setConfig,
  onOpenTask,
}) => {
  const range = (config.range as "day" | "week") ?? "day";
  const days =
    range === "day"
      ? [today]
      : Array.from({ length: 7 }, (_, index) => addDays(today, index));
  const routineToday = localDay(now);
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl<"day" | "week">
        label="Período da agenda"
        size="sm"
        value={range}
        onChange={(value) => setConfig({ range: value })}
        options={[
          { value: "day", label: "Dia" },
          { value: "week", label: "7 dias" },
        ]}
        className="self-start"
      />
      <ol className="flex flex-col gap-3">
        {days.map((day) => {
          const appointments = data.appointments
            .filter((item) => item.date === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const due = data.tasks.filter(
            (task) => isOpen(task) && task.dueDate === day,
          );
          // Routines follow the real calendar day, like the routines page.
          const routineDay = addDays(routineToday, daysBetween(today, day));
          const routines = data.routines.filter(
            (routine) => isDueOn(routine, routineDay) && routine.startTime,
          );
          const empty =
            appointments.length + due.length + routines.length === 0;
          return (
            <li key={day} className="flex flex-col gap-1">
              {range === "week" && (
                <h3
                  className={cn(
                    "text-[11px] font-medium tracking-wide uppercase",
                    day === today ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {day === today
                    ? "Hoje"
                    : new Intl.DateTimeFormat("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(`${day}T00:00:00Z`))}
                </h3>
              )}
              {empty ? (
                <p className="text-xs text-muted-foreground">
                  {range === "day" ? "Dia livre: nada marcado." : "—"}
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5 text-sm">
                  {[
                    ...appointments.map((item) => ({
                      key: item.id,
                      time: item.startTime.slice(0, 5),
                      title: item.title,
                      routine: false,
                    })),
                    ...routines.map((routine) => ({
                      key: routine.id,
                      time: shortTime(routine.startTime) ?? "",
                      title: routine.title,
                      routine: true,
                    })),
                  ]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((item) => (
                      <li
                        key={item.key}
                        className={cn(
                          "flex items-baseline gap-2",
                          item.routine && "text-muted-foreground",
                        )}
                      >
                        <span className="w-11 shrink-0 text-xs text-muted-foreground tabular-nums">
                          {item.time}
                        </span>
                        <span
                          aria-hidden
                          title={item.routine ? "Rotina" : "Compromisso"}
                          className={cn(
                            "size-1.5 shrink-0 translate-y-[-2px] rounded-full",
                            item.routine
                              ? "border border-muted-foreground"
                              : "bg-primary",
                          )}
                        />
                        <span className="min-w-0 truncate">{item.title}</span>
                      </li>
                    ))}
                  {due.map((task) => (
                    <li key={task.id} className="flex items-baseline gap-2">
                      <span className="w-11 shrink-0 text-xs text-muted-foreground">
                        prazo
                      </span>
                      <span
                        className="size-1.5 shrink-0 translate-y-[-2px] rotate-45 bg-foreground/50"
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => onOpenTask(task.id)}
                        className="min-w-0 truncate text-left hover:text-primary"
                      >
                        {task.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <More href="/calendar">Abrir calendário</More>
    </div>
  );
};

const RoutinesWidget: WidgetComponent = ({ data, now }) => {
  const day = localDay(now);
  const routines = routinesDueOn(data.routines, day);
  if (routines.length === 0)
    return <Empty>Nada planejado para hoje. Dia livre também conta.</Empty>;
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-border/60">
        {routines.map((routine) => {
          const done = Boolean(checkOn(data.routineChecks, routine.id, day));
          const id = `w-routine-${routine.id}`;
          return (
            <li key={routine.id} className="flex items-center gap-2.5 py-1.5">
              <Checkbox
                id={id}
                checked={done}
                onCheckedChange={() => {
                  const nowDone = routineActions.toggle(routine, day);
                  toast.success(
                    nowDone ? "Rotina feita" : "Marcação desfeita",
                    { description: routine.title },
                  );
                }}
              />
              <label
                htmlFor={id}
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  done && "text-muted-foreground line-through",
                )}
              >
                {routine.title}
              </label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {shortTime(routine.startTime)}
              </span>
            </li>
          );
        })}
      </ul>
      <More href="/routines">Abrir rotinas</More>
    </div>
  );
};

const ConsistencyWidget: WidgetComponent = ({ data, now }) => {
  const day = localDay(now);
  const index = checkIndex(data.routineChecks);
  const tracked = data.routines.filter(
    (routine) => routine.active || index.has(routine.id),
  );
  if (tracked.length === 0)
    return <Empty>Crie uma rotina para acompanhar a consistência.</Empty>;
  return (
    <RoutineHeatmap
      today={day}
      weeks={16}
      label="Rotinas feitas por dia nas últimas 16 semanas"
      cellFor={(cell) => {
        const { due, done } = dayTally(tracked, index, cell);
        if (due === 0) return { kind: "off" };
        return {
          kind: "due",
          ratio: done / due,
          label: `${done} de ${due} feitas`,
        };
      }}
    />
  );
};

const GoalsWidget: WidgetComponent = ({ data, today }) => {
  const goals = data.goals.filter((goal) => goal.status === "active");
  if (goals.length === 0) return <Empty>Nenhuma meta ativa.</Empty>;
  return (
    <ul className="flex flex-col gap-3">
      {goals.slice(0, 6).map((goal) => {
        const milestones = data.milestones.filter(
          (milestone) => milestone.goalId === goal.id,
        );
        const done = milestones.filter((milestone) => milestone.done).length;
        const next = milestones
          .filter((milestone) => !milestone.done)
          .sort((a, b) =>
            (a.dueDate ?? "9").localeCompare(b.dueDate ?? "9"),
          )[0];
        return (
          <li key={goal.id} className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <Link
                href={goalHref(goal.id)}
                className="min-w-0 flex-1 truncate text-sm font-medium hover:text-primary"
              >
                {goal.name}
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums">
                {milestones.length
                  ? `${done}/${milestones.length} marcos`
                  : "sem marcos"}
              </span>
            </div>
            {milestones.length > 0 && (
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(done / milestones.length) * 100}%` }}
                />
              </div>
            )}
            {next && (
              <span
                className={cn(
                  "truncate text-xs",
                  next.dueDate && next.dueDate < today
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                Próximo: {next.title}
                {next.dueDate && ` · ${formatShort(next.dueDate)}`}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const LearningWidget: WidgetComponent = ({ data }) => {
  const studies = data.studies.filter(
    (study) => study.status === "in_progress",
  );
  if (studies.length === 0) return <Empty>Nenhum estudo em andamento.</Empty>;
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col divide-y divide-border/60">
        {studies.map((study) => {
          const materials = data.materials.filter(
            (material) => material.studyId === study.id,
          );
          const done = materials.filter(
            (material) =>
              material.status === "consumed" || material.status === "reviewed",
          ).length;
          return (
            <li key={study.id} className="flex flex-col py-1.5">
              <span className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {study.name}
                </span>
                {materials.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {done}/{materials.length}
                  </span>
                )}
              </span>
              {study.nextActivity && (
                <span className="truncate text-xs text-muted-foreground">
                  Próximo: {study.nextActivity}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <More href="/learning">Abrir aprendizado</More>
    </div>
  );
};

const RecentNotesWidget: WidgetComponent = ({ data, expanded }) => {
  const notes = [...data.notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, expanded ? 20 : 5);
  if (notes.length === 0) return <Empty>Nenhuma nota ainda.</Empty>;
  return (
    <ul className="flex flex-col">
      {notes.map((note) => (
        <li key={note.id} className="flex items-baseline gap-2 py-1">
          <Link
            href={noteHref(note.id)}
            className="min-w-0 flex-1 truncate text-sm hover:text-primary"
          >
            {note.title}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatShort(note.updatedAt.slice(0, 10))}
          </span>
        </li>
      ))}
    </ul>
  );
};

const RecentSnippetsWidget: WidgetComponent = ({ data, expanded }) => {
  const snippets = [...data.snippets]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, expanded ? 20 : 5);
  if (snippets.length === 0) return <Empty>Nenhum snippet ainda.</Empty>;
  return (
    <ul className="flex flex-col">
      {snippets.map((snippet) => (
        <li key={snippet.id} className="flex items-baseline gap-2 py-1">
          <Link
            href="/knowledge/snippets"
            className="min-w-0 flex-1 truncate text-sm hover:text-primary"
          >
            {snippet.title}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatShort(snippet.updatedAt.slice(0, 10))}
          </span>
        </li>
      ))}
    </ul>
  );
};

const FinanceWidget: WidgetComponent = ({ data, today }) => {
  const month = today.slice(0, 7);
  const inMonth = data.financeEntries.filter(
    (entry) => entry.date.slice(0, 7) === month && entry.date <= today,
  );
  const income = inMonth
    .filter((entry) => entry.kind === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = inMonth
    .filter((entry) => entry.kind === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const upcoming = data.financeEntries
    .filter(
      (entry) =>
        entry.kind === "expense" &&
        entry.date > today &&
        entry.date <= addDays(today, 7),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        <Stat
          label="Saldo do mês"
          value={money.format(income - expense)}
          tone={income - expense < 0 ? "text-destructive" : undefined}
        />
        <Stat label="Entradas" value={money.format(income)} />
        <Stat label="Saídas" value={money.format(expense)} />
      </dl>
      {upcoming.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-sm">
          {upcoming.map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-2">
              <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatShort(entry.date)}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {entry.description}
              </span>
              <span className="text-xs tabular-nums">
                {money.format(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <More href="/finance">Abrir finanças</More>
    </div>
  );
};

const TimeWidget: WidgetComponent = ({ data, now }) => {
  const day = localDay(now);
  const weekStart = startOfWeek(day);
  const week = data.timeEntries.filter(
    (entry) => localDay(new Date(entry.startedAt)) >= weekStart,
  );
  const todaySeconds = week
    .filter((entry) => localDay(new Date(entry.startedAt)) === day)
    .reduce((sum, entry) => sum + entrySeconds(entry, now), 0);
  const byProject = new Map<string, number>();
  for (const entry of week)
    byProject.set(
      entry.projectId ?? "none",
      (byProject.get(entry.projectId ?? "none") ?? 0) +
        entrySeconds(entry, now),
    );
  const total = [...byProject.values()].reduce((sum, value) => sum + value, 0);
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex gap-8">
        <Stat
          label="Hoje"
          value={todaySeconds ? formatDuration(todaySeconds) : "—"}
        />
        <Stat label="Semana" value={total ? formatDuration(total) : "—"} />
      </dl>
      {total > 0 && (
        <ul className="flex flex-col gap-1.5">
          {[...byProject.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([id, seconds]) => {
              const project = data.projects.find((item) => item.id === id);
              return (
                <li key={id} className="flex flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate">
                      {project?.name ?? "Sem projeto"}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatDuration(seconds)}
                    </span>
                  </span>
                  <span className="h-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        project
                          ? projectColorClasses[project.color].bg
                          : "bg-muted-foreground/50",
                      )}
                      style={{ width: `${(seconds / total) * 100}%` }}
                    />
                  </span>
                </li>
              );
            })}
        </ul>
      )}
      <More href="/time-tracking">Abrir apontamentos</More>
    </div>
  );
};

const ActivityWidget: WidgetComponent = ({ data, now, expanded }) => {
  const items = [
    ...data.tasks
      .filter((task) => task.status === "done" && task.completedAt)
      .map((task) => ({
        key: `t:${task.id}`,
        at: task.completedAt!,
        kind: "Tarefa concluída",
        title: task.title,
        href: undefined as string | undefined,
      })),
    ...data.timeEntries.map((entry) => ({
      key: `e:${entry.id}`,
      at: entry.startedAt,
      kind: `Apontamento ${formatDuration(entrySeconds(entry, now))}`,
      title: entry.description || "Sem descrição",
      href: undefined,
    })),
    ...data.notes.map((note) => ({
      key: `n:${note.id}`,
      at: note.updatedAt,
      kind: "Nota",
      title: note.title,
      href: noteHref(note.id),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, expanded ? 30 : 7);
  if (items.length === 0) return <Empty>Nada registrado ainda.</Empty>;
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.key} className="flex items-baseline gap-3 py-1 text-sm">
          <span className="w-14 shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {formatShort(item.at.slice(0, 10))}
          </span>
          <span className="min-w-0 truncate">
            <span className="text-muted-foreground">{item.kind} · </span>
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </span>
        </li>
      ))}
    </ol>
  );
};

const ProspectingWidget: WidgetComponent = ({ data }) => {
  const pending = data.sendRequests.filter(
    (request) => request.status === "pending",
  ).length;
  const leads = data.prospectLeads.length;
  const replies = data.prospectMessages.filter(
    (message) => message.direction === "inbound",
  ).length;
  return (
    <div className="flex flex-col gap-3">
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        <Stat
          label="Esperando aprovação"
          value={pending}
          tone={pending ? "text-warning" : undefined}
        />
        <Stat label="Leads" value={leads} />
        <Stat label="Respostas" value={replies} />
      </dl>
      <More href="/prospecting">Abrir prospecção</More>
    </div>
  );
};

const questions = [
  { label: "Resumo do dia", text: "No que devo focar hoje?" },
  { label: "Pendências", text: "O que está atrasado?" },
  { label: "Metas", text: "Como estão minhas metas?" },
  { label: "Dinheiro", text: "Como está meu dinheiro neste mês?" },
];

const AssistantWidget: WidgetComponent = ({ data }) => {
  const [asked, setAsked] = useState<string>();
  const [reply, setReply] = useState<Answer>();
  const [thinking, setThinking] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {questions.map((question) => (
          <button
            key={question.label}
            type="button"
            disabled={thinking}
            aria-pressed={asked === question.text}
            onClick={() => {
              setAsked(question.text);
              setThinking(true);
              askAssistant(question.text, data).then((answer) => {
                setReply(answer);
                setThinking(false);
              });
            }}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-60 pointer-coarse:h-9",
              asked === question.text
                ? "border-primary/50 bg-primary/10"
                : "text-muted-foreground",
            )}
          >
            <Sparkles className="size-3" aria-hidden />
            {question.label}
          </button>
        ))}
      </div>
      {thinking ? (
        <p className="animate-pulse text-sm text-muted-foreground">Pensando…</p>
      ) : reply ? (
        <div className="max-h-72 overflow-y-auto text-sm">
          <Markdown>{reply.text}</Markdown>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          As respostas saem dos seus dados: tarefas, projetos, metas e finanças.
        </p>
      )}
      <More href="/assistant">Abrir o assistente</More>
    </div>
  );
};

const RhythmWidget: WidgetComponent = ({ data, today }) => (
  <RhythmSection data={data} today={today} />
);

const ConnectionsWidget: WidgetComponent = ({ data }) => {
  const tree = buildContextTree(data);
  if (!tree)
    return (
      <Empty>
        Ligue um projeto a uma meta para ver como seu trabalho se conecta.
      </Empty>
    );
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-md bg-dot-grid px-4 py-6">
        <RelationTree root={tree} />
      </div>
      <More href="/knowledge/graph">Abrir grafo</More>
    </div>
  );
};

export const widgetComponents: Record<WidgetType, WidgetComponent> = {
  day: DayWidget,
  attention: AttentionWidget,
  indicators: IndicatorsWidget,
  priorityTasks: PriorityTasksWidget,
  overdueTasks: OverdueWidget,
  blockedTasks: BlockedWidget,
  activeProjects: ActiveProjectsWidget,
  deliveries: DeliveriesWidget,
  agenda: AgendaWidget,
  routines: RoutinesWidget,
  consistency: ConsistencyWidget,
  goals: GoalsWidget,
  learning: LearningWidget,
  recentNotes: RecentNotesWidget,
  recentSnippets: RecentSnippetsWidget,
  finance: FinanceWidget,
  time: TimeWidget,
  activity: ActivityWidget,
  prospecting: ProspectingWidget,
  assistant: AssistantWidget,
  rhythm: RhythmWidget,
  connections: ConnectionsWidget,
};
