"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Repeat } from "lucide-react";

import {
  useDragToSelectRange,
  type TimeRange,
} from "@/features/calendar/hooks/use-drag-to-select-range";
import {
  layoutLanes,
  type Lane,
  type RoutineSlot,
} from "@/features/calendar/lib/calendar-routines";
import {
  appointmentMinutes,
  formatHours,
  minutesToLabel,
  rangeLabel,
  timeToMinutes,
} from "@/features/calendar/lib/time";
import type { Appointment } from "@/features/calendar/types/appointment";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const HOUR_HEIGHT = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const FIRST_VISIBLE_HOUR = 7;

const weekdayFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  timeZone: "UTC",
});

type TimeGridProps = {
  days: string[];
  today: string;
  appointments: Appointment[];
  /** Routines of the visible days; only the ones with a start time go in the grid. */
  routines?: RoutineSlot[];
  taskTitles: Map<string, string>;
  heldSelection: TimeRange | null;
  allDay?: (day: string) => React.ReactNode;
  onSelectRange: (range: TimeRange) => void;
  onOpenAppointment: (appointment: Appointment) => void;
  onToggleRoutine?: (slot: RoutineSlot) => void;
};

type Block =
  | {
      kind: "appointment";
      start: number;
      end: number;
      appointment: Appointment;
    }
  | { kind: "routine"; start: number; end: number; slot: RoutineSlot };

