import type { Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import {
  addDays,
  daysBetween,
  formatShort,
  isWeekend,
  parseDay,
  weekdayInitial,
} from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const MIN_DAY_WIDTH = 64; // px per day column before the grid scrolls
const COMPACT_DAYS = 3; // bars shorter than this put their label outside
const ROW_HEIGHT = 76;

type ProjectTimelineProps = {
  tasks: Task[];
  projectsById: Map<string, Project>;
  start: string;
  days: number;
  today: string;
};

/**
 * Tasks laid out over days, after the Cindr reference: day header with a
 * highlighted "today", a vertical today marker, striped weekends, and one
 * bar per task with its project color and checklist progress.
 */
export function ProjectTimeline({
  tasks,
  projectsById,
  start,
  days,
  today,
}: ProjectTimelineProps) {
  const end = addDays(start, days - 1);
  const dayList = Array.from({ length: days }, (_, index) =>
    addDays(start, index),
  );
  const rows = tasks
    .filter(
      (task) =>
        task.startDate &&
        task.dueDate &&
        task.dueDate >= start &&
        task.startDate <= end,
    )
    .sort((a, b) => a.startDate!.localeCompare(b.startDate!));
  const todayOffset = daysBetween(start, today);
  const pct = (value: number) => `${(value / days) * 100}%`;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <div className="relative" style={{ minWidth: days * MIN_DAY_WIDTH }}>
        {/* Day header */}
        <div className="flex border-b">
          {dayList.map((day) => {
            const isToday = day === today;
            return (
              <div
                key={day}
                className="flex h-12 flex-1 items-center justify-center"
              >
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {weekdayInitial(day)} {parseDay(day).getUTCDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Grid body */}
        <div
          className="relative"
          style={{ height: Math.max(rows.length, 3) * ROW_HEIGHT + 16 }}
        >
          {dayList.map((day, index) => (
            <div
              key={day}
              aria-hidden
              className={cn(
                "absolute inset-y-0 border-r border-border/50",
                isWeekend(day) &&
                  "bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_oklab,var(--muted)_70%,transparent)_6px_7px)]",
              )}
              style={{ left: pct(index), width: pct(1) }}
            />
          ))}

          {todayOffset >= 0 && todayOffset < days && (
            <div
              aria-hidden
              className="absolute inset-y-0 z-10 w-px bg-primary"
              style={{ left: pct(todayOffset + 0.5) }}
            />
          )}

          {rows.map((task, index) => {
            const project = task.projectId
              ? projectsById.get(task.projectId)
              : undefined;
            const from = Math.max(0, daysBetween(start, task.startDate!));
            const to = Math.min(days - 1, daysBetween(start, task.dueDate!));
            const progress = task.checklist
              ? Math.round((task.checklist.done / task.checklist.total) * 100)
              : task.status === "done"
                ? 100
                : undefined;
            const span = to - from + 1;
            const colorClass = project
              ? projectColorClasses[project.color]
              : undefined;
            const top = index * ROW_HEIGHT + 12;
            const dates = `${formatShort(task.startDate!)} – ${formatShort(task.dueDate!)}`;

            if (span < COMPACT_DAYS) {
              return (
                <div key={task.id}>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute z-20 rounded-lg opacity-40",
                      colorClass?.bg ?? "bg-muted-foreground",
                    )}
                    style={{
                      top,
                      left: `calc(${pct(from)} + 4px)`,
                      width: `calc(${pct(span)} - 8px)`,
                      height: ROW_HEIGHT - 12,
                    }}
                  />
                  <span
                    className="absolute z-20 flex flex-col justify-center whitespace-nowrap"
                    style={{
                      top,
                      left: `calc(${pct(to + 1)} + 4px)`,
                      height: ROW_HEIGHT - 12,
                    }}
                  >
                    <span className="text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {dates}
                      {progress !== undefined && ` · ${progress}%`}
                    </span>
                  </span>
                </div>
              );
            }

            return (
              <div
                key={task.id}
                className={cn(
                  "absolute z-20 flex flex-col justify-between gap-1 overflow-hidden rounded-xl border border-l-4 bg-background/95 px-3 py-2 shadow-sm",
                  colorClass?.border ?? "border-l-muted-foreground",
                )}
                style={{
                  top,
                  left: `calc(${pct(from)} + 4px)`,
                  width: `calc(${pct(span)} - 8px)`,
                  height: ROW_HEIGHT - 12,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {task.title}
                  </span>
                  {progress !== undefined && (
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="hidden h-1 w-12 overflow-hidden rounded-full bg-muted sm:block">
                        <span
                          className="block h-full rounded-full bg-foreground"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {progress}%
                      </span>
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {dates}
                  {task.tag && ` · ${task.tag}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
