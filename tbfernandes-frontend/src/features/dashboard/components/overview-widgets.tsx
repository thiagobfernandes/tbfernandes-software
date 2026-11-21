"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Flame,
  FolderKanban,
  ListChecks,
  Play,
  Plus,
  Repeat,
  Send,
  Square,
  Timer,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { PriorityIcon, priorityText } from "@/components/shared/priority-badge";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  type AttentionKind,
  attentionItems,
} from "@/features/dashboard/lib/attention";
import {
  type ProgressPeriod,
  greetingFor,
  nextStep,
  periodProgress,
  todayTasks,
} from "@/features/dashboard/lib/day-plan";
import { HealthBadge } from "@/features/projects/components/project-bits";
import { projectInsights } from "@/features/projects/lib/project-insights";
import { projectStatusLabels } from "@/features/projects/types/project";
import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  checkOn,
  isDueOn,
  routinesDueOn,
  shortTime,
  streak,
} from "@/features/routines/lib/routines";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { taskStatusLabels } from "@/features/tasks/types/task";
import {
  entrySeconds,
  formatDuration,
  localDay,
  runningEntry,
  startOfWeek,
} from "@/features/time-tracking/lib/time";
import { timeActions } from "@/features/time-tracking/lib/time-actions";
import { firstName, useMe } from "@/lib/api/me";
import { addDays, daysBetween, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

import { Empty, More, type WidgetComponent, isOpen } from "./widget-parts";

const longDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

/* ── A · Cabeçalho ─────────────────────────────────────────────────────── */

export const GreetingWidget: WidgetComponent = ({ data, today, now }) => {
  const name = firstName(useMe());
  const appointments = data.appointments.filter((item) => item.date === today);
  const due = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate === today,
  );
  const overdue = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate && task.dueDate < today,
  );
  const routines = routinesDueOn(data.routines, localDay(now));

  // One short sentence from the day's real numbers.
  const parts = [
    appointments.length &&
      plural(appointments.length, "compromisso", "compromissos"),
    due.length && plural(due.length, "tarefa vencendo", "tarefas vencendo"),
    routines.length && plural(routines.length, "rotina", "rotinas"),
  ].filter(Boolean) as string[];
  const summary = parts.length
    ? `Hoje você tem ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} e ${parts.at(-1)}` : parts[0]}.`
    : "Nada marcado para hoje: espaço livre para avançar no que importa.";
  // The real clock is unknown until the page is in the browser.
  const ready = now.getTime() > 0;

  return (
    <header className="flex flex-col gap-2 px-1 pt-2 pb-1">
      <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
        <span aria-hidden className="h-px w-6 bg-primary/60" />
        {ready ? greetingFor(now) : " "}
        {ready && name ? `, ${name}` : ""}
      </p>
      <h2 className="text-2xl font-semibold tracking-tight first-letter:uppercase sm:text-3xl">
        {longDay.format(new Date(`${today}T00:00:00Z`))}
      </h2>
      <p className="max-w-2xl text-sm text-muted-foreground">
        {summary}
        {overdue.length > 0 && (
          <span className="text-destructive">
            {" "}
            {plural(
              overdue.length,
              "tarefa está atrasada",
              "tarefas estão atrasadas",
            )}
            .
          </span>
        )}
      </p>
    </header>
  );
};

/* ── B · Indicadores ───────────────────────────────────────────────────── */

function QuickStat({
  icon: Icon,
  label,
  value,
  context,
  tone,
  href,
}: {
  icon: typeof Clock;
  label: string;
  value: React.ReactNode;
  context?: React.ReactNode;
  tone: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors outline-none hover:border-foreground/15 hover:bg-accent/30 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone,
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs leading-snug text-muted-foreground">
          {label}
        </span>
        <span className="text-xl leading-tight font-semibold tabular-nums">
          {value}
        </span>
        {context && (
          <span className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {context}
          </span>
        )}
      </span>
    </Link>
  );
}

export const QuickStatsWidget: WidgetComponent = ({ data, today, now }) => {
  const routineDay = localDay(now);
  const appointments = data.appointments
    .filter((item) => item.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const due = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate === today,
  );
  const overdue = data.tasks.filter(
    (task) => isOpen(task) && task.dueDate && task.dueDate < today,
  );
  const routines = routinesDueOn(data.routines, routineDay);
  const routinesDone = routines.filter((routine) =>
    checkOn(data.routineChecks, routine.id, routineDay),
  ).length;
  const dayEntries = data.timeEntries.filter(
    (entry) => localDay(new Date(entry.startedAt)) === routineDay,
  );
  const daySeconds = dayEntries.reduce(
    (sum, entry) => sum + entrySeconds(entry, now),
    0,
  );
  const weekStart = startOfWeek(routineDay);
  const weekSeconds = data.timeEntries
    .filter((entry) => localDay(new Date(entry.startedAt)) >= weekStart)
    .reduce((sum, entry) => sum + entrySeconds(entry, now), 0);
  const week = periodProgress(data, today, "week");

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
      <QuickStat
        icon={CalendarDays}
        label="Compromissos hoje"
        value={appointments.length}
        context={
          appointments[0]
            ? `Próximo às ${appointments[0].startTime.slice(0, 5)}`
            : "Agenda livre"
        }
        tone="bg-primary/12 text-primary"
        href="/calendar"
      />
      <QuickStat
        icon={CalendarClock}
        label="Vencem hoje"
        value={due.length}
        context={
          overdue.length ? (
            <span className="text-destructive">
              {plural(overdue.length, "atrasada", "atrasadas")}
            </span>
          ) : (
            "Nada atrasado"
          )
        }
        tone={
          overdue.length
            ? "bg-destructive/12 text-destructive"
            : "bg-warning/12 text-warning"
        }
        href="/tasks"
      />
      <QuickStat
        icon={Repeat}
        label="Rotinas de hoje"
        value={routines.length ? `${routinesDone}/${routines.length}` : "—"}
        context={
          routines.length
            ? routinesDone === routines.length
              ? "Todas feitas"
              : plural(routines.length - routinesDone, "falta", "faltam")
            : "Nenhuma planejada"
        }
        tone="bg-success/12 text-success"
        href="/routines"
      />
      <QuickStat
        icon={Timer}
        label="Apontado hoje"
        value={daySeconds ? formatDuration(daySeconds) : "0min"}
        context={
          weekSeconds ? `${formatDuration(weekSeconds)} na semana` : undefined
        }
        tone="bg-sky-500/12 text-sky-400"
        href="/time-tracking"
      />
      <QuickStat
        icon={TrendingUp}
        label="Progresso da semana"
        value={
          week.rate === undefined ? "—" : `${Math.round(week.rate * 100)}%`
        }
        context={
          week.total
            ? `${week.done} de ${week.total} tarefas do prazo`
            : "Sem prazos nesta semana"
        }
        tone="bg-primary/12 text-primary"
        href="/tasks"
      />
    </div>
  );
};

/* ── C1 · Próximo passo ────────────────────────────────────────────────── */

export const NextStepWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
}) => {
  const step = nextStep(data, today);
  if (!step)
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <p className="text-base font-medium">
          Nenhuma tarefa aberta para agora.
        </p>
        <p className="text-sm text-muted-foreground">
          Quando houver tarefas a fazer, a mais indicada aparece aqui com o
          motivo.
        </p>
        <TaskFormDialog
          trigger={
            <Button size="sm">
              <Plus /> Nova tarefa
            </Button>
          }
        />
      </div>
    );

  const { task, reasons, others } = step;
  const project = data.projects.find((item) => item.id === task.projectId);
  const running = runningEntry(data.timeEntries);
  const timing = running?.taskId === task.id;
  const late = task.dueDate && task.dueDate < today;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {reasons.map((reason) => (
          <span
            key={reason}
            className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
          >
            {reason}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onOpenTask(task.id)}
          className="text-left text-xl leading-snug font-semibold tracking-tight outline-none hover:text-primary focus-visible:text-primary sm:text-2xl"
        >
          {task.title}
        </button>
        {project && (
          <Link
            href={projectHref(project.id)}
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                projectColorClasses[project.color].bg,
              )}
            />
            {project.name}
          </Link>
        )}
        {task.description && (
          <p className="line-clamp-2 max-w-prose text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>
      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] text-muted-foreground">Prioridade</dt>
          <dd className="flex items-center gap-1.5">
            <PriorityIcon priority={task.priority} />
            {priorityText[task.priority]}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] text-muted-foreground">Prazo</dt>
          <dd className={cn("tabular-nums", late && "text-destructive")}>
            {task.dueDate ? formatShort(task.dueDate) : "Sem prazo"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-[11px] text-muted-foreground">Situação</dt>
          <dd>{taskStatusLabels[task.status]}</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {task.status === "in_progress" ? (
          <Button
            size="sm"
            onClick={() => {
              workActions.updateTask(task.id, { status: "done" });
              toast.success("Tarefa concluída", {
                description: task.title,
                action: {
                  label: "Desfazer",
                  onClick: () =>
                    workActions.updateTask(task.id, { status: "in_progress" }),
                },
              });
            }}
          >
            <Check /> Concluir
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => {
              workActions.updateTask(task.id, { status: "in_progress" });
              toast.success("Tarefa em andamento", { description: task.title });
            }}
          >
            <Play /> Começar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (timing) {
              timeActions.stop();
              toast.success("Apontamento parado", { description: task.title });
              return;
            }
            timeActions.start({
              description: task.title,
              projectId: task.projectId,
              taskId: task.id,
            });
            toast.success("Cronômetro iniciado", { description: task.title });
          }}
        >
          {timing ? <Square /> : <Timer />}
          {timing ? "Parar cronômetro" : "Cronometrar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onOpenTask(task.id)}>
          Abrir tarefa <ArrowRight />
        </Button>
        {others > 0 && (
          <Link
            href="/tasks"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            +{others} na fila
          </Link>
        )}
      </div>
    </div>
  );
};

/* ── C2 · Precisa de atenção ───────────────────────────────────────────── */

const attentionIcon: Record<AttentionKind, typeof Clock> = {
  overdue: AlertTriangle,
  blocked: CircleDot,
  dueSoon: CalendarClock,
  project: FolderKanban,
  appointment: CalendarDays,
  finance: Wallet,
  approval: Send,
};

export const AttentionWidget: WidgetComponent = ({
  data,
  today,
  now,
  onOpenTask,
  expanded,
  maximize,
}) => {
  const items = attentionItems(data, today, now);
  if (items.length === 0)
    return (
      <div className="flex items-center gap-3 py-3 text-sm text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="size-4" />
        </span>
        Nada pedindo atenção agora.
      </div>
    );
  const limit = expanded ? items.length : 5;
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {items.slice(0, limit).map((item) => {
          const Icon = attentionIcon[item.kind];
          const severe =
            item.kind === "overdue" ||
            (item.kind === "project" && item.rank === 0);
          const warn =
            item.kind === "blocked" ||
            item.kind === "project" ||
            item.kind === "approval";
          const body = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  severe
                    ? "bg-destructive/12 text-destructive"
                    : warn
                      ? "bg-warning/12 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.reason}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </>
          );
          const cls =
            "group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50";
          return (
            <li key={item.key}>
              {item.taskId ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(item.taskId!)}
                  className={cls}
                >
                  {body}
                </button>
              ) : (
                <Link href={item.href ?? "/"} className={cls}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <button
          type="button"
          onClick={maximize}
          className="mt-1 self-start rounded-sm px-2 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Ver todos ({items.length})
        </button>
      )}
    </div>
  );
};

/* ── D1 · Agenda ───────────────────────────────────────────────────────── */

type AgendaItem = {
  key: string;
  start: string;
  end?: string;
  title: string;
  kind: "appointment" | "routine";
};

export const AgendaWidget: WidgetComponent = ({
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
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl<"day" | "week">
        label="Período da agenda"
        size="sm"
        value={range}
        onChange={(value) => setConfig({ range: value })}
        options={[
          { value: "day", label: "Hoje" },
          { value: "week", label: "7 dias" },
        ]}
        className="self-start"
      />
      <ol className="flex flex-col gap-4">
        {days.map((day) => {
          // Routines follow the real calendar day, like the routines page.
          const routineDay = addDays(routineToday, daysBetween(today, day));
          const timed: AgendaItem[] = [
            ...data.appointments
              .filter((item) => item.date === day)
              .map((item) => ({
                key: item.id,
                start: item.startTime.slice(0, 5),
                end: item.endTime.slice(0, 5),
                title: item.title,
                kind: "appointment" as const,
              })),
            ...data.routines
              .filter(
                (routine) => routine.startTime && isDueOn(routine, routineDay),
              )
              .map((routine) => ({
                key: routine.id,
                start: shortTime(routine.startTime)!,
                title: routine.title,
                kind: "routine" as const,
              })),
          ].sort((a, b) => a.start.localeCompare(b.start));
          const due = data.tasks.filter(
            (task) => isOpen(task) && task.dueDate === day,
          );
          return (
            <li key={day} className="flex flex-col gap-2">
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
              {timed.length === 0 && due.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {range === "day" ? "Dia livre: nada marcado." : "—"}
                </p>
              ) : (
                <ol className="relative flex flex-col gap-1.5 border-l border-border/70 pl-4">
                  {timed.map((item) => {
                    const past =
                      day === today &&
                      range === "day" &&
                      (item.end ?? item.start) < clock &&
                      now.getTime() > 0;
                    return (
                      <li
                        key={item.key}
                        className={cn(
                          "relative flex items-baseline gap-3",
                          past && "opacity-55",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-1.5 -left-[21px] size-2 rounded-full ring-4 ring-card",
                            item.kind === "appointment"
                              ? "bg-primary"
                              : "border border-muted-foreground bg-card",
                          )}
                        />
                        <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
                          {item.start}
                          {item.end && `–${item.end}`}
                        </span>
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-sm",
                            item.kind === "routine" && "text-muted-foreground",
                          )}
                        >
                          {item.title}
                        </span>
                      </li>
                    );
                  })}
                  {due.map((task) => (
                    <li
                      key={task.id}
                      className="relative flex items-baseline gap-3"
                    >
                      <span
                        aria-hidden
                        className="absolute top-1.5 -left-[20px] size-1.5 rotate-45 bg-foreground/50"
                      />
                      <span className="w-20 shrink-0 text-xs text-muted-foreground">
                        prazo
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenTask(task.id)}
                        className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
                      >
                        {task.title}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
      <More href="/calendar">Abrir calendário</More>
    </div>
  );
};

/* ── D2 · Tarefas do dia ───────────────────────────────────────────────── */

export const TodayTasksWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
}) => {
  const { due, overdue, done, total } = todayTasks(data, today);
  return (
    <div className="flex flex-col gap-3">
      {total > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">
              {done} de {total} concluídas
            </span>
            <span className="tabular-nums">
              {Math.round((done / total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>
      )}
      {due.length === 0 ? (
        <Empty>Nenhuma tarefa vence hoje.</Empty>
      ) : (
        <ul className="flex flex-col">
          {due.map((task) => {
            const finished = task.status === "done";
            const id = `today-${task.id}`;
            return (
              <li key={task.id} className="flex items-center gap-2.5 py-1.5">
                <Checkbox
                  id={id}
                  checked={finished}
                  aria-label={
                    finished
                      ? `Reabrir "${task.title}"`
                      : `Concluir "${task.title}"`
                  }
                  onCheckedChange={() => {
                    workActions.updateTask(task.id, {
                      status: finished ? "todo" : "done",
                    });
                    toast.success(
                      finished ? "Tarefa reaberta" : "Tarefa concluída",
                      { description: task.title },
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() => onOpenTask(task.id)}
                  className={cn(
                    "min-w-0 flex-1 truncate text-left text-sm outline-none hover:text-primary focus-visible:text-primary",
                    finished && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </button>
                <PriorityIcon priority={task.priority} />
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2">
        <TaskFormDialog
          defaultDueDate={today}
          trigger={
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Plus className="size-3.5" /> Adicionar para hoje
            </button>
          }
        />
        {overdue.length > 0 && (
          <Link
            href="/tasks"
            className="text-xs text-destructive hover:underline"
          >
            +{plural(overdue.length, "atrasada", "atrasadas")}
          </Link>
        )}
      </div>
    </div>
  );
};

/* ── D3 · Próximas entregas ────────────────────────────────────────────── */

export const DeliveriesWidget: WidgetComponent = ({
  data,
  today,
  onOpenTask,
  expanded,
  maximize,
}) => {
  const limit = addDays(today, 14);
  const projectName = (id?: string) =>
    data.projects.find((project) => project.id === id);
  type Delivery = {
    key: string;
    day: string;
    title: string;
    projectId?: string;
    taskId?: string;
    href?: string;
    milestone?: boolean;
  };
  const items: Delivery[] = [
    ...data.projects
      .filter(
        (project) =>
          project.status !== "completed" &&
          project.dueDate &&
          project.dueDate <= limit,
      )
      .map((project) => ({
        key: `p:${project.id}`,
        day: project.dueDate!,
        title: "Prazo do projeto",
        projectId: project.id,
        href: projectHref(project.id),
        milestone: true,
      })),
    ...data.tasks
      .filter((task) => isOpen(task) && task.dueDate && task.dueDate <= limit)
      .map((task) => ({
        key: `t:${task.id}`,
        day: task.dueDate!,
        title: task.title,
        projectId: task.projectId,
        taskId: task.id,
      })),
  ]
    .filter((item) => item.day >= addDays(today, -30))
    .sort((a, b) => a.day.localeCompare(b.day));
  const next = data.projects.filter(
    (project) => project.status === "active" && project.nextDelivery,
  );

  if (items.length === 0 && next.length === 0)
    return <Empty>Nada vence nos próximos 14 dias.</Empty>;
  return (
    <div className="flex flex-col gap-3">
      {next.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg bg-muted/40 p-2.5">
          {next.map((project) => (
            <li key={project.id}>
              <Link
                href={projectHref(project.id)}
                className="flex items-baseline gap-2 text-sm hover:text-primary"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 -translate-y-px rounded-full",
                    projectColorClasses[project.color].bg,
                  )}
                />
                <span className="min-w-0 truncate font-medium">
                  {project.nextDelivery}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ol className="flex flex-col">
        {items.slice(0, expanded ? 50 : 4).map((item) => {
          const project = projectName(item.projectId);
          const late = item.day < today;
          const diff = daysBetween(today, item.day);
          const content = (
            <>
              <span
                className={cn(
                  "flex w-11 shrink-0 flex-col items-center rounded-md py-0.5 text-center leading-tight",
                  late
                    ? "bg-destructive/12 text-destructive"
                    : diff <= 2
                      ? "bg-warning/12 text-warning"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <span className="text-sm font-semibold tabular-nums">
                  {Number(item.day.slice(8))}
                </span>
                <span className="text-[10px] uppercase">
                  {new Intl.DateTimeFormat("pt-BR", {
                    month: "short",
                    timeZone: "UTC",
                  })
                    .format(new Date(`${item.day}T00:00:00Z`))
                    .replace(".", "")}
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm">{item.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {[
                    project?.name,
                    late
                      ? `atrasada há ${-diff} d`
                      : diff === 0
                        ? "hoje"
                        : `em ${diff} d`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </>
          );
          const cls =
            "flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50";
          return (
            <li key={item.key}>
              {item.taskId ? (
                <button
                  type="button"
                  onClick={() => onOpenTask(item.taskId!)}
                  className={cls}
                >
                  {content}
                </button>
              ) : (
                <Link href={item.href!} className={cls}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      {!expanded && items.length > 4 && (
        <button
          type="button"
          onClick={maximize}
          className="self-start rounded-sm text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Ver todas ({items.length})
        </button>
      )}
    </div>
  );
};

/* ── E1 · Projetos ativos ──────────────────────────────────────────────── */

export const ActiveProjectsWidget: WidgetComponent = ({ data, today, now }) => {
  const rows = data.projects
    .filter((project) => project.status === "active")
    .map((project) => ({
      project,
      insights: projectInsights(project, data, today, now),
    }));
  if (rows.length === 0) return <Empty>Nenhum projeto ativo.</Empty>;
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {rows.map(({ project, insights }) => {
          const countable = insights.tasks.filter(
            (task) => task.status !== "canceled",
          ).length;
          const pct = Math.round((insights.taskProgress ?? 0) * 100);
          return (
            <li key={project.id}>
              <Link
                href={projectHref(project.id)}
                className="group flex flex-col gap-1.5 rounded-lg px-2 py-2 outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white/95",
                      projectColorClasses[project.color].bg,
                    )}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-primary">
                    {project.name}
                  </span>
                  <HealthBadge insights={insights} />
                </span>
                {countable > 0 ? (
                  <span className="flex items-center gap-2 pl-8">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          projectColorClasses[project.color].bg,
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-24 text-right text-[11px] text-muted-foreground tabular-nums">
                      {insights.done.length}/{countable} tarefas
                    </span>
                  </span>
                ) : (
                  <span className="pl-8 text-[11px] text-muted-foreground">
                    {projectStatusLabels[project.status]} · sem tarefas ainda
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <More href="/projects">Ver portfólio</More>
    </div>
  );
};

/* ── E2 · Rotinas de hoje ──────────────────────────────────────────────── */

export const RoutinesWidget: WidgetComponent = ({ data, now }) => {
  const day = localDay(now);
  const routines = routinesDueOn(data.routines, day);
  const running = runningEntry(data.timeEntries);
  if (routines.length === 0)
    return (
      <div className="flex flex-col gap-2">
        <Empty>Nada planejado para hoje. Dia livre também conta.</Empty>
        <More href="/routines">Abrir rotinas</More>
      </div>
    );
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col">
        {routines.map((routine) => {
          const done = Boolean(checkOn(data.routineChecks, routine.id, day));
          const days = streak(routine, data.routineChecks, day);
          const timing = running?.routineId === routine.id;
          const id = `w-routine-${routine.id}`;
          return (
            <li
              key={routine.id}
              className="group flex items-center gap-2.5 py-1.5"
            >
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
              {days > 0 && (
                <span
                  className="flex items-center gap-0.5 text-[11px] text-primary tabular-nums"
                  title="Dias seguidos"
                >
                  <Flame className="size-3" aria-hidden />
                  {days}
                </span>
              )}
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {shortTime(routine.startTime) ?? ""}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${timing ? "Parar" : "Iniciar"} cronômetro de ${routine.title}`}
                title={timing ? "Parar cronômetro" : "Iniciar cronômetro"}
                className={cn(
                  "size-7 text-muted-foreground hover:text-foreground",
                  timing
                    ? "text-primary"
                    : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
                )}
                onClick={() => {
                  if (timing) {
                    timeActions.stop();
                    toast.success("Apontamento parado", {
                      description: routine.title,
                    });
                  } else {
                    routineActions.start(routine);
                    toast.success("Cronômetro iniciado", {
                      description: routine.title,
                    });
                  }
                }}
              >
                {timing ? <Square /> : <Play />}
              </Button>
            </li>
          );
        })}
      </ul>
      <More href="/routines">Abrir rotinas</More>
    </div>
  );
};

