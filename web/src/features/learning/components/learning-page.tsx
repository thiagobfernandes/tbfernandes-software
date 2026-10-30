import Link from "next/link";
import { Plus, Target } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { ModuleCard } from "@/features/learning/components/module-card";
import { ResourceList } from "@/features/learning/components/resource-list";
import type { LearningTrack } from "@/features/learning/types/learning";
import { DueChip } from "@/features/tasks/components/due-chip";
import { formatShort } from "@/lib/dates";
import { projectColorClasses } from "@/lib/project-colors";
import { findGoal, sampleLearningTracks } from "@/lib/sample-data/growth";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";
import { cn } from "@/lib/utils";

function TrackSection({ track }: { track: LearningTrack }) {
  const topics = track.modules.flatMap((module) => module.topics);
  const done = topics.filter((topic) => topic.done).length;
  const progress = topics.length ? Math.round((done / topics.length) * 100) : 0;
  const color = projectColorClasses[track.color];
  const goal = findGoal(track.goalId);
  const resourcesById = new Map(
    track.resources.map((resource) => [resource.id, resource]),
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="flex items-center gap-2 text-lg font-medium">
              <span className={cn("text-base", color.text)} aria-hidden>
                #
              </span>
              {track.title}
            </h2>
            {track.description && (
              <p className="text-sm text-muted-foreground">
                {track.description}
              </p>
            )}
          </div>
          <DueChip dueDate={track.targetDate} today={SAMPLE_TODAY} />
        </div>

        {goal && (
          <Link
            href="/goals"
            className="inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium hover:bg-accent"
          >
            <Target className="size-3.5" aria-hidden />
            Goal: {goal.title}
          </Link>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>
              {done} of {topics.length} topics · {formatShort(track.startDate)}{" "}
              – {formatShort(track.targetDate)}
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

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Study loop</h3>
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {track.method.map((step, index) => (
              <li
                key={step}
                className="flex gap-2 rounded-xl bg-muted/60 p-3 text-sm"
              >
                <span className="font-medium text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {track.modules.map((module, index) => (
          <ModuleCard
            key={module.id}
            index={index}
            module={module}
            today={SAMPLE_TODAY}
            resources={module.resourceIds
              .map((id) => resourcesById.get(id))
              .filter((resource) => resource !== undefined)}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResourceList
          title="Main resources"
          resources={track.resources.filter((r) => r.role === "primary")}
        />
        <ResourceList
          title="Support"
          resources={track.resources.filter((r) => r.role === "support")}
        />
      </div>
    </section>
  );
}

export function LearningPage() {
  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Learning"
        description="Study tracks split into modules, each with topics and resources."
        actions={
          <>
            <SampleDataBadge />
            <Button disabled>
              <Plus /> New track
            </Button>
          </>
        }
      />

      {sampleLearningTracks.map((track) => (
        <TrackSection key={track.id} track={track} />
      ))}
    </PageContainer>
  );
}
