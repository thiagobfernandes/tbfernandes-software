"use client";

import {
  type CheckIndex,
  dayTally,
  monthWeeks,
} from "@/features/routines/lib/routine-stats";
import { weekdayLabels } from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { cn } from "@/lib/utils";

/**
 * Month plan: each day shows planned vs done. Picking a day opens its
 * execution list. Days without anything planned stay blank, not red.
 */
export function RoutineMonthView({
  routines,
  month,
  today,
  index,
  onOpenDay,
}: {
  routines: Routine[];
  /** Any day of the month to show. */
  month: string;
  today: string;
  index: CheckIndex;
  onOpenDay: (day: string) => void;
}) {
  const weeks = monthWeeks(month);
  const monthKey = month.slice(0, 7);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-4">
      <div
        role="row"
        className="grid grid-cols-7 border-b text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
      >
        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
          <span key={weekday} role="columnheader" className="px-2 py-2">
            {weekdayLabels[weekday]}
          </span>
        ))}
      </div>
      <div
        role="grid"
        aria-label="Rotinas do mês"
        className="grid flex-1 auto-rows-fr grid-cols-7"
      >
        {weeks.flat().map((day) => {
          const inMonth = day.slice(0, 7) === monthKey;
          const { due, done } = dayTally(routines, index, day);
          const future = day > today;
          const ratio = due === 0 ? 0 : done / due;
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              onClick={() => onOpenDay(day)}
              aria-label={`${new Date(`${day}T12:00:00`).toLocaleDateString(
                "pt-BR",
                { weekday: "long", day: "numeric", month: "long" },
              )}: ${
                due === 0
                  ? "nada planejado"
                  : future
                    ? `${due} ${due === 1 ? "planejada" : "planejadas"}`
                    : `${done} de ${due} feitas`
              }`}
              className={cn(
                "flex min-h-16 flex-col gap-1 border-r border-b border-border/60 p-2 text-left transition-colors outline-none hover:bg-accent/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 [&:nth-child(7n)]:border-r-0",
                !inMonth && "text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                  day === today &&
                    "bg-primary font-semibold text-primary-foreground",
                )}
              >
                {Number(day.slice(8))}
              </span>
              {due > 0 && inMonth && (
                <span className="mt-auto flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {future ? (
                      <>
                        {due}
                        <span className="hidden sm:inline">
                          {due === 1 ? " planejada" : " planejadas"}
                        </span>
                      </>
                    ) : (
                      `${done}/${due}`
                    )}
                  </span>
                  {!future && (
                    <span className="h-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          ratio === 1 ? "bg-primary" : "bg-primary/60",
                        )}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
