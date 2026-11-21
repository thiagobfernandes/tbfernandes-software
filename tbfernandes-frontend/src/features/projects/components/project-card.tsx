import Link from "next/link";

import type {
  ProjectDensity,
  ProjectField,
} from "@/features/projects/lib/project-view";
import type { ProjectInsights } from "@/features/projects/lib/project-insights";
import {
  type Company,
  type Project,
  projectStatusLabels,
} from "@/features/projects/types/project";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { daysBetween, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { HealthBadge, Meter, ProjectFavoriteButton } from "./project-bits";

/**
 * Portfolio card. Shows only the fields chosen in "Exibição"; task progress
 * and milestones (real progress of the goal) are kept apart on purpose.
 */
export function ProjectCard({
  project,
  company,
  insights,
  fields,
  density,
  today,
  hideStatus = false,
}: {
  project: Project;
  company?: Company;
  insights: ProjectInsights;
  fields: ProjectField[];
  density: ProjectDensity;
  today: string;
  /** On the status board the column already says it. */
  hideStatus?: boolean;
}) {
  const show = (field: ProjectField) => fields.includes(field);
  const color = projectColorClasses[project.color];
  const compact = density === "compact";
  const meta = [
    show("company") ? (company?.name ?? "Iniciativa pessoal") : null,
    hideStatus ? null : projectStatusLabels[project.status],
  ].filter(Boolean);

  return (
    <Link
      href={projectHref(project.id)}
      className={cn(
        "group relative flex flex-col rounded-lg border bg-card transition-colors outline-none hover:border-foreground/20 focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact ? "gap-2 p-3" : "gap-3 p-4",
        project.status === "completed" && "opacity-70",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-3 left-0 w-0.5 rounded-full", color.bg)}
      />
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-sm font-semibold group-hover:text-primary">
            {project.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {meta.join(" · ")}
          </p>
        </div>
        {show("health") && (
          <HealthBadge insights={insights} className="pt-0.5" />
        )}
        <ProjectFavoriteButton
          project={project}
          className="-mt-1 -mr-1 size-7"
        />
      </div>

      {show("description") && project.description && !compact && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {project.description}
        </p>
      )}

      {(show("tasks") || show("milestones")) && (
        <div className="flex flex-col gap-2">
          {show("tasks") && insights.taskProgress !== undefined && (
            <Meter
              label={`Tarefas · ${insights.open.length} ${insights.open.length === 1 ? "aberta" : "abertas"}`}
              value={insights.taskProgress}
              text={`${insights.done.length}/${insights.tasks.filter((task) => task.status !== "canceled").length}`}
              tone={color.bg}
            />
          )}
          {show("milestones") && insights.milestones.length > 0 && (
            <Meter
              label="Marcos da meta"
              value={insights.milestonesDone / insights.milestones.length}
              text={`${insights.milestonesDone}/${insights.milestones.length}`}
            />
          )}
        </div>
      )}

      <dl className="mt-auto flex flex-col gap-1 text-xs empty:hidden">
        {show("next") && (project.nextDelivery || insights.nextDue) && (
          <Row label="Próxima">
            {project.nextDelivery ?? insights.nextDue?.title}
          </Row>
        )}
        {show("due") && project.dueDate && (
          <Row label="Prazo">
            <span
              className={cn(
                project.dueDate < today &&
                  project.status !== "completed" &&
                  "text-destructive",
              )}
            >
              {formatShort(project.dueDate)}
              {project.status !== "completed" &&
                ` · ${dueText(project.dueDate, today)}`}
            </span>
          </Row>
        )}
        {show("activity") && (
          <Row label="Atividade">
            {insights.lastActivity ? formatShort(insights.lastActivity) : "—"}
          </Row>
        )}
        {show("time") && insights.seconds > 0 && (
          <Row label="Tempo">{formatDuration(insights.seconds)}</Row>
        )}
        {show("knowledge") && insights.notes + insights.snippets > 0 && (
          <Row label="Conhecimento">
            {insights.notes} {insights.notes === 1 ? "nota" : "notas"} ·{" "}
            {insights.snippets} snippets
          </Row>
        )}
      </dl>
    </Link>
  );
}

/** "vencido há 3 d", "vence hoje", "em 12 d". */
export function dueText(dueDate: string, today: string) {
  const diff = daysBetween(today, dueDate);
  if (diff < 0) return `vencido há ${-diff} d`;
  if (diff === 0) return "vence hoje";
  return `em ${diff} d`;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}
