"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Flag,
  GraduationCap,
  ListChecks,
  MessageCircle,
  Plus,
  Repeat,
  ShoppingCart,
  Target,
  type LucideIcon,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  buildCalendarEvents,
  eventKindLabels,
  eventKinds,
  eventsByDay,
  type CalendarEvent,
  type EventKind,
} from "@/features/calendar/lib/calendar-events";
import {
  AppointmentSheet,
  type AppointmentDraft,
} from "@/features/calendar/components/appointment-sheet";
import { TimeGrid } from "@/features/calendar/components/time-grid";
import {
  routineSlots,
  type RoutineSlot,
} from "@/features/calendar/lib/calendar-routines";
import { rangeLabel } from "@/features/calendar/lib/time";
import { routineActions } from "@/features/routines/lib/routine-actions";
import type { TimeRange } from "@/features/calendar/hooks/use-drag-to-select-range";
import { minutesToTime } from "@/features/calendar/lib/time";
import type { Appointment } from "@/features/calendar/types/appointment";
import { TaskDetailSheet } from "@/features/tasks/components/task-detail-sheet";
import { addDays, daysBetween, parseDay, toDay } from "@/lib/dates";
import { useAppData } from "@/lib/sample-data/store";
import { useToday } from "@/lib/today";
import { cn } from "@/lib/utils";

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const views = [
  ["day", "Dia"],
  ["week", "Semana"],
  ["month", "Mês"],
] as const;
type CalendarView = (typeof views)[number][0];
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

const rangeDayFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function startOfWeek(day: string) {
  return addDays(day, -((parseDay(day).getUTCDay() + 6) % 7));
}

function shiftMonth(day: string, amount: number) {
  const date = parseDay(day);
  return toDay(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)),
  );
}

type SheetState =
  | { open: false }
  | { open: true; draft?: AppointmentDraft; appointment?: Appointment };

