"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { PriorityIcon } from "@/components/shared/priority-badge";
import type { Task } from "@/features/tasks/types/task";
import { formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { type AppData, workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

export type WidgetProps = {
  data: AppData;
  /** Planning day (sample day in local mode). */
  today: string;
  now: Date;
  config: Record<string, string>;
  setConfig: (patch: Record<string, string>) => void;
  onOpenTask: (id: string) => void;
  /** Maximized widgets show more rows. */
  expanded: boolean;
  /** Maximizes this widget ("Ver todos"). */
  maximize: () => void;
};

export type WidgetComponent = (props: WidgetProps) => React.ReactNode;

export const isOpen = (task: Task) =>
  task.status !== "done" && task.status !== "canceled";

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>
  );
}

export function More({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-1 self-start text-xs text-muted-foreground hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="flex min-w-24 flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-semibold tabular-nums", tone)}>
        {value}
      </dd>
    </div>
  );
}

export function TaskRows({
  tasks,
  data,
  today,
  onOpenTask,
  limit,
}: {
  tasks: Task[];
  data: AppData;
  today: string;
  onOpenTask: (id: string) => void;
  limit: number;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {tasks.slice(0, limit).map((task) => {
        const project = data.projects.find(
          (item) => item.id === task.projectId,
        );
        return (
          <li key={task.id} className="group flex items-center gap-2.5 py-1.5">
            <button
              type="button"
              aria-label={`Concluir "${task.title}"`}
              title="Concluir"
              onClick={() => {
                workActions.updateTask(task.id, { status: "done" });
                toast.success("Tarefa concluída", {
                  action: {
                    label: "Desfazer",
                    onClick: () =>
                      workActions.updateTask(task.id, { status: task.status }),
                  },
                });
              }}
              className="flex size-4 shrink-0 items-center justify-center rounded-full border border-input outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Check className="size-2.5 text-primary opacity-0 group-hover:opacity-60" />
            </button>
            <PriorityIcon priority={task.priority} />
            <button
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="min-w-0 flex-1 truncate text-left text-sm outline-none hover:text-primary focus-visible:text-primary"
            >
              {task.title}
            </button>
            {project && (
              <span className="hidden max-w-32 items-center gap-1 truncate text-xs text-muted-foreground sm:flex">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    projectColorClasses[project.color].bg,
                  )}
                />
                <span className="truncate">{project.name}</span>
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  task.dueDate < today
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {formatShort(task.dueDate)}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
