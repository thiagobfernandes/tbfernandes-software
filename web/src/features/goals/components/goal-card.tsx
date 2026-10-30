import Link from "next/link";
import { CheckCircle2, Circle, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Goal } from "@/features/goals/types/goal";
import type { LearningTrack } from "@/features/learning/types/learning";
import { DueChip } from "@/features/tasks/components/due-chip";
import { projectColorClasses } from "@/lib/project-colors";
import { cn } from "@/lib/utils";

const statusStyles: Record<Goal["status"], string> = {
  planned: "text-muted-foreground",
  active: "text-success",
  achieved: "text-muted-foreground",
  dropped: "text-muted-foreground line-through",
};

export function GoalCard({
  goal,
  tracks,
  today,
}: {
  goal: Goal;
  tracks: LearningTrack[];
  today: string;
}) {
  const done = goal.milestones.filter((milestone) => milestone.done).length;
  const total = goal.milestones.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const color = projectColorClasses[goal.color];
  const next = goal.milestones.find((milestone) => !milestone.done);

  return (
    <article className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="flex items-center gap-2 text-lg font-medium">
            <span className={cn("text-base", color.text)} aria-hidden>
              ◎
            </span>
            <span className="truncate">{goal.title}</span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {goal.category}
            </Badge>
            <DueChip dueDate={goal.targetDate} today={today} />
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-medium capitalize",
            statusStyles[goal.status],
          )}
        >
          {goal.status}
        </span>
      </div>

      {goal.description && (
        <p className="text-sm text-muted-foreground">{goal.description}</p>
      )}
      {goal.motivation && (
        <p className="border-l-2 pl-3 text-sm text-muted-foreground italic">
          {goal.motivation}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>
            {done} of {total} milestones
            {next && <> · Next: {next.title}</>}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", color.bg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="flex flex-col divide-y rounded-xl border">
        {goal.milestones.map((milestone) => (
          <li
            key={milestone.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-2.5 text-sm">
              {milestone.done ? (
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
                className={cn(
                  "truncate",
                  milestone.done && "text-muted-foreground line-through",
                )}
              >
                {milestone.title}
              </span>
            </span>
            {milestone.dueDate && (
              <DueChip
                dueDate={milestone.dueDate}
                today={today}
                done={milestone.done}
              />
            )}
          </li>
        ))}
      </ol>

      {tracks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Preparing with:</span>
          {tracks.map((track) => (
            <Link
              key={track.id}
              href="/learning"
              className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-foreground hover:bg-accent"
            >
              <GraduationCap className="size-3.5" aria-hidden />
              {track.title}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
