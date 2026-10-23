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
import {
  sampleActiveProjects,
  sampleContextTree,
  sampleMetrics,
  sampleTodayTasks,
} from "@/features/dashboard/data/sample-dashboard";

const quickActions = [
  { label: "Company", href: "/companies", icon: Building2 },
  { label: "Project", href: "/projects", icon: FolderKanban },
  { label: "Task", href: "/tasks", icon: ListChecks },
  { label: "Note", href: "/knowledge", icon: BookOpen },
];

export function DashboardPage() {
  const { openTasks, overdue, activeProjects, doneThisWeek } = sampleMetrics;

  return (
    <div className="relative">
      {/* Soft accent glow at the top of the page, after the Luma reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_60%_100%_at_15%_0%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent)]"
      />
      <PageContainer>
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

        <section
          aria-label="Key numbers"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="Open tasks"
            value={openTasks.value}
            unit="tasks"
            visual={<TickBars values={openTasks.perDay} />}
          />
          <MetricCard
            label="Overdue"
            value={overdue.value}
            unit="need attention"
            visual={<DotRow active={overdue.value} total={6} />}
          />
          <MetricCard
            label="Active projects"
            value={activeProjects.value}
            unit={`/ ${activeProjects.total}`}
            visual={
              <ProgressRing
                value={activeProjects.value}
                total={activeProjects.total}
              />
            }
          />
          <MetricCard
            label="Done this week"
            value={doneThisWeek.value}
            unit="tasks"
            visual={<Sparkline values={doneThisWeek.trend} />}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="gap-2 rounded-2xl lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Today</CardTitle>
              <CardDescription>What do I need to do?</CardDescription>
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
                {sampleTodayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="hover:bg-accent/60 flex items-center gap-3 rounded-lg px-3 py-2.5"
                  >
                    <span
                      aria-hidden
                      className="border-input size-4 shrink-0 rounded-full border"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {task.title}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {task.project}
                      </span>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    <span className="text-muted-foreground hidden w-16 text-right text-xs sm:block">
                      {task.due}
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
                {sampleActiveProjects.map((project) => (
                  <li key={project.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm font-medium">
                        {project.name}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {project.progress}%
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${project.name} progress`}
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="bg-muted h-1.5 overflow-hidden rounded-full"
                    >
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground truncate text-xs">
                      {project.company && `${project.company} · `}
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
            <CardTitle className="text-base">How your work connects</CardTitle>
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
            <div className="bg-dot-grid rounded-xl border px-4 py-8">
              <RelationTree root={sampleContextTree} />
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </div>
  );
}
