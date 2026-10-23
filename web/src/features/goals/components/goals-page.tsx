"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  FolderKanban,
  ListChecks,
  Plus,
  Target,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { DotRow, ProgressRing } from "@/components/shared/metric-visuals";
import { PageHeading } from "@/components/shared/page-heading";
import { ProgressBar } from "@/components/shared/progress-bar";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import {
  goalAreaIcons,
  GoalStatusBadge,
} from "@/features/goals/components/goal-meta";
import { goalProgress, tasksOfGoal } from "@/features/goals/lib/goal-progress";
import { goalAreaLabels, type Goal } from "@/features/goals/types/goal";
import { daysBetween, formatShort } from "@/lib/dates";
import { useAppData, type AppData } from "@/lib/sample-data/store";
import { SAMPLE_TODAY } from "@/lib/sample-data/work";

type Filter = "open" | "completed" | "all";

export function GoalsPage() {
  const data = useAppData();
  const [filter, setFilter] = useState<Filter>("open");

  const visible = data.goals.filter((goal) =>
    filter === "all"
      ? true
      : filter === "completed"
        ? goal.status === "completed"
        : goal.status !== "completed",
  );
  const active = data.goals.filter((goal) => goal.status === "active");
  const averageProgress = active.length
    ? Math.round(
        active.reduce(
          (sum, goal) => sum + goalProgress(data, goal).percent,
          0,
        ) / active.length,
      )
    : 0;
  const upcomingMilestones = data.milestones.filter(
    (item) =>
      !item.done &&
      item.dueDate &&
      daysBetween(SAMPLE_TODAY, item.dueDate) <= 30,
  ).length;
  const areas = Object.keys(goalAreaLabels) as Goal["area"][];

  return (
    <PageContainer className="max-w-none">
      <PageHeading
        title="Goals"
        description="Where you want to be, broken into milestones, projects and tasks."
        actions={
          <>
            <SampleDataBadge />
            <GoalFormDialog
              trigger={
                <Button>
                  <Plus /> New goal
                </Button>
              }
            />
          </>
        }
      />

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Active goals"
          value={active.length}
          unit={`/ ${data.goals.length}`}
          visual={
            <ProgressRing
              value={active.length}
              total={data.goals.length || 1}
            />
          }
        />
        <MetricCard
          label="Average progress"
          value={averageProgress}
          unit="%"
          visual={<ProgressRing value={averageProgress} total={100} />}
        />
        <MetricCard
          label="Milestones in 30 days"
          value={upcomingMilestones}
          unit="due"
          visual={<DotRow active={upcomingMilestones} total={6} />}
        />
      </section>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
      >
        <TabsList>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals here"
          description="Create a goal and link projects and tasks to it."
        />
      ) : (
        areas.map((area) => {
          const goals = visible.filter((goal) => goal.area === area);
          if (!goals.length) return null;
          const Icon = goalAreaIcons[area];
          return (
            <section key={area} className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="size-4" aria-hidden /> {goalAreaLabels[area]}
                <span className="tabular-nums">· {goals.length}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} data={data} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </PageContainer>
  );
}

function GoalCard({ goal, data }: { goal: Goal; data: AppData }) {
  const progress = goalProgress(data, goal);
  const projects = data.projects.filter(
    (project) => project.goalId === goal.id,
  ).length;
  const tasks = tasksOfGoal(data, goal.id).length;
  const parent = data.goals.find((item) => item.id === goal.parentId);

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm outline-none hover:border-input focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <div className="flex items-center justify-between gap-2">
        <GoalStatusBadge status={goal.status} />
        {goal.priority === "high" && (
          <span className="text-[11px] font-medium text-warning">
            High priority
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        {parent && (
          <span className="text-xs text-muted-foreground">
            Part of {parent.name}
          </span>
        )}
        <h3 className="font-medium group-hover:text-primary">{goal.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {goal.desiredResult}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">{progress.basis}</span>
          <span className="font-medium tabular-nums">{progress.percent}%</span>
        </div>
        <ProgressBar value={progress.percent} label={`${goal.name} progress`} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FolderKanban className="size-3.5" aria-hidden /> {projects} projects
        </span>
        <span className="flex items-center gap-1">
          <ListChecks className="size-3.5" aria-hidden /> {tasks} tasks
        </span>
        {goal.dueDate && (
          <span className="ml-auto flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />{" "}
            {formatShort(goal.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
}
