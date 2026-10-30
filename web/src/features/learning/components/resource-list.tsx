import {
  BookOpen,
  ExternalLink,
  ListChecks,
  MonitorPlay,
  PlayCircle,
  type LucideIcon,
} from "lucide-react";

import type { LearningResource } from "@/features/learning/types/learning";

const kindIcons: Record<LearningResource["kind"], LucideIcon> = {
  video: PlayCircle,
  course: MonitorPlay,
  book: BookOpen,
  exercises: ListChecks,
};

export function ResourceList({
  title,
  resources,
}: {
  title: string;
  resources: LearningResource[];
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col divide-y rounded-xl border bg-card">
        {resources.map((resource) => {
          const Icon = kindIcons[resource.kind];
          return (
            <li
              key={resource.id}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <span className="flex min-w-0 items-start gap-2.5">
                <Icon
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {resource.title}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {resource.provider} · {resource.use}
                  </span>
                </span>
              </span>
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Open <ExternalLink className="size-3" aria-hidden />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
