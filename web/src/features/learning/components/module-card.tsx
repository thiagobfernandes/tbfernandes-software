import { CheckCircle2, Circle } from "lucide-react";

import type {
  LearningModule,
  LearningResource,
} from "@/features/learning/types/learning";
import { DueChip } from "@/features/tasks/components/due-chip";
import { cn } from "@/lib/utils";

const statusLabel: Record<LearningModule["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const statusStyles: Record<LearningModule["status"], string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-success",
  done: "text-muted-foreground",
};

export function ModuleCard({
  index,
  module,
  resources,
  today,
}: {
  index: number;
  module: LearningModule;
  resources: LearningResource[];
  today: string;
}) {
  const done = module.topics.filter((topic) => topic.done).length;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex items-baseline gap-2 font-medium">
          <span className="text-sm text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          {module.title}
        </h3>
        <span
          className={cn(
            "shrink-0 text-xs font-medium",
            statusStyles[module.status],
          )}
        >
          {statusLabel[module.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <DueChip
          dueDate={module.targetDate}
          today={today}
          done={module.status === "done"}
        />
        <span className="tabular-nums">
          {done}/{module.topics.length} topics
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {module.topics.map((topic) => (
          <li key={topic.id} className="flex items-center gap-2 text-sm">
            {topic.done ? (
              <CheckCircle2
                className="size-4 shrink-0 text-success"
                aria-label="Done"
              />
            ) : (
              <Circle
                className="size-4 shrink-0 text-muted-foreground"
                aria-label="Open"
              />
            )}
            <span
              className={cn(topic.done && "text-muted-foreground line-through")}
            >
              {topic.title}
            </span>
          </li>
        ))}
      </ul>

      {resources.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 border-t pt-3">
          {resources.map((resource) => (
            <span
              key={resource.id}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {resource.provider.split(" · ")[0]}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
