"use client";

import Link from "next/link";
import { FolderKanban, ListChecks } from "lucide-react";

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
            href={`/projects/${project.id}`}
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

/** Toggleable tag filter row built from the tags in use. */
export function TagFilter({
  tags,
  active,
  onChange,
}: {
  tags: string[];
  active?: string;
  onChange: (tag?: string) => void;
}) {
  if (!tags.length) return null;
  return (
    <div
      role="group"
      aria-label="Filtrar por tag"
      className="flex flex-wrap gap-1.5"
    >
      {tags.map((tag) => {
        const selected = tag === active;
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : tag)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}

export function uniqueTags(items: { tags: string[] }[]) {
  return [...new Set(items.flatMap((item) => item.tags))].sort();
}
