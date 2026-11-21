"use client";

import { useState } from "react";
import { Ban, CheckCircle2, ChevronRight, Circle } from "lucide-react";

import { PriorityBadge } from "@/components/shared/priority-badge";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { TaskContextMenu } from "@/features/tasks/components/tasks-board";
import {
  taskRef,
  type TaskColumn,
  type TaskDensity,
  type TaskField,
} from "@/features/tasks/lib/task-view";
import {
  checklistProgress,
  taskStatusLabels,
  type Task,
} from "@/features/tasks/types/task";
import type { Project } from "@/features/projects/types/project";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { describeDue, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

/**
 * List and table layouts of the tasks workspace: grouped sections with a
 * collapsible header; `table` adds aligned property columns.
 */
export function TasksTable({
  sections,
  variant,
  projectsById,
  today,
  density,
  fields,
  onSelectTask,
  selectedIds,
  activeId,
  secondsByTask,
}: {
  sections: TaskColumn[];
  variant: "list" | "table";
  projectsById: Map<string, Project>;
  today: string;
  density: TaskDensity;
  fields: TaskField[];
  onSelectTask: (taskId: string, event?: React.MouseEvent) => void;
  selectedIds: Set<string>;
  activeId?: string;
  secondsByTask: Map<string, number>;
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const show = (field: TaskField) => fields.includes(field);
  const rowHeight =
    density === "compact"
      ? "h-8"
      : density === "detailed"
        ? "min-h-12 py-2"
        : "h-10";
  const visible = sections.filter((section) => section.tasks.length > 0);
  const table = variant === "table";

  if (visible.length === 0) {
    return (
      <p className="px-4 py-16 text-center text-sm text-muted-foreground">
        Nenhuma tarefa com esses filtros.
      </p>
    );
  }

  return (
    <div className={cn("min-w-full pb-8", table && "min-w-[56rem]")}>
      {table && (
        <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_9rem_7rem_8rem_7rem_6rem] gap-3 border-b bg-background px-4 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <span>Tarefa</span>
          <span>Projeto</span>
          <span>Status</span>
          <span>Prazo</span>
          <span>Prioridade</span>
          <span className="text-right">Tempo</span>
        </div>
      )}
      {visible.map((section) => {
        const open = !closed.has(section.key);
        return (
          <section key={section.key} aria-label={section.label}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() =>
                setClosed((current) => {
                  const next = new Set(current);
                  if (next.has(section.key)) next.delete(section.key);
                  else next.add(section.key);
                  return next;
                })
              }
              className={cn(
                "sticky z-[5] flex h-9 w-full items-center gap-2 border-b bg-muted/40 px-4 text-[13px] font-medium outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50",
                table ? "top-[33px]" : "top-0",
              )}
            >
              <ChevronRight
                aria-hidden
                className={cn(
                  "size-3.5 text-muted-foreground transition-transform",
                  open && "rotate-90",
                )}
              />
              <span
                aria-hidden
                className={cn("size-2 rounded-full", section.dotClass)}
              />
              {section.label}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {section.tasks.length}
              </span>
            </button>
            {open && (
              <ul>
                {section.tasks.map((task) => {
                  const project = task.projectId
                    ? projectsById.get(task.projectId)
                    : undefined;
                  const done = task.status === "done";
                  const due =
                    task.dueDate && !done
                      ? describeDue(task.dueDate, today)
                      : undefined;
                  const checklist = checklistProgress(task);
                  const seconds = secondsByTask.get(task.id);
                  const selected = selectedIds.has(task.id);
                  return (
                    <li key={task.id}>
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <div
                            className={cn(
                              "group/row relative grid items-center gap-3 border-b border-border/50 px-4 text-sm transition-colors hover:bg-muted/40",
                              rowHeight,
                              table
                                ? "grid-cols-[minmax(0,1fr)_9rem_7rem_8rem_7rem_6rem]"
                                : "grid-cols-[minmax(0,1fr)_auto]",
                              selected &&
                                "bg-primary/[0.07] hover:bg-primary/10",
                              activeId === task.id &&
                                "bg-accent hover:bg-accent",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              <StatusIcon task={task} />
                              {show("id") && (
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {taskRef(task)}
                                </span>
                              )}
                              <div className="flex min-w-0 flex-col">
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    onSelectTask(task.id, event)
                                  }
                                  className={cn(
                                    "truncate text-left font-medium outline-none after:absolute after:inset-0 focus-visible:underline",
                                    done &&
                                      "text-muted-foreground line-through",
                                  )}
                                >
                                  {task.title}
                                </button>
                                {density === "detailed" &&
                                  show("description") &&
                                  task.description && (
                                    <span className="truncate text-xs text-muted-foreground">
                                      {task.description}
                                    </span>
                                  )}
                              </div>
                              {show("tag") && task.tag && (
                                <span className="shrink-0 rounded bg-muted px-1.5 text-[11px] text-muted-foreground">
                                  {task.tag}
                                </span>
                              )}
                              {show("checklist") && checklist && (
                                <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                  {checklist.done}/{checklist.total}
                                </span>
                              )}
                            </div>

                            {table ? (
                              <>
                                <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                                  {project && (
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        projectColorClasses[project.color].bg,
                                      )}
                                    />
                                  )}
                                  <span className="truncate">
                                    {project?.name ?? "—"}
                                  </span>
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {taskStatusLabels[task.status]}
                                </span>
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground tabular-nums",
                                    due?.tone === "overdue" &&
                                      "font-medium text-destructive",
                                    due?.tone === "soon" && "text-warning",
                                  )}
                                >
                                  {due?.label ??
                                    (task.dueDate
                                      ? formatShort(task.dueDate)
                                      : "—")}
                                </span>
                                <PriorityBadge priority={task.priority} />
                                <span className="text-right text-xs text-muted-foreground tabular-nums">
                                  {seconds ? formatDuration(seconds) : "—"}
                                </span>
                              </>
                            ) : (
                              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                                {show("project") && project && (
                                  <span className="hidden max-w-40 items-center gap-1.5 truncate sm:flex">
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "size-1.5 shrink-0 rounded-full",
                                        projectColorClasses[project.color].bg,
                                      )}
                                    />
                                    <span className="truncate">
                                      {project.name}
                                    </span>
                                  </span>
                                )}
                                {show("time") && seconds && (
                                  <span className="tabular-nums">
                                    {formatDuration(seconds)}
                                  </span>
                                )}
                                {show("due") && due && (
                                  <span
                                    className={cn(
                                      "tabular-nums",
                                      due.tone === "overdue" &&
                                        "font-medium text-destructive",
                                      due.tone === "soon" && "text-warning",
                                    )}
                                  >
                                    {due.label}
                                  </span>
                                )}
                                {show("priority") &&
                                  task.priority !== "normal" && (
                                    <PriorityBadge
                                      priority={task.priority}
                                      iconOnly
                                    />
                                  )}
                              </span>
                            )}
                          </div>
                        </ContextMenuTrigger>
                        <TaskContextMenu task={task} onOpen={onSelectTask} />
                      </ContextMenu>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

function StatusIcon({ task }: { task: Task }) {
  if (task.status === "done")
    return (
      <CheckCircle2
        aria-label="Concluída"
        className="size-4 shrink-0 text-success"
      />
    );
  if (task.status === "blocked")
    return (
      <Ban
        aria-label="Bloqueada"
        className="size-4 shrink-0 text-destructive"
      />
    );
  return (
    <Circle
      aria-label={taskStatusLabels[task.status]}
      className={cn(
        "size-4 shrink-0",
        task.status === "in_progress"
          ? "fill-warning/30 text-warning"
          : "text-muted-foreground/60",
      )}
    />
  );
}
