import { TasksList } from "@/features/tasks/components/tasks-list";
import type { Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

type TasksByProjectProps = {
  tasks: Task[];
  projectsById: Map<string, Project>;
  today: string;
  onSelectTask?: (taskId: string) => void;
};

/** One section per project (by name), tasks without a project last. */
export function TasksByProject({
  tasks,
  projectsById,
  today,
  onSelectTask,
}: TasksByProjectProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhuma tarefa com esses filtros.
      </p>
    );
  }

  const groups = new Map<string | undefined, Task[]>();
  for (const task of tasks) {
    const key =
      task.projectId && projectsById.has(task.projectId)
        ? task.projectId
        : undefined;
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  const sections = [...groups.entries()].sort(([first], [second]) => {
    if (!first) return 1;
    if (!second) return -1;
    return projectsById
      .get(first)!
      .name.localeCompare(projectsById.get(second)!.name, "pt-BR");
  });

  return (
    <div className="flex flex-col gap-6">
      {sections.map(([projectId, projectTasks]) => {
        const project = projectId ? projectsById.get(projectId) : undefined;
        const done = projectTasks.filter(
          (task) => task.status === "done",
        ).length;
        return (
          <section
            key={projectId ?? "none"}
            aria-label={project?.name ?? "Sem projeto"}
            className="flex flex-col gap-2"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-full",
                  project
                    ? projectColorClasses[project.color].bg
                    : "bg-muted-foreground/40",
                )}
              />
              {project?.name ?? "Sem projeto"}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {done}/{projectTasks.length} concluídas
              </span>
            </h2>
            <TasksList
              tasks={projectTasks}
              projectsById={projectsById}
              today={today}
              onSelectTask={onSelectTask}
            />
          </section>
        );
      })}
    </div>
  );
}
