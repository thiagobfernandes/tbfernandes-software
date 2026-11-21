"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  type ProjectDensity,
  type ProjectField,
  type ProjectRow,
  projectStatusOrder,
} from "@/features/projects/lib/project-view";
import {
  type Company,
  type ProjectStatus,
  projectStatusLabels,
} from "@/features/projects/types/project";
import { formatDuration } from "@/features/time-tracking/lib/time";
import { addDays, daysBetween, formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { projectHref } from "@/lib/routes";
import { workActions } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

import { ProjectCard, dueText } from "./project-card";
import { HealthBadge, ProjectFavoriteButton } from "./project-bits";

type ViewProps = {
  rows: ProjectRow[];
  companies: Company[];
  fields: ProjectField[];
  density: ProjectDensity;
  today: string;
};

const percentText = (value?: number) =>
  value === undefined ? "—" : `${Math.round(value * 100)}%`;

/** Compact table: one project per row, columns follow the chosen fields. */
export function ProjectsTable({
  rows,
  companies,
  fields,
  density,
  today,
}: ViewProps) {
  const show = (field: ProjectField) => fields.includes(field);
  const rowHeight = density === "compact" ? "h-9" : "h-11";
  const cell = cn(rowHeight, "border-b border-border/60 px-2");
  return (
    <table className="w-full min-w-[48rem] border-separate border-spacing-0 text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th scope="col" className="h-9 border-b px-4 font-medium">
            Projeto
          </th>
          {show("company") && (
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Empresa
            </th>
          )}
          <th scope="col" className="h-9 border-b px-2 font-medium">
            Status
          </th>
          {show("health") && (
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Saúde
            </th>
          )}
          {show("tasks") && (
            <th
              scope="col"
              className="h-9 border-b px-2 text-right font-medium"
            >
              Tarefas
            </th>
          )}
          {show("milestones") && (
            <th
              scope="col"
              className="h-9 border-b px-2 text-right font-medium"
            >
              Marcos
            </th>
          )}
          {show("due") && (
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Prazo
            </th>
          )}
          {show("activity") && (
            <th scope="col" className="h-9 border-b px-2 font-medium">
              Atividade
            </th>
          )}
          {show("time") && (
            <th
              scope="col"
              className="h-9 border-b px-2 text-right font-medium"
            >
              Tempo
            </th>
          )}
          <th scope="col" className="h-9 w-10 border-b" aria-label="Favorito" />
        </tr>
      </thead>
      <tbody>
        {rows.map(({ project, insights }) => {
          const company = companies.find(
            (item) => item.id === project.companyId,
          );
          return (
            <tr key={project.id} className="group hover:[&>td]:bg-accent/40">
              <td className={cn(cell, "max-w-72 px-4")}>
                <Link
                  href={projectHref(project.id)}
                  className="flex min-w-0 items-center gap-2 rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      projectColorClasses[project.color].bg,
                    )}
                  />
                  <span className="truncate">{project.name}</span>
                </Link>
              </td>
              {show("company") && (
                <td
                  className={cn(
                    cell,
                    "max-w-48 truncate text-xs text-muted-foreground",
                  )}
                >
                  {company?.name ?? "Iniciativa pessoal"}
                </td>
              )}
              <td className={cn(cell, "text-xs whitespace-nowrap")}>
                {projectStatusLabels[project.status]}
              </td>
              {show("health") && (
                <td className={cell}>
                  <HealthBadge insights={insights} />
                  {!insights.health && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              )}
              {show("tasks") && (
                <td
                  className={cn(cell, "text-right text-xs tabular-nums")}
                  title={`${insights.open.length} abertas`}
                >
                  {percentText(insights.taskProgress)}
                </td>
              )}
              {show("milestones") && (
                <td className={cn(cell, "text-right text-xs tabular-nums")}>
                  {insights.milestones.length
                    ? `${insights.milestonesDone}/${insights.milestones.length}`
                    : "—"}
                </td>
              )}
              {show("due") && (
                <td
                  className={cn(
                    cell,
                    "text-xs whitespace-nowrap",
                    project.dueDate &&
                      project.dueDate < today &&
                      project.status !== "completed" &&
                      "text-destructive",
                  )}
                >
                  {project.dueDate
                    ? `${formatShort(project.dueDate)}${project.status !== "completed" ? ` · ${dueText(project.dueDate, today)}` : ""}`
                    : "—"}
                </td>
              )}
              {show("activity") && (
                <td
                  className={cn(
                    cell,
                    "text-xs whitespace-nowrap text-muted-foreground",
                  )}
                >
                  {insights.lastActivity
                    ? formatShort(insights.lastActivity)
                    : "—"}
                </td>
              )}
              {show("time") && (
                <td
                  className={cn(
                    cell,
                    "text-right text-xs text-muted-foreground tabular-nums",
                  )}
                >
                  {insights.seconds ? formatDuration(insights.seconds) : "—"}
                </td>
              )}
              <td className={cn(cell, "pr-2 text-right")}>
                <ProjectFavoriteButton project={project} className="size-7" />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Kanban by lifecycle status; dropping a card changes the status. */
export function ProjectsBoard({ rows, companies, fields, today }: ViewProps) {
  const [dragging, setDragging] = useState<string>();
  const [over, setOver] = useState<ProjectStatus>();
  return (
    <div className="flex h-full min-h-0 gap-3 overflow-x-auto p-3 sm:p-4">
      {projectStatusOrder.map((status) => {
        const column = rows.filter((row) => row.project.status === status);
        return (
          <section
            key={status}
            aria-label={projectStatusLabels[status]}
            onDragOver={(event) => {
              if (!dragging) return;
              event.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver(undefined)}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData("text/project-id");
              const row = rows.find((item) => item.project.id === id);
              setDragging(undefined);
              setOver(undefined);
              if (!row || row.project.status === status) return;
              workActions.updateProject(id, { status });
              toast.success(
                `${row.project.name}: ${projectStatusLabels[status]}`,
              );
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg transition-colors",
              over === status && "bg-primary/5 ring-1 ring-primary/30",
            )}
          >
            <header className="sticky top-0 flex h-9 items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
              {projectStatusLabels[status]}
              <span className="tabular-nums">{column.length}</span>
            </header>
            <div className="flex min-h-24 flex-col gap-2 overflow-y-auto pb-2">
              {column.map(({ project, insights }) => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/project-id", project.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDragging(project.id);
                  }}
                  onDragEnd={() => {
                    setDragging(undefined);
                    setOver(undefined);
                  }}
                  className={cn(
                    "cursor-grab active:cursor-grabbing",
                    dragging === project.id && "opacity-50",
                  )}
                >
                  <ProjectCard
                    project={project}
                    company={companies.find(
                      (item) => item.id === project.companyId,
                    )}
                    insights={insights}
                    fields={fields}
                    density="compact"
                    today={today}
                    hideStatus
                  />
                </div>
              ))}
              {column.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Arraste um projeto para cá
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const monthName = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: "UTC",
});
/** "set 26", "jan 27". */
const monthLabel = (day: string) =>
  `${monthName.format(new Date(`${day}T00:00:00Z`)).replace(".", "")} ${day.slice(2, 4)}`;

/**
 * Roadmap: one bar per project from start to due date (open-ended ones fade
 * out at today), the goal's milestones as diamonds and a line on today.
 */
export function ProjectsRoadmap({ rows, today }: ViewProps) {
  if (rows.length === 0) return null;
  const starts = rows.map((row) => row.project.startDate);
  const ends = rows.map((row) => row.project.dueDate ?? today);
  const minStart = [...starts].sort()[0];
  const maxEnd = [...ends, today].sort().at(-1)!;
  // Whole months, at most a year back and ahead of today.
  const floor =
    addDays(today, -365) > minStart ? addDays(today, -365) : minStart;
  const ceil = addDays(today, 365) < maxEnd ? addDays(today, 365) : maxEnd;
  const from = `${floor.slice(0, 7)}-01`;
  const endMonth = new Date(`${ceil.slice(0, 7)}-01T00:00:00Z`);
  endMonth.setUTCMonth(endMonth.getUTCMonth() + 1);
  const to = addDays(endMonth.toISOString().slice(0, 10), -1);
  const total = daysBetween(from, to) + 1;
  const pos = (day: string) =>
    (Math.min(Math.max(daysBetween(from, day), 0), total) / total) * 100;

  const months: { day: string; left: number }[] = [];
  for (
    let cursor = new Date(`${from}T00:00:00Z`);
    cursor.toISOString().slice(0, 10) <= to;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  ) {
    const day = cursor.toISOString().slice(0, 10);
    months.push({ day, left: pos(day) });
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="relative min-w-[56rem]">
        <div className="sticky top-0 z-10 flex h-9 border-b bg-background">
          <div className="w-56 shrink-0 px-4 text-xs leading-9 font-medium text-muted-foreground">
            Projeto
          </div>
          <div className="relative flex-1">
            {months.map((month) => (
              <span
                key={month.day}
                className="absolute top-0 h-full border-l border-border/60 pl-1.5 text-[11px] leading-9 text-muted-foreground"
                style={{ left: `${month.left}%` }}
              >
                {monthLabel(month.day)}
              </span>
            ))}
          </div>
        </div>
        <ul>
          {rows.map(({ project, insights }) => {
            const color = projectColorClasses[project.color];
            const end = project.dueDate ?? today;
            const left = pos(project.startDate);
            const width = Math.max(pos(end) - left, 0.8);
            const late =
              project.dueDate &&
              project.dueDate < today &&
              project.status !== "completed";
            return (
              <li
                key={project.id}
                className="group flex h-11 border-b border-border/60 hover:bg-accent/30"
              >
                <Link
                  href={projectHref(project.id)}
                  className="flex w-56 shrink-0 items-center gap-2 px-4 text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <span className="truncate font-medium">{project.name}</span>
                  <HealthBadge insights={insights} showLabel={false} />
                </Link>
                <div className="relative flex-1">
                  {months.map((month) => (
                    <span
                      key={month.day}
                      aria-hidden
                      className="absolute inset-y-0 border-l border-border/30"
                      style={{ left: `${month.left}%` }}
                    />
                  ))}
                  <span
                    title={`${formatShort(project.startDate)} → ${project.dueDate ? formatShort(project.dueDate) : "sem prazo"} · ${projectStatusLabels[project.status]}`}
                    className={cn(
                      "absolute top-1/2 h-5 -translate-y-1/2 overflow-hidden rounded-[5px] px-2 text-[11px] leading-5 font-medium whitespace-nowrap text-white/95",
                      color.bg,
                      project.status === "completed" && "opacity-50",
                      project.status === "paused" && "opacity-60",
                      !project.dueDate &&
                        "[mask-image:linear-gradient(to_right,black_70%,transparent)]",
                      late && "ring-2 ring-destructive/70",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {insights.taskProgress !== undefined &&
                      percentText(insights.taskProgress)}
                  </span>
                  {insights.milestones
                    .filter(
                      (milestone) =>
                        milestone.dueDate &&
                        milestone.dueDate >= from &&
                        milestone.dueDate <= to,
                    )
                    .map((milestone) => (
                      <span
                        key={milestone.id}
                        title={`Marco: ${milestone.title} · ${formatShort(milestone.dueDate!)}${milestone.done ? " · concluído" : ""}`}
                        className={cn(
                          "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-background",
                          milestone.done ? "bg-foreground/70" : "bg-primary",
                        )}
                        style={{ left: `${pos(milestone.dueDate!)}%` }}
                      />
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 left-56"
          aria-hidden
        >
          <span
            className="absolute inset-y-0 w-px bg-primary/70"
            style={{ left: `${pos(today)}%` }}
          />
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-primary" /> Hoje
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 bg-primary" /> Marco da meta
        </span>
        <span>
          Barra: início → prazo, com o progresso das tarefas; sem prazo, termina
          esmaecida em hoje
        </span>
      </p>
    </div>
  );
}
