import { PriorityBadge } from "@/components/shared/priority-badge";
import { DueChip } from "@/features/tasks/components/due-chip";
import { taskStatusLabels, type Task } from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

type TasksListProps = {
  tasks: Task[];
  projectsById: Map<string, Project>;
  today: string;
};

export function TasksList({ tasks, projectsById, today }: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No tasks match these filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-[44rem] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const project = task.projectId
              ? projectsById.get(task.projectId)
              : undefined;
            const done = task.status === "done";
            return (
              <tr
                key={task.id}
                className="border-b last:border-0 hover:bg-accent/40"
              >
                <td className="max-w-80 px-4 py-3">
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "truncate font-medium",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </span>
                    {task.tag && (
                      <span className="text-xs text-muted-foreground">
                        {task.tag}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 rounded-full",
                        project
                          ? projectColorClasses[project.color].bg
                          : "bg-muted-foreground/40",
                      )}
                    />
                    {project?.name ?? "No project"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {taskStatusLabels[task.status]}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3">
                  {task.dueDate ? (
                    <DueChip dueDate={task.dueDate} today={today} done={done} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
