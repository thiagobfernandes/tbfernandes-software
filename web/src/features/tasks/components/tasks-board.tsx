"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import {
  taskStatuses,
  taskStatusLabels,
  type Task,
  type TaskStatus,
} from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { workActions } from "@/lib/sample-data/store";
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
  onSelectTask?: (taskId: string) => void;
  /** Shows a "+" per column that creates a task in that status. */
  allowCreate?: boolean;
  defaultProjectId?: string;
};

export function TasksBoard({
  tasks,
  projectsById,
  today,
  onSelectTask,
  allowCreate = false,
  defaultProjectId,
}: TasksBoardProps) {
  const [draggingId, setDraggingId] = useState<string>();
  const [overStatus, setOverStatus] = useState<TaskStatus>();

  // Dropping a card on a column moves the task to that status.
  function drop(status: TaskStatus) {
    const task = tasks.find((item) => item.id === draggingId);
    setDraggingId(undefined);
    setOverStatus(undefined);
    if (!task || task.status === status) return;
    const previous = task.status;
    workActions.updateTask(task.id, { status });
    toast.success(`Moved to ${taskStatusLabels[status]}`, {
      description: task.title,
      action: {
        label: "Undo",
        onClick: () => workActions.updateTask(task.id, { status: previous }),
      },
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-6 md:px-6">
      <div className="grid auto-cols-[17rem] grid-flow-col gap-4">
        {taskStatuses.map((status) => {
          const column = tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={taskStatusLabels[status]}
              onDragOver={(event) => {
                if (!draggingId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (overStatus !== status) setOverStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node))
                  setOverStatus(undefined);
              }}
              onDrop={(event) => {
                event.preventDefault();
                drop(status);
              }}
              className={cn(
                "flex flex-col gap-3 rounded-2xl bg-muted/40 p-2.5 ring-2 ring-transparent transition-colors",
                overStatus === status &&
                  draggingId &&
                  "bg-primary/10 ring-primary/50",
              )}
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
                {allowCreate && (
                  <TaskFormDialog
                    defaultStatus={status}
                    defaultProjectId={defaultProjectId}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        aria-label={`Add task to ${taskStatusLabels[status]}`}
                      >
                        <Plus />
                      </Button>
                    }
                  />
                )}
              </header>
              {column.length === 0 ? (
                <p className="rounded-xl border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  {draggingId ? "Drop here" : "No tasks"}
                </p>
              ) : (
                column.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", task.id);
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(undefined);
                      setOverStatus(undefined);
                    }}
                    className={cn(
                      "cursor-grab active:cursor-grabbing",
                      draggingId === task.id && "opacity-40",
                    )}
                  >
                    <TaskCard
                      task={task}
                      project={
                        task.projectId
                          ? projectsById.get(task.projectId)
                          : undefined
                      }
                      today={today}
                      onSelect={onSelectTask}
                    />
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
