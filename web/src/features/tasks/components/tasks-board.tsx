import { TaskCard } from "@/features/tasks/components/task-card";
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
  type TaskStatus,
} from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { cn } from "@/lib/utils";

const statusDot: Record<TaskStatus, string> = {
  backlog: "bg-muted-foreground/50",
  todo: "bg-sky-400",
  in_progress: "bg-warning",
  blocked: "bg-destructive",
  done: "bg-success",
  canceled: "bg-muted-foreground/30",
};

type TasksBoardProps = {
  tasks: Task[];
  projectsById: Map<string, Project>;
  today: string;
};

export function TasksBoard({ tasks, projectsById, today }: TasksBoardProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
      <div className="grid auto-cols-[17rem] grid-flow-col gap-4">
        {taskStatuses.map((status) => {
          const column = tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={taskStatusLabels[status]}
              className="flex flex-col gap-3 rounded-2xl bg-muted/40 p-2.5"
            >
              <header className="flex items-center gap-2 px-1.5 pt-1">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", statusDot[status])}
                />
                <h2 className="text-sm font-medium">
                  {taskStatusLabels[status]}
                </h2>
                <span className="ml-auto rounded-full bg-background px-2 py-px text-xs text-muted-foreground tabular-nums">
                  {column.length}
                </span>
              </header>
              {column.length === 0 ? (
                <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  No tasks
                </p>
              ) : (
                column.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={
                      task.projectId
                        ? projectsById.get(task.projectId)
                        : undefined
                    }
                    today={today}
                  />
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
