import Link from "next/link";
import { Building2, CalendarDays } from "lucide-react";
import { companyHref } from "@/lib/routes";

import {
  CompanyStatusLabel,
  RelationshipBadge,
} from "@/features/companies/components/company-badges";
import type { Company, Project } from "@/features/projects/types/project";
import type { Task } from "@/features/tasks/types/task";
import { formatShort, parseDay } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { isOpenTask } from "@/lib/sample-data/work";
import { cn } from "@/lib/utils";

export function CompanyCard({
  company,
  projects,
  tasks,
}: {
  company: Company;
  projects: Project[];
  tasks: Task[];
}) {
  const openTasks = tasks.filter(isOpenTask).length;

  return (
    <Link
      href={companyHref(company.id)}
      className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-colors outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <Building2 className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate font-medium group-hover:text-primary">
            {company.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <RelationshipBadge relationship={company.relationship} />
            <CompanyStatusLabel status={company.status} />
          </div>
        </div>
      </div>

      {company.description && (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {company.description}
        </p>
      )}

      <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-4">
        <div className="flex flex-col">
          <span className="text-2xl font-light tabular-nums">
            {projects.length}
          </span>
          <span className="text-xs text-muted-foreground">projetos</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-light tabular-nums">{openTasks}</span>
          <span className="text-xs text-muted-foreground">tarefas abertas</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5">
          {projects.slice(0, 3).map((project) => (
            <span
              key={project.id}
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                projectColorClasses[project.color].bg,
              )}
            />
          ))}
          <span className="truncate">
            {projects.map((project) => project.name).join(", ") ||
              "Nenhum projeto ainda"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <CalendarDays className="size-3.5" aria-hidden />
          Desde {formatShort(company.startDate)}{" "}
          {parseDay(company.startDate).getUTCFullYear()}
        </span>
      </div>
    </Link>
  );
}
