import Link from "next/link";
import { Building2 } from "lucide-react";
import { projectHref } from "@/lib/routes";

import {
  projectStatusLabels,
  type Company,
  type Project,
} from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const statusStyles: Record<Project["status"], string> = {
  planned: "text-muted-foreground",
  active: "text-success",
  paused: "text-warning",
  completed: "text-muted-foreground",
};

export function ProjectCard({
  project,
  company,
  tasks,
}: {
  project: Project;
  company?: Company;
  tasks: Task[];
}) {
  const done = tasks.filter((task) => task.status === "done").length;
  const open = tasks.filter(
    (task) => task.status !== "done" && task.status !== "canceled",
  ).length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const color = projectColorClasses[project.color];

  return (
    <Link
      href={projectHref(project.id)}
      className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="flex items-center gap-2 font-medium">
            <span className={cn("text-base", color.text)} aria-hidden>
              #
            </span>
            <span className="truncate group-hover:text-primary">
              {project.name}
            </span>
          </h3>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden />
            {company?.name ?? "Iniciativa pessoal"}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-medium capitalize",
            statusStyles[project.status],
          )}
        >
          {projectStatusLabels[project.status]}
        </span>
      </div>

      {project.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>
            {open} abertas · {done} concluídas
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", color.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>
        {project.nextDelivery && (
          <span className="truncate text-xs text-muted-foreground">
            Próxima: {project.nextDelivery}
          </span>
        )}
      </div>
    </Link>
  );
}