export function CalendarPage() {
  const data = useAppData();
  const today = useToday();
  const [view, setView] = useState<CalendarView>("week");
  const [cursor, setCursor] = useState<string>();
  const [selectedDay, setSelectedDay] = useState<string>();
  const [hidden, setHidden] = useState<Set<EventKind>>(new Set());
  const [showRoutines, setShowRoutines] = useState(true);
  const [taskId, setTaskId] = useState<string>();
  const [sheet, setSheet] = useState<SheetState>({ open: false });
  const [heldRange, setHeldRange] = useState<TimeRange | null>(null);

  const allEvents = useMemo(() => buildCalendarEvents(data), [data]);
  const visible = allEvents.filter((event) => !hidden.has(event.kind));
  const byDay = eventsByDay(visible);
  const day = selectedDay ?? today;
  const focus = cursor ?? today;

  const month = parseDay(shiftMonth(focus, 0));
  const gridStart = startOfWeek(toDay(month));
  const cells = Array.from({ length: 42 }, (_, index) =>
    addDays(gridStart, index),
  );
  const weekStart = startOfWeek(focus);
  const gridDays =
    view === "day"
      ? [focus]
      : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const routineDays = view === "month" ? cells : gridDays;
  const routinesByDay = new Map<string, RoutineSlot[]>();
  if (showRoutines) {
    for (const slot of routineSlots(
      data.routines,
      data.routineChecks,
      routineDays,
    )) {
      routinesByDay.set(slot.day, [
        ...(routinesByDay.get(slot.day) ?? []),
        slot,
      ]);
    }
  }
  const visibleRoutines = [...routinesByDay.values()].flat();
  const activeRoutines = data.routines.filter((routine) => routine.active);

  function toggleRoutine(slot: RoutineSlot) {
    if (slot.day > today) return;
    const nowDone = routineActions.toggle(slot.routine, slot.day);
    toast.success(nowDone ? "Rotina feita" : "Marcação desfeita", {
      description: slot.routine.title,
    });
  }

  const taskTitles = useMemo(
    () => new Map(data.tasks.map((task) => [task.id, task.title])),
    [data.tasks],
  );

  const periodLabels: Record<CalendarView, () => string> = {
    month: () => monthFormat.format(month),
    day: () => longDay.format(parseDay(focus)),
    week: () =>
      `${rangeDayFormat.format(parseDay(gridDays[0]))} a ${rangeDayFormat.format(parseDay(gridDays[6]))}`,
  };

  function move(direction: -1 | 1) {
    if (view === "month") setCursor(shiftMonth(focus, direction));
    else setCursor(addDays(focus, direction * (view === "week" ? 7 : 1)));
  }

  const openForRange = useCallback((range: TimeRange) => {
    setHeldRange(range);
    setSheet({
      open: true,
      draft: {
        date: range.day,
        startTime: minutesToTime(range.startMinutes),
        endTime: minutesToTime(range.endMinutes),
      },
    });
  }, []);

  function closeSheet(open: boolean) {
    if (open) return;
    setSheet({ open: false });
    setHeldRange(null);
  }

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
    setCursor(undefined);
    setSelectedDay(undefined);
  }

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Calendário"
        description="Todas as datas em um só lugar: tarefas, prazos, marcos, follow-ups e renovações."
        actions={
          <>
            <SampleDataBadge />
            <Button
              size="sm"
              onClick={() =>
                setSheet({
                  open: true,
                  draft: {
                    date: view === "month" ? day : focus,
                    startTime: "09:00:00",
                    endTime: "10:00:00",
                  },
                })
              }
            >
              <Plus /> Novo agendamento
            </Button>
          </>
        }
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
        <button
          type="button"
          aria-pressed={showRoutines}
          onClick={() => setShowRoutines((current) => !current)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
            showRoutines && "border-primary/60 bg-primary/10 text-foreground",
          )}
        >
          <Repeat className="size-3.5" aria-hidden />
          Rotinas
          <span className="tabular-nums opacity-70">
            {activeRoutines.length}
          </span>
        </button>
      </div>

      <div
        className={cn(
          "grid gap-6",
          view === "month" && "xl:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <section
          aria-label="Agenda"
          className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 md:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Período anterior"
                  onClick={() => move(-1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Próximo período"
                  onClick={() => move(1)}
                >
                  <ChevronRight />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <h2 className="text-base font-semibold first-letter:uppercase md:text-lg">
                {periodLabels[view]()}
              </h2>
            </div>
            <div
              role="radiogroup"
              aria-label="Visão"
              className="inline-flex h-8 rounded-md border p-0.5"
            >
              {views.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={view === value}
                  onClick={() => setView(value)}
                  className={cn(
                    "rounded px-3 text-xs font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    view === value && "bg-primary text-primary-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {view !== "month" ? (
            <>
              <TimeGrid
                days={gridDays}
                today={today}
                appointments={data.appointments}
                routines={visibleRoutines}
                onToggleRoutine={toggleRoutine}
                taskTitles={taskTitles}
                heldSelection={sheet.open ? heldRange : null}
                onSelectRange={openForRange}
                onOpenAppointment={(appointment) =>
                  setSheet({ open: true, appointment })
                }
                allDay={(gridDay) => (
                  <>
                    {(byDay.get(gridDay) ?? []).slice(0, 2).map((event) => (
                      <EventChip key={event.id} event={event} />
                    ))}
                    {(routinesByDay.get(gridDay) ?? [])
                      .filter((slot) => slot.startMinutes === null)
                      .map((slot) => (
                        <RoutineChip
                          key={slot.key}
                          slot={slot}
                          future={gridDay > today}
                          onToggle={() => toggleRoutine(slot)}
                        />
                      ))}
                  </>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Clique e arraste numa área vazia para agendar. No celular,
                segure um instante antes de arrastar. Esc cancela. Rotinas
                (tracejadas) vão do horário até a meta de minutos (30 min sem
                meta); clique para marcar como feita.
              </p>
            </>
          ) : (
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
                const cellRoutines = routinesByDay.get(cell) ?? [];
                const routinesDone = cellRoutines.filter(
                  (slot) => slot.done,
                ).length;
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
                      {cellRoutines.length > 0 && (
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-success"
                        />
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
                      {cellRoutines.length > 0 && (
                        <span className="flex items-center gap-1 truncate rounded bg-success/10 px-1 py-0.5 text-[11px] leading-tight">
                          <Repeat
                            className="size-3 shrink-0 text-success"
                            aria-hidden
                          />
                          <span className="truncate tabular-nums">
                            {cell > today
                              ? `${cellRoutines.length} ${cellRoutines.length === 1 ? "rotina" : "rotinas"}`
                              : `${routinesDone}/${cellRoutines.length} rotinas`}
                          </span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {view === "month" && (
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
                empty={
                  routinesByDay.get(day)?.length ? undefined : "Nada neste dia."
                }
              />
              {(routinesByDay.get(day) ?? []).length > 0 && (
                <ul aria-label="Rotinas do dia" className="flex flex-col gap-1">
                  {(routinesByDay.get(day) ?? []).map((slot) => (
                    <li key={slot.key}>
                      <RoutineRow
                        slot={slot}
                        future={day > today}
                        onToggle={() => toggleRoutine(slot)}
                      />
                    </li>
                  ))}
                </ul>
              )}
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
        )}
      </div>

      <AppointmentSheet
        open={sheet.open}
        onOpenChange={closeSheet}
        draft={sheet.open ? sheet.draft : undefined}
        appointment={sheet.open ? sheet.appointment : undefined}
      />

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
    if (!empty) return null;
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

function RoutineChip({
  slot,
  future,
  onToggle,
}: {
  slot: RoutineSlot;
  future: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => !future && onToggle()}
      aria-disabled={future}
      aria-pressed={slot.done}
      title={
        future
          ? "Só pode ser marcada no dia"
          : slot.done
            ? "Feita: clique para desmarcar"
            : "Clique para marcar como feita"
      }
      className={cn(
        "flex w-full items-center gap-1 truncate rounded border border-dashed border-success/60 bg-success/10 px-1 py-0.5 text-left text-[11px] leading-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:cursor-default",
        slot.done && "border-solid text-muted-foreground line-through",
      )}
    >
      <Repeat className="size-3 shrink-0 text-success" aria-hidden />
      <span className="truncate">{slot.routine.title}</span>
    </button>
  );
}

function RoutineRow({
  slot,
  future,
  onToggle,
}: {
  slot: RoutineSlot;
  future: boolean;
  onToggle: () => void;
}) {
  const { routine } = slot;
  const when =
    slot.startMinutes !== null && slot.endMinutes !== null
      ? rangeLabel(slot.startMinutes, slot.endMinutes)
      : "Sem horário";
  return (
    <button
      type="button"
      onClick={() => !future && onToggle()}
      aria-disabled={future}
      aria-pressed={slot.done}
      className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:cursor-default aria-disabled:hover:bg-transparent"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-success/10 text-success">
        {slot.done ? (
          <Check className="size-3.5" aria-hidden />
        ) : (
          <Repeat className="size-3.5" aria-hidden />
        )}
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-sm leading-snug",
            slot.done && "text-muted-foreground line-through",
          )}
        >
          {routine.title}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          Rotina · {when}
          {routine.targetMinutes ? ` · ${routine.targetMinutes} min` : ""}
          {slot.done ? " · feita" : future ? "" : " · clique para marcar"}
        </span>
      </span>
    </button>
  );
}