/* ── E3 · Seu progresso ────────────────────────────────────────────────── */

function Ring({ value }: { value?: number }) {
  const radius = 26;
  const length = 2 * Math.PI * radius;
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-20 shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        strokeWidth="6"
        className="stroke-muted"
      />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        className="stroke-primary transition-[stroke-dashoffset] duration-500"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - (value ?? 0))}
      />
    </svg>
  );
}

export const ProgressWidget: WidgetComponent = ({
  data,
  today,
  config,
  setConfig,
}) => {
  const period = (config.period as ProgressPeriod) ?? "week";
  const result = periodProgress(data, today, period);
  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl<ProgressPeriod>
        label="Período do progresso"
        size="sm"
        value={period}
        onChange={(value) => setConfig({ period: value })}
        options={[
          { value: "week", label: "Semana" },
          { value: "month", label: "Mês" },
        ]}
        className="self-start"
      />
      {result.total === 0 ? (
        <Empty>Nenhuma tarefa com prazo neste período.</Empty>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative">
            <Ring value={result.rate} />
            <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
              {Math.round((result.rate ?? 0) * 100)}%
            </span>
          </div>
          <dl className="grid flex-1 grid-cols-1 gap-1.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" aria-hidden />
                Concluídas
              </dt>
              <dd className="font-medium tabular-nums">{result.done}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-sky-400" aria-hidden />
                Em andamento
              </dt>
              <dd className="font-medium tabular-nums">{result.inProgress}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 rounded-full bg-muted-foreground/50"
                  aria-hidden
                />
                Pendentes
              </dt>
              <dd className="font-medium tabular-nums">
                {result.pending}
                {result.blocked > 0 && (
                  <span className="ml-1 text-[11px] font-normal text-warning">
                    ({result.blocked} bloq.)
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <ListChecks className="mt-px size-3 shrink-0" aria-hidden />
        Tarefas com prazo {period === "week" ? "nesta semana" : "neste mês"} (
        {formatShort(result.from)} – {formatShort(result.to)}).{" "}
        {plural(
          result.finishedInPeriod,
          "tarefa concluída",
          "tarefas concluídas",
        )}{" "}
        no período.
      </p>
    </div>
  );
};
