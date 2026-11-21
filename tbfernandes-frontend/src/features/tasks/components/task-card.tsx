import { Ban, CheckCircle2, Clock, ListChecks, Target } from "lucide-react";

import { PriorityIcon, priorityText } from "@/components/shared/priority-badge";
import {
  defaultTasksView,
  taskRef,
  type TaskDensity,
  type TaskField,
} from "@/features/tasks/lib/task-view";
import { checklistProgress, type Task } from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { describeDue, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  project?: Project;
  today: string;
  onSelect?: (taskId: string, event: React.MouseEvent) => void;
  density?: TaskDensity;
  fields?: TaskField[];
  /** Seconds logged for this task in time tracking. */
  seconds?: number;
  selected?: boolean;
  /** Opened in the detail panel. */
  active?: boolean;
};

/**
 * A task on a board. The title leads; everything else is secondary metadata
 * on one quiet line. Overdue and blocked keep their semantic color so they
 * stand out among calm cards.
 */
export function TaskCard({
  task,
  project,
  today,
  onSelect,
  density = defaultTasksView.density,
  fields = defaultTasksView.fields,
  seconds,
  selected = false,
  active = false,
}: TaskCardProps) {
  const done = task.status === "done";
  const blocked = task.status === "blocked";
  const show = (field: TaskField) => fields.includes(field);
  const checklist = checklistProgress(task);
  const due =
    task.dueDate && !done ? describeDue(task.dueDate, today) : undefined;
  const compact = density === "compact";
  const detailed = density === "detailed";

  const meta: React.ReactNode[] = [];
  if (show("project") && project)
    meta.push(
      <span key="project" className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            projectColorClasses[project.color].bg,
          )}
        />
        <span className="truncate">{project.name}</span>
      </span>,
    );
  if (show("tag") && task.tag && !compact)
    meta.push(
      <span key="tag" className="truncate">
        {task.tag}
      </span>,
    );
  if (show("checklist") && checklist)
    meta.push(
      <span key="checklist" className="flex items-center gap-1 tabular-nums">
        <ListChecks aria-hidden className="size-3" />
        {checklist.done}/{checklist.total}
      </span>,
    );
  if (show("time") && seconds)
    meta.push(
      <span key="time" className="flex items-center gap-1 tabular-nums">
        <Clock aria-hidden className="size-3" />
        {formatDuration(seconds)}
      </span>,
    );

  return (
    <article
      data-selected={selected || undefined}
      className={cn(
        "group/card relative flex flex-col rounded-lg border bg-card transition-colors hover:border-input",
        compact ? "gap-1 px-2.5 py-2" : "gap-1.5 px-3 py-2.5",
        onSelect &&
          "has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50",
        active && "border-primary/60",
        selected && "border-primary bg-primary/5",
        done && "bg-card/60",
      )}
    >
      <div className="flex items-start gap-2">
        {done ? (
          <CheckCircle2
            aria-label="Concluída"
            className="mt-0.5 size-3.5 shrink-0 text-success"
          />
        ) : blocked ? (
          <Ban
            aria-label="Bloqueada"
            className="mt-0.5 size-3.5 shrink-0 text-destructive"
          />
        ) : null}
        <h3
          className={cn(
            "min-w-0 flex-1 text-[13px] leading-snug font-medium",
            compact && "line-clamp-2",
            done &&
              "text-muted-foreground line-through decoration-muted-foreground/50",
          )}
        >
          {onSelect ? (
            <button
              type="button"
              onClick={(event) => onSelect(task.id, event)}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-lg"
            >
              {task.title}
            </button>
          ) : (
            task.title
          )}
        </h3>
        {show("priority") && task.priority !== "normal" && !done && (
          <span
            title={`Prioridade ${priorityText[task.priority].toLowerCase()}`}
            className="mt-0.5"
          >
            <PriorityIcon priority={task.priority} />
            <span className="sr-only">
              Prioridade {priorityText[task.priority]}
            </span>
          </span>
        )}
      </div>

      {show("description") && task.description && !compact && (
        <p
          className={cn(
            "text-xs leading-relaxed text-muted-foreground",
            detailed ? "line-clamp-4" : "line-clamp-2",
          )}
        >
          {task.description}
        </p>
      )}

      {detailed && show("doneCriteria") && task.doneCriteria && (
        <p className="flex gap-1.5 text-xs text-muted-foreground">
          <Target aria-hidden className="mt-0.5 size-3 shrink-0" />
          <span className="line-clamp-2">{task.doneCriteria}</span>
        </p>
      )}

      {detailed && show("checklist") && checklist && (
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-primary/70"
            style={{ width: `${(checklist.done / checklist.total) * 100}%` }}
          />
        </div>
      )}

      {(meta.length > 0 || (show("due") && due) || show("id") || blocked) && (
        <div className="flex min-w-0 items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground [&>*]:shrink-0 [&>*:first-child]:min-w-0 [&>*:first-child]:shrink">
          {show("id") && <span className="font-mono">{taskRef(task)}</span>}
          {meta}
          {show("due") && due && (
            <span
              className={cn(
                "ml-auto whitespace-nowrap tabular-nums",
                due.tone === "overdue" && "font-medium text-destructive",
                due.tone === "soon" && "text-warning",
              )}
            >
              {due.label}
            </span>
          )}
          {show("due") && done && task.completedAt && (
            <span className="ml-auto whitespace-nowrap">
              {formatShort(task.completedAt)}
            </span>
          )}
        </div>
      )}
    </article>
  );
}
