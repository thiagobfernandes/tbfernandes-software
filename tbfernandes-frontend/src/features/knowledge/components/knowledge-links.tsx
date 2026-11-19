"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, ListChecks } from "lucide-react";
import { projectHref } from "@/lib/routes";

import type { KnowledgeLinks } from "@/features/knowledge/types/knowledge";
import { projectColorClasses } from "@/lib/project-colors";
import { selectors, useAppData } from "@/lib/sample-data/store";
import { cn } from "@/lib/utils";

/** Chips for the projects and tasks a note or snippet is linked to. */
export function KnowledgeLinkChips({
  links,
  className,
}: {
  links: KnowledgeLinks;
  className?: string;
}) {
  const data = useAppData();
  const { findProject, findTask } = selectors(data);
  const projects = links.projectIds
    .map(findProject)
    .filter((p) => p !== undefined);
  const tasks = links.taskIds.map(findTask).filter((t) => t !== undefined);

  if (!projects.length && !tasks.length) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Sem vínculo com projeto ou tarefa.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={projectHref(project.id)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
          >
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full",
                projectColorClasses[project.color].bg,
              )}
            />
            <FolderKanban className="size-3" aria-hidden />
            {project.name}
          </Link>
        </li>
      ))}
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks?q=${encodeURIComponent(task.title)}`}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
          >
            <ListChecks className="size-3" aria-hidden />
            {task.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TagList({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  if (!tags.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
        >
          #{tag}
        </li>
      ))}
    </ul>
  );
}

const chipClass =
  "rounded-full border px-2.5 py-0.5 text-xs outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50";

/**
 * Toggleable tag filter built from the tags in use. Only the first `limit`
 * tags show until the user expands the row, so a large tag set never pushes
 * the list below the fold. Pass tags most used first (`uniqueTags`).
 */
export function TagFilter({
  tags,
  active,
  onChange,
  limit = 10,
}: {
  tags: string[];
  active?: string;
  onChange: (tag?: string) => void;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!tags.length) return null;

  const hidden = Math.max(tags.length - limit, 0);
  let shown = expanded ? tags : tags.slice(0, limit);
  // The active tag stays visible even when the row is collapsed.
  if (active && !shown.includes(active)) shown = [active, ...shown];

  return (
    <div
      role="group"
      aria-label="Filtrar por tag"
      className={cn(
        "flex flex-wrap gap-1.5",
        expanded && "max-h-40 overflow-y-auto pr-1",
      )}
    >
      {shown.map((tag) => {
        const selected = tag === active;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : tag)}
            className={cn(
              chipClass,
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:border-input hover:text-foreground",
            )}
          >
            #{tag}
          </button>
        );
      })}
      {hidden > 0 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={cn(
            chipClass,
            "border-dashed text-muted-foreground hover:text-foreground",
          )}
        >
          {expanded ? "Menos tags" : `+${hidden} tags`}
        </button>
      )}
    </div>
  );
}

/** Tags in use, most used first, then alphabetical. */
export function uniqueTags(items: { tags: string[] }[]) {
  const counts = new Map<string, number>();
  for (const tag of items.flatMap((item) => item.tags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a, ca], [b, cb]) => cb - ca || a.localeCompare(b, "pt-BR"))
    .map(([tag]) => tag);
}
