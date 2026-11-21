"use client";

import { RoutineHeatmap } from "@/features/routines/components/routine-heatmap";
import {
  type CheckIndex,
  checkedOn,
  dayTally,
  percent,
  rate,
  scheduledOn,
  tally,
} from "@/features/routines/lib/routine-stats";
import { frequencyLabel } from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { shiftDay } from "@/features/time-tracking/lib/time";
import { cn } from "@/lib/utils";

const WEEKS = 26;

/**
 * Execution history: one contribution graph for all routines and one strip
 * per routine, over the last six months.
 */
export function RoutineHistory({
  routines,
  today,
  index,
  activeId,
  onSelect,
}: {
  routines: Routine[];
  today: string;
  index: CheckIndex;
  activeId?: string;
  onSelect: (routine: Routine) => void;
}) {
  const from = shiftDay(today, -(WEEKS * 7 - 1));

  return (
    <div className="flex flex-col gap-8 px-4 py-5 sm:px-6">
      <section className="flex flex-col gap-3">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Todas as rotinas</h2>
          <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
        </header>
        <RoutineHeatmap
          today={today}
          weeks={WEEKS}
          label="Rotinas feitas por dia nos últimos 6 meses"
          cellFor={(day) => {
            const { due, done } = dayTally(routines, index, day);
            if (due === 0)
              return {
                kind: "off",
                extra: routines.some((routine) =>
                  checkedOn(routine.id, day, index),
                ),
              };
            return {
              kind: "due",
              ratio: done / due,
              label: `${done} de ${due} feitas`,
            };
          }}
        />
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="pb-2 text-sm font-semibold">Por rotina</h2>
        <ul className="flex flex-col divide-y divide-border/60">
          {routines.map((routine) => {
            const period = tally(routine, index, from, today, today);
            return (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => onSelect(routine)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-sm px-2 py-3 text-left transition-colors outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/50 lg:flex-row lg:items-center lg:gap-4",
                    routine.id === activeId &&
                      "bg-accent/60 hover:bg-accent/60",
                  )}
                >
                  <span className="flex min-w-0 flex-col lg:w-56 lg:shrink-0">
                    <span className="truncate text-sm font-medium">
                      {routine.title}
                      {!routine.active && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          pausada
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {frequencyLabel(routine.weekdays)} ·{" "}
                      <span className="tabular-nums">
                        {percent(rate(period))} ({period.done}/{period.due})
                      </span>
                    </span>
                  </span>
                  <RoutineHeatmap
                    today={today}
                    weeks={WEEKS}
                    size="sm"
                    label={`Histórico de ${routine.title}`}
                    className="min-w-0"
                    cellFor={(day) => {
                      const checked = checkedOn(routine.id, day, index);
                      if (!scheduledOn(routine, day, index))
                        return { kind: "off", extra: checked };
                      if (day === today && !checked) return { kind: "off" };
                      return {
                        kind: "due",
                        ratio: checked ? 1 : 0,
                        label: checked ? "feita" : "não feita",
                      };
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
