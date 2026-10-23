import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  FolderKanban,
  ListChecks,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/shared/page-heading";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { RelationTree } from "@/components/shared/relation-tree";
import { SampleDataBadge } from "@/components/shared/sample-data-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "@/features/dashboard/components/metric-card";
import {
  DotRow,
  ProgressRing,
  Sparkline,
  TickBars,
} from "@/features/dashboard/components/metric-visuals";
import { AgendaPanel } from "@/features/dashboard/components/agenda-panel";
import {
  sampleContextTree,
  sampleTrends,
} from "@/features/dashboard/data/sample-dashboard";
import { DueChip } from "@/features/tasks/components/due-chip";
import { projectColorClasses } from "@/lib/project-colors";
import {
  SAMPLE_TODAY,
  findCompany,
  findProject,
  sampleProjects,
  sampleTasks,
} from "@/lib/sample-data/work";
import { daysBetween } from "@/lib/dates";
import { cn } from "@/lib/utils";

// Open tasks due within two days, most urgent first.
const focusTasks = sampleTasks
  .filter(
    (task) =>
      task.status !== "done" &&
      task.dueDate &&
      daysBetween(SAMPLE_TODAY, task.dueDate) <= 2,
  )
  .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

const activeProjectRows = sampleProjects
  .filter((project) => project.status === "active")
  .map((project) => {
    const tasks = sampleTasks.filter((task) => task.projectId === project.id);
    const done = tasks.filter((task) => task.status === "done").length;
    return {
      ...project,
      company: findCompany(project.companyId),
      progress: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  });

const quickActions = [
  { label: "Company", href: "/companies", icon: Building2 },
  { label: "Project", href: "/projects", icon: FolderKanban },
  { label: "Task", href: "/tasks", icon: ListChecks },
  { label: "Note", href: "/knowledge", icon: BookOpen },
];

export function DashboardPage() {
  const openTasks = sampleTasks.filter(
    (task) => task.status !== "done" && task.status !== "canceled",
  );
  const overdue = openTasks.filter(
    (task) => task.dueDate && task.dueDate < SAMPLE_TODAY,
  ).length;
  const doneThisWeek = sampleTasks.filter(
    (task) =>
      task.status === "done" &&
      task.dueDate &&
      daysBetween(task.dueDate, SAMPLE_TODAY) < 7,
  ).length;

  return (
    <div className="relative">
      {/* Soft accent glow at the top of the page, after the Luma reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_60%_100%_at_15%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />
      <PageContainer className="max-w-none">
        <PageHeading
          title="Overview"
          description="What needs your attention across companies, projects, and tasks."
          actions={
            <>
              <SampleDataBadge />
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Button key={label} variant="outline" size="sm" asChild>
                  <Link href={href}>
                    <Icon /> {label}
                  </Link>
                </Button>
              ))}
            </>
          }
        />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <section
              aria-label="Key numbers"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Open tasks"
                value={openTasks.length}
                unit="tasks"
                visual={<TickBars values={sampleTrends.openTasksPerDay} />}
              />
              <MetricCard
                label="Overdue"
                value={overdue}
                unit="tasks"
                visual={<DotRow active={overdue} total={6} />}
              />
              <MetricCard
                label="Active projects"
                value={activeProjectRows.length}
                unit={`/ ${sampleProjects.length}`}
                visual={
                  <ProgressRing
                    value={activeProjectRows.length}
                    total={sampleProjects.length}
                  />
                }
              />
              <MetricCard
                label="Done this week"
                value={doneThisWeek}
                unit="tasks"
                visual={<Sparkline values={sampleTrends.doneLastSevenDays} />}
              />
            </section>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="gap-2 rounded-2xl lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Today</CardTitle>
                  <CardDescription>
                    What needs to be done in the next two days?
                  </CardDescription>
                  <CardAction>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/tasks">
                        All tasks <ArrowUpRight />
                      </Link>
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="px-3">
                  <ul className="flex flex-col">
                    {focusTasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent/60"
                      >
                        <span
                          aria-hidden
                          className="size-4 shrink-0 rounded-full border border-input"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium">
                            {task.title}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {findProject(task.projectId)?.name ?? "No project"}
                          </span>
                        </div>
                        <PriorityBadge priority={task.priority} />
                        <span className="hidden sm:block">
                          <DueChip
                            dueDate={task.dueDate!}
                            today={SAMPLE_TODAY}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="gap-2 rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Active projects</CardTitle>
                  <CardDescription>
                    What is happening in my projects?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-4">
                    {activeProjectRows.map((project) => (
                      <li key={project.id} className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-medium">
                            {project.name}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {project.progress}%
                          </span>
                        </div>
                        <div
                          role="progressbar"
                          aria-label={`${project.name} progress`}
                          aria-valuenow={project.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          className="h-1.5 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              projectColorClasses[project.color].bg,
                            )}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="truncate text-xs text-muted-foreground">
                          {project.company && `${project.company.name} · `}
                          {project.nextDelivery}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="gap-4 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">
                  How your work connects
                </CardTitle>
                <CardDescription>
                  Every task traced back to a project, a company, and a goal.
                </CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/knowledge/graph">
                      Open graph <ArrowUpRight />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-dot-grid px-4 py-8">
                  <RelationTree root={sampleContextTree} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="2xl:sticky 2xl:top-20 2xl:self-start">
            <AgendaPanel tasks={sampleTasks} today={SAMPLE_TODAY} />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
