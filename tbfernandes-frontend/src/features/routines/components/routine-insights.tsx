"use client";

import {
  type CheckIndex,
  bestStreak,
  percent,
  rate,
  secondsBetween,
  tally,
  weekdayRates,
} from "@/features/routines/lib/routine-stats";
import { streak, weekdayLabels } from "@/features/routines/lib/routines";
import type { Routine } from "@/features/routines/types/routine";
import { formatDuration, shiftDay } from "@/features/time-tracking/lib/time";
import { useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/**
 * Consistency analysis over the last 30 or 90 days: per routine (rate, streaks,
 * logged time against the daily target) and per weekday. Only real checks and
 * time entries; days not planned are left out of every rate.
 */
export function RoutineInsights({
  routines,
  today,
  now,
  index,
  window,
  activeId,
  onSelect,
}: {
  routines: Routine[];
  today: string;
  now: Date;
  index: CheckIndex;
  window: number;
  activeId?: string;
  onSelect: (routine: Routine) => void;
}) {
  const { routineChecks, timeEntries } = useAppData();
  const from = shiftDay(today, -(window - 1));

  const rows = routines
    .map((routine) => {
      const period = tally(routine, index, from, today, today);
      const seconds = secondsBetween(routine.id, timeEntries, from, today, now);
      return {
        routine,
        period,
        ratio: rate(period),
        current: routine.active ? streak(routine, routineChecks, today) : 0,
        best: bestStreak(routine, index, today),
        seconds,
        /** Average per done day, compared with the daily target. */
        average: period.done > 0 ? seconds / period.done : 0,
      };
    })
    .sort(
      (first, second) =>
        (second.ratio ?? -1) - (first.ratio ?? -1) ||
        first.routine.title.localeCompare(second.routine.title, "pt-BR"),
    );

  const total = rows.reduce(
    (sum, row) => ({
      due: sum.due + row.period.due,
      done: sum.done + row.period.done,
    }),
    { due: 0, done: 0 },
  );
  const totalSeconds = rows.reduce((sum, row) => sum + row.seconds, 0);
  const byWeekday = weekdayRates(routines, index, from, today);

  return (
    <div className="flex flex-col gap-8 px-4 py-5 sm:px-6">
      <dl className="flex flex-wrap gap-x-10 gap-y-3">
        <Stat
          label="Consistência"
          value={percent(rate(total))}
          hint={`${total.done} de ${total.due} dias planejados`}
        />
        <Stat
          label="Tempo apontado"
          value={formatDuration(totalSeconds)}
          hint="em rotinas no período"
        />
        <Stat
          label="Melhor sequência"
          value={`${Math.max(0, ...rows.map((row) => row.best))} d`}
          hint="desde o início de cada rotina"
        />
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Por rotina</h2>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="h-9 border-b px-2 font-medium">
                  Rotina
                </th>
                <th scope="col" className="h-9 w-48 border-b px-2 font-medium">
                  Consistência
                </th>
                <th
                  scope="col"
                  className="h-9 border-b px-2 text-right font-medium"
                >
                  Sequência
                </th>
                <th
                  scope="col"
                  className="h-9 border-b px-2 text-right font-medium"
                >
                  Melhor
                </th>
                <th
                  scope="col"
                  className="h-9 border-b px-2 text-right font-medium"
                  title="Média por dia feito / meta diária"
                >
                  Tempo por dia
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.routine.id}
                  className={cn(
                    row.routine.id === activeId
                      ? "[&>td]:bg-accent/60"
                      : "hover:[&>td]:bg-accent/40",
                  )}
                >
                  <td className="h-11 max-w-60 border-b border-border/60 px-2">
                    <button
                      type="button"
                      onClick={() => onSelect(row.routine)}
                      className="block max-w-full truncate rounded-sm text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {row.routine.title}
                    </button>
                  </td>
                  <td className="h-11 border-b border-border/60 px-2">
                    <span
                      className="flex items-center gap-2"
                      title={`${row.period.done} de ${row.period.due} dias planejados`}
                    >
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${(row.ratio ?? 0) * 100}%` }}
                        />
                      </span>
                      <span className="w-10 text-right text-xs tabular-nums">
                        {percent(row.ratio)}
                      </span>
                    </span>
                  </td>
                  <td className="h-11 border-b border-border/60 px-2 text-right text-xs tabular-nums">
                    {row.current > 0 ? `${row.current} d` : "—"}
                  </td>
                  <td className="h-11 border-b border-border/60 px-2 text-right text-xs tabular-nums">
                    {row.best > 0 ? `${row.best} d` : "—"}
                  </td>
                  <td className="h-11 border-b border-border/60 px-2 text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {row.average > 0
                      ? formatDuration(Math.round(row.average))
                      : "—"}
                    {row.routine.targetMinutes && (
                      <span>
                        {" "}
                        / {formatDuration(row.routine.targetMinutes * 60)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Por dia da semana</h2>
        <ul
          className="grid max-w-xl grid-cols-7 items-end gap-2"
          aria-label="Consistência por dia da semana"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((weekday) => {
            const value = byWeekday.get(weekday)!;
            const ratio = rate(value);
            return (
              <li key={weekday} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {percent(ratio)}
                </span>
                <span
                  className="flex h-28 w-full items-end overflow-hidden rounded-md bg-muted/50"
                  title={
                    value.due === 0
                      ? "Nada planejado"
                      : `${value.done} de ${value.due} feitas`
                  }
                >
                  <span
                    className="block w-full rounded-md bg-primary/80"
                    style={{ height: `${(ratio ?? 0) * 100}%` }}
                  />
                </span>
                <span className="text-xs text-muted-foreground">
                  {weekdayLabels[weekday]}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      <dd className="text-xs text-muted-foreground">{hint}</dd>
    </div>
  );
}
