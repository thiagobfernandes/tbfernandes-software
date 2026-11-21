"use client";

import { heatmapWeeks } from "@/features/routines/lib/routine-stats";
import { cn } from "@/lib/utils";

const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

export type HeatCell =
  /** Not planned (rest day, before the start, after a pause). Never a failure. */
  | { kind: "off"; extra?: boolean }
  /** Planned: share of what was done (0..1). */
  | { kind: "due"; ratio: number; label: string }
  | { kind: "future" };

/** Gold steps by share done; an untouched planned day is only a muted square. */
function cellClass(cell: HeatCell) {
  if (cell.kind === "future") return "bg-transparent";
  if (cell.kind === "off")
    return cell.extra ? "bg-primary/30" : "bg-muted/40 dark:bg-muted/30";
  if (cell.ratio <= 0) return "bg-muted dark:bg-muted/80";
  if (cell.ratio < 0.34) return "bg-primary/30";
  if (cell.ratio < 0.67) return "bg-primary/55";
  if (cell.ratio < 1) return "bg-primary/80";
  return "bg-primary";
}

/**
 * Contribution graph: one column per week (Monday on top), ending in the
 * week of `today`. `cellFor` decides each day; days after today stay empty.
 */
export function RoutineHeatmap({
  today,
  weeks,
  cellFor,
  size = "md",
  label,
  className,
}: {
  today: string;
  weeks: number;
  cellFor: (day: string) => HeatCell;
  size?: "sm" | "md";
  label: string;
  className?: string;
}) {
  const columns = heatmapWeeks(today, weeks);
  const cell = size === "sm" ? "size-2.5" : "size-3";

  return (
    <figure className={cn("flex flex-col gap-1.5", className)}>
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label={label}
      >
        {size === "md" && (
          <div className="flex shrink-0 flex-col gap-[3px] pt-4 pr-1 text-[10px] leading-3 text-muted-foreground">
            {["Seg", "", "Qua", "", "Sex", "", "Dom"].map((text, index) => (
              <span key={index} className="h-3">
                {text}
              </span>
            ))}
          </div>
        )}
        {columns.map((days, column) => {
          const first = days[0];
          const showMonth =
            size === "md" &&
            (column === 0 ||
              first.slice(5, 7) !== columns[column - 1][0].slice(5, 7));
          return (
            <div key={first} className="flex shrink-0 flex-col gap-[3px]">
              {size === "md" && (
                <span className="h-3.5 text-[10px] leading-3 text-muted-foreground capitalize">
                  {showMonth
                    ? monthLabel
                        .format(new Date(`${first}T12:00:00`))
                        .replace(".", "")
                    : ""}
                </span>
              )}
              {days.map((day) => {
                const value: HeatCell =
                  day > today ? { kind: "future" } : cellFor(day);
                const title =
                  value.kind === "due"
                    ? `${dayLabel.format(new Date(`${day}T12:00:00`))}: ${value.label}`
                    : value.kind === "off"
                      ? `${dayLabel.format(new Date(`${day}T12:00:00`))}: ${value.extra ? "feita fora da agenda" : "não planejada"}`
                      : undefined;
                return (
                  <span
                    key={day}
                    title={title}
                    className={cn(
                      "rounded-[3px]",
                      cell,
                      cellClass(value),
                      day === today && "ring-1 ring-foreground/50",
                    )}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      {size === "md" && (
        <figcaption className="flex items-center gap-1.5 self-end text-[10px] text-muted-foreground">
          <span>Não planejado</span>
          <span className="size-2.5 rounded-[3px] bg-muted/40 dark:bg-muted/30" />
          <span className="ml-2">Menos</span>
          {[
            "bg-muted dark:bg-muted/80",
            "bg-primary/30",
            "bg-primary/55",
            "bg-primary/80",
            "bg-primary",
          ].map((tone) => (
            <span key={tone} className={cn("size-2.5 rounded-[3px]", tone)} />
          ))}
          <span>Mais</span>
        </figcaption>
      )}
    </figure>
  );
}