export function TimeGrid({
  days,
  today,
  appointments,
  routines = [],
  taskTitles,
  heldSelection,
  allDay,
  onSelectRange,
  onOpenAppointment,
  onToggleRoutine,
}: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { selection, dragging, columnHandlers, clearSelection } =
    useDragToSelectRange({
      scrollRef,
      hourHeight: HOUR_HEIGHT,
      onSelect: onSelectRange,
    });
  const [now, setNow] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = FIRST_VISIBLE_HOUR * HOUR_HEIGHT;
  }, []);

  useEffect(() => {
    const update = () => {
      const date = new Date();
      setNow(date.getHours() * 60 + date.getMinutes());
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!heldSelection && !dragging) clearSelection();
  }, [heldSelection, dragging, clearSelection]);

  const visibleSelection = dragging ? selection : (heldSelection ?? null);
  const byDay = new Map<string, Block[]>();
  const addBlock = (day: string, block: Block) =>
    byDay.set(day, [...(byDay.get(day) ?? []), block]);
  for (const appointment of appointments) {
    const start = timeToMinutes(appointment.startTime);
    addBlock(appointment.date, {
      kind: "appointment",
      start,
      end: start + appointmentMinutes(appointment),
      appointment,
    });
  }
  for (const slot of routines) {
    if (slot.startMinutes === null || slot.endMinutes === null) continue;
    addBlock(slot.day, {
      kind: "routine",
      start: slot.startMinutes,
      end: slot.endMinutes,
      slot,
    });
  }
  const columns = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className="overflow-x-auto">
      <div className={cn("flex flex-col", days.length > 1 && "min-w-[640px]")}>
        <div
          className="grid border-b pb-2"
          style={{ gridTemplateColumns: columns }}
        >
          <span />
          {days.map((day) => {
            const date = parseDay(day);
            const minutes = (byDay.get(day) ?? []).reduce(
              (total, block) => total + block.end - block.start,
              0,
            );
            const isToday = day === today;
            return (
              <div
                key={day}
                className="flex min-w-0 flex-col items-center gap-1 px-1 text-xs"
              >
                <span
                  className={cn(
                    "flex items-baseline gap-1 text-muted-foreground",
                    isToday && "text-primary",
                  )}
                >
                  <span className="capitalize">
                    {weekdayFormat.format(date).replace(".", "")}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold text-foreground tabular-nums",
                      isToday && "text-primary",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                  <span className="tabular-nums">
                    {minutes ? formatHours(minutes) : "—"}
                  </span>
                </span>
                {allDay && (
                  <div className="flex w-full min-w-0 flex-col gap-0.5">
                    {allDay(day)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          ref={scrollRef}
          className="relative h-[min(65vh,640px)] overflow-y-auto overscroll-contain"
        >
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: columns,
              height: 24 * HOUR_HEIGHT,
            }}
          >
            <div className="relative">
              {HOURS.map((hour) =>
                hour === 0 ? null : (
                  <span
                    key={hour}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular-nums"
                    style={{ top: hour * HOUR_HEIGHT }}
                  >
                    {minutesToLabel(hour * 60)}
                  </span>
                ),
              )}
            </div>

            {days.map((day) => {
              const range =
                visibleSelection?.day === day ? visibleSelection : null;
              const blocks = byDay.get(day) ?? [];
              const lanes = layoutLanes(blocks);
              return (
                <div
                  key={day}
                  role="presentation"
                  {...columnHandlers(day)}
                  className={cn(
                    "relative cursor-cell [touch-action:pan-y] border-l select-none",
                    day === today && "bg-primary/[0.03]",
                  )}
                >
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 border-t border-border/70"
                      style={{ top: hour * HOUR_HEIGHT }}
                    />
                  ))}

                  {blocks.map((block) =>
                    block.kind === "appointment" ? (
                      <AppointmentBlock
                        key={block.appointment.id}
                        appointment={block.appointment}
                        lane={lanes.get(block)!}
                        taskTitle={
                          block.appointment.taskId
                            ? taskTitles.get(block.appointment.taskId)
                            : undefined
                        }
                        onOpen={() => onOpenAppointment(block.appointment)}
                      />
                    ) : (
                      <RoutineBlock
                        key={block.slot.key}
                        slot={block.slot}
                        lane={lanes.get(block)!}
                        future={day > today}
                        onToggle={() => onToggleRoutine?.(block.slot)}
                      />
                    ),
                  )}

                  {day === today && now !== null && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-20 h-px bg-primary"
                      style={{ top: (now / 60) * HOUR_HEIGHT }}
                    >
                      <span className="absolute -top-1 -left-1 size-2 rounded-full bg-primary" />
                    </div>
                  )}

                  {range && (
                    <div
                      aria-live="polite"
                      data-selection
                      className="pointer-events-none absolute inset-x-0.5 z-30 rounded-md border-2 border-dashed border-primary bg-primary/20"
                      style={{
                        top: (range.startMinutes / 60) * HOUR_HEIGHT,
                        height: Math.max(
                          ((range.endMinutes - range.startMinutes) / 60) *
                            HOUR_HEIGHT,
                          8,
                        ),
                      }}
                    >
                      <span className="absolute top-0.5 left-1 rounded bg-primary px-1 text-[11px] font-medium text-primary-foreground tabular-nums">
                        {rangeLabel(range.startMinutes, range.endMinutes)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Position of a block in its column: top/height by time, left/width by lane. */
function blockStyle(start: number, minutes: number, { lane, lanes }: Lane) {
  const height = (minutes / 60) * HOUR_HEIGHT;
  return {
    height,
    style: {
      top: (start / 60) * HOUR_HEIGHT + 1,
      height: Math.max(height - 2, 14),
      left: `calc(${(lane / lanes) * 100}% + 4px)`,
      width: `calc(${100 / lanes}% - 8px)`,
    },
  };
}

function AppointmentBlock({
  appointment,
  lane,
  taskTitle,
  onOpen,
}: {
  appointment: Appointment;
  lane: Lane;
  taskTitle?: string;
  onOpen: () => void;
}) {
  const start = timeToMinutes(appointment.startTime);
  const minutes = appointmentMinutes(appointment);
  const { height, style } = blockStyle(start, minutes, lane);
  const compact = height < 40;
  return (
    <button
      type="button"
      data-appointment
      onClick={onOpen}
      className={cn(
        "absolute z-10 flex flex-col overflow-hidden rounded-md border-l-[3px] border-primary bg-card px-1.5 py-1 text-left shadow-sm ring-1 ring-border transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact && "justify-center py-0",
      )}
      style={style}
    >
      <span className="truncate text-xs leading-tight font-medium">
        {appointment.title}
      </span>
      {!compact && (
        <span className="truncate text-[11px] text-muted-foreground tabular-nums">
          {appointment.startTime.slice(0, 5)}–{appointment.endTime.slice(0, 5)}
          {taskTitle && taskTitle !== appointment.title && ` · ${taskTitle}`}
        </span>
      )}
    </button>
  );
}

function RoutineBlock({
  slot,
  lane,
  future,
  onToggle,
}: {
  slot: RoutineSlot;
  lane: Lane;
  future: boolean;
  onToggle: () => void;
}) {
  const start = slot.startMinutes ?? 0;
  const end = slot.endMinutes ?? start;
  const { height, style } = blockStyle(start, end - start, lane);
  const compact = height < 40;
  const Icon = slot.done ? Check : Repeat;
  return (
    <button
      type="button"
      data-appointment
      onClick={() => !future && onToggle()}
      aria-disabled={future}
      aria-pressed={slot.done}
      title={
        future
          ? `${slot.routine.title}: só pode ser marcada no dia`
          : slot.done
            ? `${slot.routine.title}: feita (clique para desmarcar)`
            : `${slot.routine.title}: clique para marcar como feita`
      }
      className={cn(
        "absolute z-10 flex flex-col overflow-hidden rounded-md border border-l-[3px] border-dashed border-success/70 bg-success/10 px-1.5 py-1 text-left transition-colors outline-none hover:bg-success/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-disabled:cursor-default aria-disabled:hover:bg-success/10",
        compact && "justify-center py-0",
        slot.done && "border-solid bg-success/20",
      )}
      style={style}
    >
      <span
        className={cn(
          "flex items-center gap-1 truncate text-xs leading-tight font-medium",
          slot.done && "text-muted-foreground line-through",
        )}
      >
        <Icon className="size-3 shrink-0 text-success" aria-hidden />
        <span className="truncate">{slot.routine.title}</span>
      </span>
      {!compact && (
        <span className="truncate text-[11px] text-muted-foreground tabular-nums">
          {rangeLabel(start, end)} · rotina
          {slot.routine.targetMinutes
            ? ` · ${slot.routine.targetMinutes} min`
            : ""}
        </span>
      )}
    </button>
  );
}
