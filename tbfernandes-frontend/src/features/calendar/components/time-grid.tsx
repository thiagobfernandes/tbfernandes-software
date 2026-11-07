"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  useDragToSelectRange,
  type TimeRange,
} from "@/features/calendar/hooks/use-drag-to-select-range";
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
  taskTitles: Map<string, string>;
  heldSelection: TimeRange | null;
  allDay?: (day: string) => React.ReactNode;
  onSelectRange: (range: TimeRange) => void;
  onOpenAppointment: (appointment: Appointment) => void;
};

export function TimeGrid({
  days,
  today,
  appointments,
  taskTitles,
  heldSelection,
  allDay,
  onSelectRange,
  onOpenAppointment,
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
  const byDay = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    const list = byDay.get(appointment.date) ?? [];
    list.push(appointment);
    byDay.set(appointment.date, list);
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
              (total, appointment) => total + appointmentMinutes(appointment),
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

                  {(byDay.get(day) ?? []).map((appointment) => (
                    <AppointmentBlock
                      key={appointment.id}
                      appointment={appointment}
                      taskTitle={
                        appointment.taskId
                          ? taskTitles.get(appointment.taskId)
                          : undefined
                      }
                      onOpen={() => onOpenAppointment(appointment)}
                    />
                  ))}

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

function AppointmentBlock({
  appointment,
  taskTitle,
  onOpen,
}: {
  appointment: Appointment;
  taskTitle?: string;
  onOpen: () => void;
}) {
  const start = timeToMinutes(appointment.startTime);
  const minutes = appointmentMinutes(appointment);
  const height = (minutes / 60) * HOUR_HEIGHT;
  const compact = height < 40;
  return (
    <button
      type="button"
      data-appointment
      onClick={onOpen}
      className={cn(
        "absolute inset-x-1 z-10 flex flex-col overflow-hidden rounded-md border-l-[3px] border-primary bg-card px-1.5 py-1 text-left shadow-sm ring-1 ring-border transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact && "justify-center py-0",
      )}
      style={{ top: (start / 60) * HOUR_HEIGHT + 1, height: height - 2 }}
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
