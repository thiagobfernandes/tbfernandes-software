"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { routineActions } from "@/features/routines/lib/routine-actions";
import {
  type CheckIndex,
  checkedOn,
  dayTally,
  scheduledOn,
} from "@/features/routines/lib/routine-stats";
import { shortTime, weekdayLabels } from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/**
 * Week plan: routines on rows, days on columns. Planned cells toggle the
 * check (up to today); unplanned cells stay neutral, since rest is not a miss.
 */
export function RoutineWeekMatrix({
  routines,
  days,
  today,
  index,
  activeId,
  onSelect,
}: {
  routines: Routine[];
  days: string[];
  today: string;
  index: CheckIndex;
  activeId?: string;
  onSelect: (routine: Routine) => void;
}) {
  const data = useAppData();
  const { findProject } = selectors(data);

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th
              scope="col"
              className="sticky left-0 z-10 h-10 w-44 border-b bg-background px-4 text-left font-medium sm:w-80"
            >
              Rotina
            </th>
            {days.map((day, column) => (
              <th
                key={day}
                scope="col"
                className={cn(
                  "h-10 w-14 border-b text-center font-medium",
                  day === today && "text-primary",
                )}
              >
                <span className="flex flex-col leading-tight">
                  <span>{weekdayLabels[column + 1]}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      day === today
                        ? "font-semibold"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                </span>
              </th>
            ))}
            <th
              scope="col"
              className="h-10 w-16 border-b pr-4 text-right font-medium"
            >
              Feitas
            </th>
            <th aria-hidden className="border-b" />
          </tr>
        </thead>
        <tbody>
          {routines.map((routine) => {
            const project = findProject(routine.projectId);
            let due = 0;
            let done = 0;
            return (
              <tr
                key={routine.id}
                className={cn(
                  "group",
                  routine.id === activeId && "[&>*]:bg-accent/60",
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 h-11 max-w-44 border-b border-border/60 bg-background px-4 text-left font-normal group-hover:bg-accent/40 sm:max-w-80"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(routine)}
                    className="flex w-full min-w-0 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        project
                          ? projectColorClasses[project.color].bg
                          : "bg-transparent",
                      )}
                    />
                    <span className="truncate font-medium">
                      {routine.title}
                    </span>
                    {shortTime(routine.startTime) && (
                      <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
                        {shortTime(routine.startTime)}
                      </span>
                    )}
                  </button>
                </th>
                {days.map((day) => {
                  const planned = scheduledOn(routine, day, index);
                  const checked = checkedOn(routine.id, day, index);
                  if (planned && day <= today) {
                    if (day < today || checked) due++;
                    if (checked) done++;
                  }
                  return (
                    <td
                      key={day}
                      className={cn(
                        "h-11 border-b border-border/60 text-center group-hover:bg-accent/40",
                        day === today && "bg-primary/[0.04]",
                      )}
                    >
                      <WeekCell
                        routine={routine}
                        day={day}
                        today={today}
                        planned={planned}
                        checked={checked}
                      />
                    </td>
                  );
                })}
                <td className="h-11 border-b border-border/60 pr-4 text-right text-xs text-muted-foreground tabular-nums group-hover:bg-accent/40">
                  {due > 0 ? `${done}/${due}` : "—"}
                </td>
                <td
                  aria-hidden
                  className="border-b border-border/60 group-hover:bg-accent/40"
                />
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="text-xs text-muted-foreground">
            <th
              scope="row"
              className="sticky left-0 h-10 bg-background px-4 text-left font-medium"
            >
              Dia
            </th>
            {days.map((day) => {
              const { due, done } = dayTally(routines, index, day);
              return (
                <td key={day} className="h-10 text-center tabular-nums">
                  {due === 0 ? (
                    <span className="text-muted-foreground/50">—</span>
                  ) : day > today ? (
                    <span title="Planejadas">{due}</span>
                  ) : (
                    <span
                      className={cn(done === due && "text-primary")}
                      title="Feitas / planejadas"
                    >
                      {done}/{due}
                    </span>
                  )}
                </td>
              );
            })}
            <td />
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function WeekCell({
  routine,
  day,
  today,
  planned,
  checked,
}: {
  routine: Routine;
  day: string;
  today: string;
  planned: boolean;
  checked: boolean;
}) {
  const future = day > today;
  const label = new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
  });

  if (!planned && !checked) {
    return (
      <span
        aria-label={`${routine.title}, ${label}: não planejada`}
        className="text-muted-foreground/30"
      >
        ·
      </span>
    );
  }
  return (
    <button
      type="button"
      disabled={future}
      aria-pressed={checked}
      aria-label={`${routine.title}, ${label}: ${
        future ? "planejada" : checked ? "feita" : "não feita"
      }${planned ? "" : " (fora da agenda)"}`}
      title={
        future
          ? "Planejada"
          : planned
            ? checked
              ? "Feita (clique para desfazer)"
              : "Marcar como feita"
            : "Feita fora da agenda"
      }
      onClick={() => {
        const nowDone = routineActions.toggle(routine, day);
        toast.success(nowDone ? "Rotina feita" : "Marcação desfeita", {
          description: routine.title,
        });
      }}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 pointer-coarse:size-9",
        checked
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : future
            ? "border border-dashed border-border"
            : "border border-border hover:border-primary/60 hover:bg-primary/10",
        checked && !planned && "bg-primary/40",
      )}
    >
      {checked && <Check className="size-3.5" strokeWidth={3} />}
    </button>
  );
}
