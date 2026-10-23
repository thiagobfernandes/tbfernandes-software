import { PriorityBadge } from "@/components/shared/priority-badge";
import { DueChip } from "@/features/tasks/components/due-chip";
import type { Task } from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  project?: Project;
  today: string;
};

export function TaskCard({ task, project, today }: TaskCardProps) {
  const done = task.status === "done";
  const checklist = task.checklist;

  return (
    <article className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-sm transition-colors hover:border-input">
      <div className="flex flex-wrap items-center gap-1.5">
        {task.tag && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {task.tag}
          </span>
        )}
        {task.dueDate && (
          <DueChip dueDate={task.dueDate} today={today} done={done} />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3
          className={cn(
            "text-sm leading-snug font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}
      </div>

      {checklist && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(checklist.done / checklist.total) * 100}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {checklist.done}/{checklist.total}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              project
                ? projectColorClasses[project.color].bg
                : "bg-muted-foreground/40",
            )}
          />
          <span className="truncate">{project?.name ?? "No project"}</span>
        </span>
        <PriorityBadge priority={task.priority} />
      </div>
    </article>
  );
}
