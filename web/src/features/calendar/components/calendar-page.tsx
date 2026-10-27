"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Flag,
  GraduationCap,
  ListChecks,
  MessageCircle,
  ShoppingCart,
  Target,
  type LucideIcon,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  buildCalendarEvents,
  eventKindLabels,
  eventKinds,
  eventsByDay,
  type CalendarEvent,
  type EventKind,
} from "@/features/calendar/lib/calendar-events";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { addDays, daysBetween, parseDay, toDay } from "@/lib/dates";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MAX_CHIPS = 3;

// Icon and tint per kind: the icon carries the meaning, the tint helps scanning.
const kindStyles: Record<
  EventKind,
  { icon: LucideIcon; tint: string; dot: string }
> = {
  task: {
    icon: ListChecks,
    tint: "bg-primary/10 text-foreground",
    dot: "bg-primary",
  },
  project: {
    icon: FolderKanban,
    tint: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  milestone: {
    icon: Flag,
    tint: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  goal: {
    icon: Target,
    tint: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  study: {
    icon: GraduationCap,
    tint: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  "follow-up": {
    icon: MessageCircle,
    tint: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  certification: {
    icon: BadgeCheck,
    tint: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  purchase: {
    icon: ShoppingCart,
    tint: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
};

const longDay = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const monthFormat = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function CalendarPage() {
  const data = useAppData();
  const today = useToday();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>();
  const [hidden, setHidden] = useState<Set<EventKind>>(new Set());
  const [taskId, setTaskId] = useState<string>();

  const allEvents = useMemo(() => buildCalendarEvents(data), [data]);
  const visible = allEvents.filter((event) => !hidden.has(event.kind));
  const byDay = eventsByDay(visible);
  const day = selectedDay ?? today;

  const todayDate = parseDay(today);
  const month = new Date(
    Date.UTC(
      todayDate.getUTCFullYear(),
      todayDate.getUTCMonth() + monthOffset,
      1,
    ),
  );
  // Monday-first grid that always shows 6 weeks.
  const gridStart = addDays(toDay(month), -((month.getUTCDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );

  const upcoming = visible.filter((event) => {
    const diff = daysBetween(today, event.day);
    return !event.done && diff > 0 && diff <= 14;
  });
  const overdue = visible.filter(
    (event) =>
      !event.done && event.day < today && event.kind !== "certification",
  );

  function toggleKind(kind: EventKind) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  function goToToday() {
    setMonthOffset(0);
    setSelectedDay(undefined);
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Calendário"
        description="Todas as datas em um só lugar: tarefas, prazos, marcos, follow-ups e renovações."
        actions={<SampleDataBadge />}
      />

      <div
        role="group"
        aria-label="Mostrar no calendário"
        className="flex flex-wrap gap-2"
      >
        {eventKinds.map((kind) => {
          const Icon = kindStyles[kind].icon;
          const count = allEvents.filter((event) => event.kind === kind).length;
          const active = !hidden.has(kind);
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              onClick={() => toggleKind(kind)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
                active && "border-primary/60 bg-primary/10 text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {eventKindLabels[kind]}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-label="Mês"
          className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {monthFormat.format(month)}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Mês anterior"
                onClick={() => setMonthOffset((value) => value - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Próximo mês"
                onClick={() => setMonthOffset((value) => value + 1)}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-xs">
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                className="px-1 pb-1 text-center text-muted-foreground md:text-left"
              >
                {weekday}
              </span>
            ))}
            {cells.map((cell) => {
              const date = parseDay(cell);
              const inMonth = date.getUTCMonth() === month.getUTCMonth();
              const events = byDay.get(cell) ?? [];
              const isToday = cell === today;
              const isSelected = cell === day;
              return (
                <button
                  key={cell}
                  type="button"
                  onClick={() => setSelectedDay(cell)}
                  aria-pressed={isSelected}
                  aria-label={`${longDay.format(date)}, ${events.length} ${events.length === 1 ? "item" : "itens"}`}
                  className={cn(
                    "flex min-h-14 flex-col items-center gap-1 rounded-lg border border-transparent p-1 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:min-h-28 md:items-stretch md:p-1.5",
                    !inMonth && "text-muted-foreground/50",
                    isSelected && "border-primary/60 bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full tabular-nums",
                      isToday &&
                        "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                  {/* Small screens: one dot per kind present that day. */}
                  <span className="flex flex-wrap justify-center gap-0.5 md:hidden">
                    {[...new Set(events.map((event) => event.kind))].map(
                      (kind) => (
                        <span
                          key={kind}
                          aria-hidden
                          className={cn(
                            "size-1.5 rounded-full",
                            kindStyles[kind].dot,
                          )}
                        />
                      ),
                    )}
                  </span>
                  <span className="hidden flex-col gap-0.5 md:flex">
                    {events.slice(0, MAX_CHIPS).map((event) => (
                      <EventChip key={event.id} event={event} />
                    ))}
                    {events.length > MAX_CHIPS && (
                      <span className="px-1 text-[11px] text-muted-foreground">
                        +{events.length - MAX_CHIPS} mais
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section
            aria-label="Dia selecionado"
            className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
          >
            <h2 className="text-sm font-semibold">
              {day === today ? "Hoje · " : ""}
              {longDay.format(parseDay(day))}
            </h2>
            <EventList
              events={byDay.get(day) ?? []}
              today={today}
              onOpenTask={setTaskId}
              empty="Nada neste dia."
            />
          </section>

          {overdue.length > 0 && (
            <section
              aria-label="Atrasados"
              className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
            >
              <h2 className="text-sm font-semibold">
                Atrasados{" "}
                <span className="font-normal text-muted-foreground">
                  ({overdue.length})
                </span>
              </h2>
              <EventList
                events={overdue}
                today={today}
                onOpenTask={setTaskId}
                showDay
              />
            </section>
          )}

          <section
            aria-label="Próximos 14 dias"
            className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
          >
            <h2 className="text-sm font-semibold">
              Próximos 14 dias{" "}
              <span className="font-normal text-muted-foreground">
                ({upcoming.length})
              </span>
            </h2>
            <EventList
              events={upcoming}
              today={today}
              onOpenTask={setTaskId}
              showDay
              empty="Nada agendado."
            />
          </section>
        </aside>
      </div>

      <TaskDetailSheet
        taskId={taskId}
        onOpenChange={(open) => !open && setTaskId(undefined)}
      />
    </PageContainer>
  );
}

function EventChip({ event }: { event: CalendarEvent }) {
  const { icon: Icon, tint } = kindStyles[event.kind];
  return (
    <span
      className={cn(
        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight",
        tint,
        event.done && "line-through opacity-60",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{event.title}</span>
    </span>
  );
}

function EventList({
  events,
  today,
  onOpenTask,
  showDay = false,
  empty,
}: {
  events: CalendarEvent[];
  today: string;
  onOpenTask: (taskId: string) => void;
  showDay?: boolean;
  empty?: string;
}) {
  if (!events.length) {
    return (
      <p className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <CalendarDays className="size-4" aria-hidden /> {empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {events.map((event) => {
        const { icon: Icon, tint } = kindStyles[event.kind];
        const diff = daysBetween(today, event.day);
        const content = (
          <>
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-md",
                tint,
              )}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "truncate text-sm leading-snug",
                  event.done && "text-muted-foreground line-through",
                )}
              >
                {event.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {eventKindLabels[event.kind]}
                {showDay &&
                  ` · ${diff === 0 ? "hoje" : diff === 1 ? "amanhã" : diff < 0 ? `há ${-diff}d` : `em ${diff}d`}`}
              </span>
            </span>
          </>
        );
        const className =
          "flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50";
        return (
          <li key={event.id}>
            {event.taskId ? (
              <button
                type="button"
                className={className}
                onClick={() => onOpenTask(event.taskId!)}
              >
                {content}
              </button>
            ) : (
              <Link href={event.href ?? "/"} className={className}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
